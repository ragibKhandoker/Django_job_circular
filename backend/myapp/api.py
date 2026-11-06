"""JSON API consumed by the React frontend (frontend/)."""
import hashlib
import hmac
import json
import secrets
from datetime import timedelta

from bson import ObjectId
from functools import wraps

from django.conf import settings
from django.contrib import auth
from django.contrib.auth.forms import PasswordChangeForm, SetPasswordForm
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import User
from django.db.models import Q
from django.http import FileResponse, Http404, HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from .db_status import ping_mongodb
from .forms import (AccountForm, ApplicantForm, CompanyVerificationForm, EducationalBackgroundForm, JobPostForm,
                    UserProfileForm, WorkExperienceForm)
from .models import Applicant, CompanyVerification, JobPost, Notification, PasswordResetMessage, PasswordResetRequest, UserProfile


def _json_body(request):
    try:
        return json.loads(request.body or b'{}')
    except json.JSONDecodeError:
        return {}


def _form_errors(*forms):
    errors = {}
    for form in forms:
        for field, messages in form.errors.items():
            errors.setdefault(field, []).extend(messages)
    return errors


def api_login_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'detail': 'Authentication required.'}, status=401)
        if _must_change_password(request.user):
            return _password_change_required()
        return view_func(request, *args, **kwargs)
    return wrapper


def _must_change_password(user):
    """True right after a login with a temporary password, until a new password is set."""
    return UserProfile.objects.filter(user=user, must_change_password=True).exists()


def _password_change_required():
    return JsonResponse(
        {'detail': 'Please set a new password before continuing.', 'code': 'password_change_required'},
        status=403,
    )


def api_admin_required(view_func):
    """Staff users only: they review job posts in the admin panel."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'detail': 'Authentication required.'}, status=401)
        if not request.user.is_staff:
            return JsonResponse({'detail': 'Admin access required.'}, status=403)
        return view_func(request, *args, **kwargs)
    return wrapper


def _can_see_job(job, user):
    """Unapproved jobs are only visible to the employer who posted them and to admins."""
    if job.approval_status == JobPost.APPROVAL_APPROVED:
        return True
    return user.is_authenticated and (user.is_staff or job.employer_id == user.id)


# ---------- serializers ----------

def get_profile(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


def company_status(user):
    """'not_submitted' | 'pending' | 'verified' | 'rejected'."""
    verification = CompanyVerification.objects.filter(employer=user).only('status').first()
    return verification.status if verification else 'not_submitted'


def serialize_user(user):
    if not user.is_authenticated:
        return {'is_authenticated': False}
    profile = get_profile(user)
    return {
        'role': profile.role,
        'employer_status': profile.employer_status if profile.is_employer else None,
        'employer_rejection_reason': profile.employer_rejection_reason if profile.is_employer else '',
        'company_status': company_status(user) if profile.is_employer else None,
        'can_post_jobs': profile.can_post_jobs,
        'can_apply': profile.can_apply,
        'is_authenticated': True,
        'id': str(user.id),
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'is_staff': user.is_staff,
        'must_change_password': profile.must_change_password,
        'unread_notifications': Notification.objects.filter(user=user, is_read=False).count(),
    }


def serialize_job(job, user=None):
    return {
        'id': str(job.id),
        'job_id': job.job_id,
        'title': job.title,
        'company_name': job.company_name,
        'location': job.location,
        'salary': job.salary,
        'status': job.status,
        'requirements': job.requirements,
        'educational_level': job.educational_level,
        'experience_level': job.experience_level,
        'deadline': job.deadline.isoformat() if job.deadline else None,
        'created_at': job.created_at.isoformat(),
        'is_owner': bool(user and user.is_authenticated and job.employer_id == user.id),
        'approval_status': job.approval_status,
        'rejection_reason': job.rejection_reason,
        'reviewed_at': job.reviewed_at.isoformat() if job.reviewed_at else None,
    }


def serialize_admin_job(job):
    data = serialize_job(job)
    employer = job.employer
    data['employer'] = {
        'username': employer.username,
        'email': employer.email,
        'name': employer.get_full_name(),
    }
    return data


def serialize_applicant(applicant, detailed=False):
    data = {
        'id': str(applicant.id),
        'job': str(applicant.job_id),
        'full_name': applicant.full_name,
        'email': applicant.email,
        'phone': applicant.phone,
        'address': applicant.address,
        'cover_letter': applicant.cover_letter,
        'resume': applicant.resume.name if applicant.resume else '',
        'linkedin_profile': applicant.linkedin_profile,
        'portfolio_website': applicant.portfolio_website,
        'date_applied': applicant.date_applied.isoformat(),
    }
    if detailed:
        data['work_experiences'] = [
            {
                'company_name': exp.company_name,
                'position': exp.position,
                'responsibilities': exp.responsibilities,
                'start_date': exp.start_date.isoformat() if exp.start_date else None,
                'end_date': exp.end_date.isoformat() if exp.end_date else None,
                'description': exp.description,
                'currently_working': exp.currently_working,
            }
            for exp in applicant.work_experiences.all()
        ]
        data['educational_backgrounds'] = [
            {
                'institution_name': edu.institution_name,
                'degree_type': edu.degree_type,
                'field_of_study': edu.field_of_study,
                'start_year': edu.start_year,
                'end_year': edu.end_year,
                'grade': edu.grade,
            }
            for edu in applicant.educational_backgrounds.all()
        ]
    return data


# ---------- notifications ----------

def notify(user, kind, title, message='', link=''):
    return Notification.objects.create(user=user, kind=kind, title=title, message=message, link=link)


def notify_welcome(user, role):
    name = user.first_name or user.username
    if role == UserProfile.ROLE_EMPLOYER:
        notify(user, Notification.KIND_WELCOME, f'Welcome to JobFinder, {name}!',
               'Your employer account is ready. Verify your company so you can start posting jobs.',
               '/company-verification')
    else:
        notify(user, Notification.KIND_WELCOME, f'Welcome to JobFinder, {name}!',
               'Your account is ready. Complete your profile so employers can get to know you.', '/profile')


def notify_password_changed(user):
    notify(user, Notification.KIND_PASSWORD_CHANGED, 'Your password was changed',
           f'Changed on {timezone.localtime().strftime("%b %d, %Y at %I:%M %p")}. '
           'If this was not you, contact the admin right away.', '/profile')


def notify_job_reviewed(job):
    if job.approval_status == JobPost.APPROVAL_APPROVED:
        notify(job.employer, Notification.KIND_JOB_APPROVED, 'Your job post is live',
               f'"{job.title}" at {job.company_name} was approved and is now visible to job seekers.', '/profile')
    elif job.approval_status == JobPost.APPROVAL_REJECTED:
        reason = f' Reason: {job.rejection_reason}' if job.rejection_reason else ''
        notify(job.employer, Notification.KIND_JOB_REJECTED, 'Your job post was not approved',
               f'"{job.title}" at {job.company_name} was rejected.{reason}', '/profile')


def notify_company_reviewed(verification):
    if verification.status == CompanyVerification.STATUS_VERIFIED:
        notify(verification.employer, Notification.KIND_COMPANY_VERIFIED, 'Your company is verified',
               f'{verification.company_name} was verified by an admin. You can now post jobs.', '/company-verification')
    elif verification.status == CompanyVerification.STATUS_REJECTED:
        reason = f' Reason: {verification.rejection_reason}' if verification.rejection_reason else ''
        notify(verification.employer, Notification.KIND_COMPANY_REJECTED, 'Your company could not be verified',
               f'{verification.company_name} was not verified.{reason} Please fix it and resubmit.', '/company-verification')


def serialize_notification(notification):
    return {
        'id': str(notification.id),
        'kind': notification.kind,
        'title': notification.title,
        'message': notification.message,
        'link': notification.link,
        'is_read': notification.is_read,
        'created_at': notification.created_at.isoformat(),
    }


NOTIFICATION_LIMIT = 30


@require_GET
@api_login_required
def notifications(request):
    """The latest notifications for the logged-in user, newest first."""
    items = Notification.objects.filter(user=request.user)[:NOTIFICATION_LIMIT]
    unread = Notification.objects.filter(user=request.user, is_read=False).count()
    return JsonResponse({'results': [serialize_notification(n) for n in items], 'unread_count': unread})


@require_POST
@api_login_required
def notifications_read(request):
    """Marks notifications as read: {"ids": [...]} for some, or no ids for all of them."""
    ids = _json_body(request).get('ids')
    items = Notification.objects.filter(user=request.user, is_read=False)
    if ids:
        items = items.filter(id__in=[i for i in ids if ObjectId.is_valid(str(i))])
    items.update(is_read=True)
    return JsonResponse({'unread_count': Notification.objects.filter(user=request.user, is_read=False).count()})


# ---------- health ----------

@require_GET
def health(request):
    db_ok, db_message = ping_mongodb(timeout_ms=2000)
    return JsonResponse({'status': 'OK', 'database': 'connected' if db_ok else f'error: {db_message}'})


# ---------- auth ----------

@require_GET
@ensure_csrf_cookie
def csrf(request):
    return JsonResponse({'detail': 'CSRF cookie set.'})


@require_GET
@ensure_csrf_cookie
def me(request):
    return JsonResponse(serialize_user(request.user))


def _new_tab_session(request):
    """
    Logins get a brand-new session. Reusing this tab's current one would make Django
    delete it, and a new tab may share that key with the tab it was opened from.
    """
    request.session = type(request.session)()


@csrf_exempt  # auth comes from the X-Session-Key header, which other sites cannot send
@require_POST
@ensure_csrf_cookie
def fork_session(request):
    """
    A newly opened tab starts with the last login's key; it calls this to get its own copy
    of that session, so logging in or out there never affects the original tab.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'user': serialize_user(request.user), 'session_key': None})
    copy = type(request.session)()
    for key, value in request.session.items():
        copy[key] = value
    copy.create()
    user = request.user
    request.session = copy  # the middleware saves this one; the original stays untouched
    return JsonResponse({'user': serialize_user(user), 'session_key': copy.session_key})


@require_POST
def login(request):
    data = _json_body(request)
    user = auth.authenticate(request, username=data.get('username', ''), password=data.get('password', ''))
    temp_hash = None
    if user is None:
        user, temp_hash = _temp_password_user(data.get('username', ''), data.get('password', ''))
    if user is None:
        return JsonResponse({'detail': 'Invalid credentials'}, status=400)
    # The account may only log in from the tab matching the role it signed up with.
    role = data.get('role')
    roles = dict(UserProfile.ROLE_CHOICES)
    if role not in roles:
        return JsonResponse({'detail': 'Choose job seeker or employer.'}, status=400)
    if not user.is_staff:
        actual = get_profile(user).role
        if actual != role:
            return JsonResponse(
                {'detail': f'This account is registered as {roles[actual].lower()}. '
                           f'Please log in from the {roles[actual]} tab.'},
                status=403,
            )
    if temp_hash:
        # One-time: the temporary password stops working now, and the user must set a new one.
        # Claimed atomically, so two logins at the same moment cannot both use it.
        if not _claim_temp_password(user, temp_hash):
            return JsonResponse({'detail': 'Invalid credentials'}, status=400)
    else:
        # Logged in with their real password after all: no need to force a new one any more.
        UserProfile.objects.filter(user=user, must_change_password=True).update(must_change_password=False)
    _new_tab_session(request)
    auth.login(request, user, backend='django.contrib.auth.backends.ModelBackend')
    # The frontend keeps this key in the tab's sessionStorage and sends it back as X-Session-Key.
    return JsonResponse({
        'detail': 'Logged in successfully',
        'user': serialize_user(user),
        'session_key': request.session.session_key,
    })


@require_POST
def admin_login(request):
    """Admin panel login with email + password; only staff accounts get in."""
    data = _json_body(request)
    email = data.get('email', '').strip()
    account = User.objects.filter(email__iexact=email).first() if email else None
    user = account and auth.authenticate(request, username=account.username, password=data.get('password', ''))
    if not user:
        return JsonResponse({'detail': 'Invalid email or password.'}, status=400)
    if not user.is_staff:
        return JsonResponse({'detail': 'This account does not have admin access.'}, status=403)
    _new_tab_session(request)
    auth.login(request, user)
    return JsonResponse({
        'detail': 'Welcome to the admin panel',
        'user': serialize_user(user),
        'session_key': request.session.session_key,
    })


@require_POST
def logout(request):
    auth.logout(request)
    return JsonResponse({'detail': 'Successfully logged out'})


@require_POST
def signup(request):
    data = _json_body(request)
    username = data.get('username', '')
    email = data.get('email', '')
    if data.get('password1') != data.get('password2'):
        return JsonResponse({'detail': 'Passwords are not matching'}, status=400)
    if User.objects.filter(username=username).exists():
        return JsonResponse({'detail': 'Username is already taken'}, status=400)
    if User.objects.filter(email=email).exists():
        return JsonResponse({'detail': 'Email is already taken'}, status=400)
    role = data.get('role')
    if role not in dict(UserProfile.ROLE_CHOICES):
        return JsonResponse({'detail': 'Choose job seeker or employer.'}, status=400)
    user = User.objects.create_user(
        username=username,
        password=data.get('password1'),
        email=email,
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', ''),
    )
    UserProfile.objects.create(user=user, role=role)
    notify_welcome(user, role)
    if role == UserProfile.ROLE_EMPLOYER:
        detail = 'Employer account created. An admin will verify it before you can post jobs.'
    else:
        detail = 'User created successfully'
    return JsonResponse({'detail': detail}, status=201)


# ---------- forgot password: chat with the admins + one-time temporary password ----------

TEMP_PASSWORD_LIFETIME = timedelta(hours=24)
# No look-alike characters (0/O, 1/l/I), so it is easy to type.
TEMP_PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
RESET_TOKEN_HEADER = 'X-Reset-Token'
MAX_MESSAGE_LENGTH = 1000
MAX_USER_MESSAGES = 50  # per request, so the public chat cannot be used to flood the admins


def _generate_temp_password():
    groups = [''.join(secrets.choice(TEMP_PASSWORD_ALPHABET) for _ in range(4)) for _ in range(3)]
    return '-'.join(groups)


def _hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()


def _keystream(nonce, length):
    # Key derived from the server secret and a fresh nonce per password (the value is at most 32 bytes).
    return hmac.new(settings.SECRET_KEY.encode(), b'temp-password:' + bytes.fromhex(nonce), hashlib.sha256).digest()[:length]


def _encrypt_temp(plain):
    nonce = secrets.token_hex(16)
    data = plain.encode()
    return bytes(a ^ b for a, b in zip(data, _keystream(nonce, len(data)))).hex(), nonce


def _decrypt_temp(cipher, nonce):
    data = bytes.fromhex(cipher)
    return bytes(a ^ b for a, b in zip(data, _keystream(nonce, len(data)))).decode()


def _wipe_temp(reset):
    reset.temp_cipher = ''
    reset.temp_nonce = ''


def _clear_profile_temp(user):
    UserProfile.objects.filter(user=user).update(temp_password='', temp_password_expires_at=None)


def _temp_password_user(username, password):
    """(user, stored hash) when an unexpired temporary password matches, else (None, None)."""
    if not username or not password:
        return None, None
    profile = (UserProfile.objects.select_related('user')
               .filter(user__username=username, user__is_active=True).exclude(temp_password='').first())
    if not profile or not profile.temp_password_expires_at or profile.temp_password_expires_at < timezone.now():
        return None, None
    if not check_password(password, profile.temp_password):
        return None, None
    return profile.user, profile.temp_password


def _claim_temp_password(user, temp_hash):
    """
    Uses up the temporary password: it is wiped from the account (only if it is still the one
    that was checked, so it can be used exactly once) and from the chat. False if already used.
    """
    claimed = UserProfile.objects.filter(user=user, temp_password=temp_hash).update(
        temp_password='', temp_password_expires_at=None, must_change_password=True,
    )
    if not claimed:
        return False
    PasswordResetRequest.objects.filter(user=user, status=PasswordResetRequest.STATUS_ISSUED).exclude(
        temp_cipher='').update(temp_cipher='', temp_nonce='', temp_used_at=timezone.now())
    return True


def _system_message(reset, body, kind=PasswordResetMessage.KIND_TEXT, author=None):
    return PasswordResetMessage.objects.create(
        request=reset, sender=PasswordResetMessage.SENDER_SYSTEM, kind=kind, body=body, author=author,
    )


def _temp_state(reset, message, latest_temp_id):
    """'active' | 'used' | 'expired' | 'replaced' | 'withdrawn' for a temporary-password message."""
    if message.id != latest_temp_id:
        return 'replaced'
    if reset.temp_used_at:
        return 'used'
    if reset.temp_cipher and reset.temp_expires_at and reset.temp_expires_at > timezone.now():
        return 'active'
    if reset.temp_expires_at and reset.temp_expires_at <= timezone.now():
        return 'expired'
    return 'withdrawn'


def serialize_reset_messages(reset, for_user):
    messages = list(reset.messages.select_related('author'))
    temp_ids = [m.id for m in messages if m.kind == PasswordResetMessage.KIND_TEMP_PASSWORD]
    latest_temp_id = temp_ids[-1] if temp_ids else None
    result = []
    for message in messages:
        item = {
            'id': str(message.id),
            'sender': message.sender,
            'kind': message.kind,
            'body': message.body,
            'author': (message.author.get_full_name() or message.author.username) if message.author else None,
            'created_at': message.created_at.isoformat(),
            'is_read': message.read_at is not None,
        }
        if message.kind == PasswordResetMessage.KIND_TEMP_PASSWORD:
            item['state'] = _temp_state(reset, message, latest_temp_id)
            item['expires_at'] = reset.temp_expires_at.isoformat() if reset.temp_expires_at else None
            # Only the user's own chat ever shows the password; the admin view never includes it.
            if for_user and item['state'] == 'active':
                item['temp_password'] = _decrypt_temp(reset.temp_cipher, reset.temp_nonce)
                item['username'] = reset.user.username
                item['role'] = get_profile(reset.user).role  # so "Log in now" opens the right tab
        result.append(item)
    return result


def _mark_read(reset, senders):
    reset.messages.filter(sender__in=senders, read_at__isnull=True).update(read_at=timezone.now())


def _thread_for_token(request):
    token = request.headers.get(RESET_TOKEN_HEADER, '')
    if len(token) < 32:
        return None
    return PasswordResetRequest.objects.select_related('user').filter(access_token_hash=_hash_token(token)).first()


@require_POST
def password_reset(request):
    """
    "Forgot password": opens a chat with the admins and returns its secret token. The reply is
    the same whether or not an account matched, so the form cannot reveal who has an account.
    """
    data = _json_body(request)
    identifier = str(data.get('identifier', '')).strip()[:150]
    message = str(data.get('message', '')).strip()[:MAX_MESSAGE_LENGTH]
    if not identifier:
        return JsonResponse({'detail': 'Enter your username or email address.'}, status=400)

    lookup = Q(email__iexact=identifier) if '@' in identifier else Q(username=identifier)
    user = User.objects.filter(lookup, is_active=True, is_staff=False).first()
    token = secrets.token_urlsafe(32)
    reset = PasswordResetRequest.objects.create(user=user, identifier=identifier, access_token_hash=_hash_token(token))
    if message:
        PasswordResetMessage.objects.create(request=reset, sender=PasswordResetMessage.SENDER_USER, body=message)
    return JsonResponse({'detail': 'Your request has been sent to the admin.', 'token': token}, status=201)


@require_http_methods(['GET', 'POST'])
def password_reset_thread(request):
    """The user's side of the chat, opened with the X-Reset-Token header. POST {body} sends a message."""
    reset = _thread_for_token(request)
    if reset is None:
        return JsonResponse({'detail': 'This request could not be found.'}, status=404)
    if request.method == 'POST':
        if not reset.is_open:
            return JsonResponse({'detail': 'This request is closed. Send a new request if you still need help.'}, status=400)
        body = str(_json_body(request).get('body', '')).strip()
        if not body:
            return JsonResponse({'detail': 'Write a message first.'}, status=400)
        if reset.messages.filter(sender=PasswordResetMessage.SENDER_USER).count() >= MAX_USER_MESSAGES:
            return JsonResponse({'detail': 'Message limit reached for this request.'}, status=429)
        PasswordResetMessage.objects.create(
            request=reset, sender=PasswordResetMessage.SENDER_USER, body=body[:MAX_MESSAGE_LENGTH],
        )
    _mark_read(reset, [PasswordResetMessage.SENDER_ADMIN, PasswordResetMessage.SENDER_SYSTEM])
    return JsonResponse({
        'status': reset.status,
        'identifier': reset.identifier,
        'created_at': reset.created_at.isoformat(),
        'can_reply': reset.is_open,
        # The one temporary password of this request was used up or expired: another needs a new request.
        'needs_new_request': reset.status == PasswordResetRequest.STATUS_ISSUED and not (
            reset.temp_cipher and reset.temp_expires_at and reset.temp_expires_at > timezone.now()
        ),
        'messages': serialize_reset_messages(reset, for_user=True),
    })


@require_GET
def password_reset_thread_status(request):
    """
    Light check the site runs on every page while the user has a request open, to tell them
    the admin replied. Unlike the chat itself it does not mark anything as read.
    """
    reset = _thread_for_token(request)
    if reset is None:
        return JsonResponse({'detail': 'This request could not be found.'}, status=404)
    unread = list(reset.messages.filter(
        sender__in=[PasswordResetMessage.SENDER_ADMIN, PasswordResetMessage.SENDER_SYSTEM], read_at__isnull=True,
    ).order_by('created_at'))
    latest = unread[-1] if unread else None
    temp_ready = bool(reset.temp_cipher and reset.temp_expires_at and reset.temp_expires_at > timezone.now())
    return JsonResponse({
        'status': reset.status,
        'unread': len(unread),
        'temp_password_ready': temp_ready,
        'latest': {
            'id': str(latest.id),
            'sender': latest.sender,
            'kind': latest.kind,
            # The password itself is never in here, only in the chat.
            'body': '' if latest.kind == PasswordResetMessage.KIND_TEMP_PASSWORD else latest.body[:140],
            'created_at': latest.created_at.isoformat(),
        } if latest else None,
    })


@require_POST
def password_set(request):
    """After logging in with a temporary password: choose the new password (no old one needed)."""
    if not request.user.is_authenticated:
        return JsonResponse({'detail': 'Authentication required.'}, status=401)
    profile = get_profile(request.user)
    if not profile.must_change_password:
        return JsonResponse({'detail': 'Use "Change password" on your profile instead.'}, status=400)
    form = SetPasswordForm(request.user, _json_body(request))
    if not form.is_valid():
        return JsonResponse({'detail': 'Please correct the errors below.', 'errors': _form_errors(form)}, status=400)
    user = form.save()
    profile.must_change_password = False
    profile.save(update_fields=['must_change_password'])
    for reset in PasswordResetRequest.objects.filter(user=user, status=PasswordResetRequest.STATUS_ISSUED):
        reset.status = PasswordResetRequest.STATUS_COMPLETED
        reset.completed_at = timezone.now()
        _wipe_temp(reset)
        reset.save(update_fields=['status', 'completed_at', 'temp_cipher', 'temp_nonce'])
        _system_message(reset, 'Your new password is saved. This request is now closed.')
    notify_password_changed(user)
    auth.update_session_auth_hash(request, user)  # keep the user logged in
    # update_session_auth_hash gave the session a new key; the tab must send the new one from now on.
    return JsonResponse({
        'detail': 'Your new password is saved.',
        'user': serialize_user(user),
        'session_key': request.session.session_key,
    })


def serialize_password_request(reset, with_messages=False):
    user = reset.user
    profile = get_profile(user) if user else None
    messages = list(reset.messages.all())
    last = messages[-1] if messages else None
    data = {
        'id': str(reset.id),
        'identifier': reset.identifier,
        'user': {
            'id': str(user.id),
            'username': user.username,
            'name': user.get_full_name(),
            'email': user.email,
            'role': profile.role,
        } if user else None,
        'status': reset.status,
        'rejection_reason': reset.rejection_reason,
        'created_at': reset.created_at.isoformat(),
        'reviewed_at': reset.reviewed_at.isoformat() if reset.reviewed_at else None,
        'reviewed_by': reset.reviewed_by.username if reset.reviewed_by else None,
        'completed_at': reset.completed_at.isoformat() if reset.completed_at else None,
        'temp_password_active': bool(
            reset.temp_cipher and reset.temp_expires_at and reset.temp_expires_at > timezone.now()
        ),
        'temp_password_used': reset.temp_used_at is not None,
        'temp_password_expires_at': reset.temp_expires_at.isoformat() if reset.temp_expires_at else None,
        'unread': sum(1 for m in messages if m.sender == PasswordResetMessage.SENDER_USER and m.read_at is None),
        'message_count': len(messages),
        'last_message': {
            'sender': last.sender,
            'body': 'Temporary password sent' if last.kind == PasswordResetMessage.KIND_TEMP_PASSWORD else last.body,
            'created_at': last.created_at.isoformat(),
        } if last else None,
        # Several open requests for one account can mean someone else is asking in their name.
        'other_open_requests': PasswordResetRequest.objects.filter(
            user=user, status__in=PasswordResetRequest.OPEN_STATUSES,
        ).exclude(id=reset.id).count() if user else 0,
    }
    if with_messages:
        data['messages'] = serialize_reset_messages(reset, for_user=False)
    return data


@require_GET
@api_admin_required
def admin_password_requests(request):
    """Forgot-password chats, newest first; ?status=pending|issued|completed|rejected narrows the list."""
    items = PasswordResetRequest.objects.select_related('user', 'reviewed_by')
    counts = {value: items.filter(status=value).count() for value, _ in PasswordResetRequest.STATUS_CHOICES}
    counts['all'] = sum(counts.values())
    counts['unread'] = PasswordResetMessage.objects.filter(
        sender=PasswordResetMessage.SENDER_USER, read_at__isnull=True,
        request__status__in=PasswordResetRequest.OPEN_STATUSES,
    ).count()
    status = request.GET.get('status', '')
    if status in dict(PasswordResetRequest.STATUS_CHOICES):
        items = items.filter(status=status)
    return JsonResponse({'results': [serialize_password_request(r) for r in items], 'counts': counts})


@require_http_methods(['GET', 'POST'])
@api_admin_required
def admin_password_request_messages(request, request_id):
    """GET: the chat (marks the user's messages read). POST {body}: reply to the user."""
    reset = get_object_or_404(PasswordResetRequest.objects.select_related('user', 'reviewed_by'), id=request_id)
    if request.method == 'POST':
        if not reset.is_open:
            return JsonResponse({'detail': 'This request is closed.'}, status=400)
        body = str(_json_body(request).get('body', '')).strip()
        if not body:
            return JsonResponse({'detail': 'Write a message first.'}, status=400)
        PasswordResetMessage.objects.create(
            request=reset, sender=PasswordResetMessage.SENDER_ADMIN, author=request.user,
            body=body[:MAX_MESSAGE_LENGTH],
        )
    _mark_read(reset, [PasswordResetMessage.SENDER_USER])
    return JsonResponse(serialize_password_request(reset, with_messages=True))


@require_POST
@api_admin_required
def admin_issue_temp_password(request, request_id):
    """
    Creates a one-time temporary password and posts it into the user's chat. It is never
    returned to the admin: the account keeps its hash, the chat an encrypted copy.
    """
    reset = get_object_or_404(PasswordResetRequest.objects.select_related('user'), id=request_id)
    if not reset.is_open:
        return JsonResponse({'detail': 'This request is already closed.'}, status=400)
    if reset.user is None:
        return JsonResponse({'detail': 'No account matches this request.'}, status=400)
    # One temporary password per request: for another one the user sends a new request.
    if reset.status != PasswordResetRequest.STATUS_PENDING:
        return JsonResponse(
            {'detail': 'A temporary password was already sent for this request. '
                       'The user must send a new request to get another one.'},
            status=400,
        )

    temp_password = _generate_temp_password()
    expires = timezone.now() + TEMP_PASSWORD_LIFETIME
    profile = get_profile(reset.user)
    profile.temp_password = make_password(temp_password)
    profile.temp_password_expires_at = expires
    profile.save(update_fields=['temp_password', 'temp_password_expires_at'])
    # Only one temporary password per account: any copy in another chat no longer works.
    PasswordResetRequest.objects.filter(user=reset.user).exclude(id=reset.id).exclude(temp_cipher='').update(
        temp_cipher='', temp_nonce='',
    )
    reset.temp_cipher, reset.temp_nonce = _encrypt_temp(temp_password)
    reset.temp_expires_at = expires
    reset.status = PasswordResetRequest.STATUS_ISSUED
    reset.reviewed_at = timezone.now()
    reset.reviewed_by = request.user
    reset.save(update_fields=['temp_cipher', 'temp_nonce', 'temp_expires_at', 'status', 'reviewed_at', 'reviewed_by'])
    _system_message(
        reset,
        'Here is your one-time temporary password. Log in with it, then choose a new password.',
        kind=PasswordResetMessage.KIND_TEMP_PASSWORD,
        author=request.user,
    )
    return JsonResponse(serialize_password_request(reset, with_messages=True))


@require_POST
@api_admin_required
def admin_reject_password_request(request, request_id):
    reset = get_object_or_404(PasswordResetRequest.objects.select_related('user'), id=request_id)
    if not reset.is_open:
        return JsonResponse({'detail': 'This request is already closed.'}, status=400)
    if reset.temp_cipher and reset.user:
        _clear_profile_temp(reset.user)  # withdraw a temporary password that has not been used yet
    _wipe_temp(reset)
    reset.status = PasswordResetRequest.STATUS_REJECTED
    reset.rejection_reason = str(_json_body(request).get('reason', '')).strip()
    reset.reviewed_at = timezone.now()
    reset.reviewed_by = request.user
    reset.save(update_fields=['temp_cipher', 'temp_nonce', 'status', 'rejection_reason', 'reviewed_at', 'reviewed_by'])
    text = 'An admin closed this request.'
    if reset.rejection_reason:
        text += f' Reason: {reset.rejection_reason}'
    _system_message(reset, text, author=request.user)
    return JsonResponse(serialize_password_request(reset, with_messages=True))


# ---------- jobs ----------

@require_http_methods(['GET', 'POST'])
def jobs(request):
    if request.method == 'POST':
        return _create_job(request)

    queryset = JobPost.objects.filter(approval_status=JobPost.APPROVAL_APPROVED)
    category = request.GET.get('category')
    location = request.GET.get('location', '')
    if category:
        queryset = queryset.filter(title=category)
    if location:
        queryset = queryset.filter(location__icontains=location)
    keyword = request.GET.get('q', '').strip()
    if keyword:
        queryset = queryset.filter(
            Q(title__icontains=keyword)
            | Q(company_name__icontains=keyword)
            | Q(location__icontains=keyword)
            | Q(requirements__icontains=keyword)
            | Q(status__icontains=keyword)
        )
    if request.GET.get('latest') == '1':
        queryset = queryset.order_by('-created_at')
    limit = request.GET.get('limit')
    if limit and limit.isdigit():
        queryset = queryset[:int(limit)]
    return JsonResponse({'results': [serialize_job(job, request.user) for job in queryset]})


@api_login_required
def _create_job(request):
    denied = _post_job_denied(request.user)
    if denied:
        return JsonResponse({'detail': denied}, status=403)
    form = JobPostForm(_json_body(request))
    if not form.is_valid():
        return JsonResponse({'detail': 'Please correct the errors below.', 'errors': _form_errors(form)}, status=400)
    job = form.save(commit=False)
    job.employer = request.user
    # Admins' own posts need no review.
    job.approval_status = JobPost.APPROVAL_APPROVED if request.user.is_staff else JobPost.APPROVAL_PENDING
    job.save()
    if not request.user.is_staff:
        notify(request.user, Notification.KIND_JOB_SUBMITTED, f'"{job.title}" was submitted for review',
               'An admin will check it soon. We will let you know as soon as it is live.', '/profile')
    return JsonResponse(serialize_job(job, request.user), status=201)


def _post_job_denied(user):
    """Why `user` may not post a job, or '' if they may."""
    profile = get_profile(user)
    if profile.can_post_jobs:
        return ''
    if not profile.is_employer:
        return 'Job seekers cannot post jobs. Create an employer account to hire.'
    if profile.employer_status == UserProfile.EMPLOYER_REJECTED:
        return 'Your employer account was not approved, so you cannot post jobs.'
    return 'Your employer account is waiting for admin approval. You can post jobs once it is approved.'


@require_http_methods(['GET', 'DELETE'])
def job_detail(request, job_id):
    job = get_object_or_404(JobPost, id=job_id)
    if request.method == 'DELETE':
        if not request.user.is_authenticated or not (job.employer_id == request.user.id or request.user.is_staff):
            return JsonResponse({'detail': 'You are not allowed to delete this job.'}, status=403)
        job.delete()
        return HttpResponse(status=204)
    if not _can_see_job(job, request.user):
        return JsonResponse({'detail': 'Not found.'}, status=404)
    return JsonResponse(serialize_job(job, request.user))


@require_POST
@api_login_required
def apply(request, job_id):
    if not get_profile(request.user).can_apply:
        return JsonResponse({'detail': 'Employers cannot apply for jobs. Use a job seeker account to apply.'}, status=403)
    job = get_object_or_404(JobPost, id=job_id, approval_status=JobPost.APPROVAL_APPROVED)
    applicant_form = ApplicantForm(request.POST, request.FILES)
    work_forms = [WorkExperienceForm(item) for item in json.loads(request.POST.get('work_experiences', '[]'))]
    edu_forms = [EducationalBackgroundForm(item) for item in json.loads(request.POST.get('educational_backgrounds', '[]'))]

    all_forms = [applicant_form, *work_forms, *edu_forms]
    if not all([form.is_valid() for form in all_forms]):
        errors = _form_errors(applicant_form)
        for prefix, forms in (('work', work_forms), ('edu', edu_forms)):
            for index, form in enumerate(forms):
                for field, messages in form.errors.items():
                    errors[f'{prefix}-{index}-{field}'] = messages
        return JsonResponse({'detail': 'Please correct the errors below.', 'errors': errors}, status=400)

    applicant = applicant_form.save(commit=False)
    applicant.job = job
    applicant.save()
    for form in [*work_forms, *edu_forms]:
        item = form.save(commit=False)
        item.applicant = applicant
        item.save()
    notify(request.user, Notification.KIND_APPLICATION_SENT, f'Application sent: {job.title}',
           f'Your application to {job.company_name} was delivered. Good luck!', '/job-list')
    if job.employer_id and job.employer_id != request.user.id:
        notify(job.employer, Notification.KIND_NEW_APPLICANT, f'New applicant for {job.title}',
               f'{applicant.full_name} just applied. Open their profile to review the CV.',
               f'/candidate/{applicant.id}')
    return JsonResponse(serialize_applicant(applicant, detailed=True), status=201)


# ---------- candidates ----------

@require_GET
@api_login_required
def candidates(request):
    return JsonResponse({'results': [serialize_applicant(a) for a in Applicant.objects.all()]})


@require_GET
def candidate_detail(request, applicant_id):
    applicant = get_object_or_404(Applicant, id=applicant_id)
    return JsonResponse(serialize_applicant(applicant))


# ---------- admin panel ----------

@require_GET
@api_admin_required
def admin_jobs(request):
    """All job posts for review, newest first; ?status=pending|approved|rejected narrows the list."""
    queryset = JobPost.objects.select_related('employer').order_by('-created_at')
    status = request.GET.get('status', '')
    if status in dict(JobPost.APPROVAL_CHOICES):
        queryset = queryset.filter(approval_status=status)
    counts = {
        value: JobPost.objects.filter(approval_status=value).count()
        for value, _ in JobPost.APPROVAL_CHOICES
    }
    counts['all'] = sum(counts.values())
    return JsonResponse({'results': [serialize_admin_job(job) for job in queryset], 'counts': counts})


def _review_job(job_id, approval_status, reason=''):
    job = get_object_or_404(JobPost, id=job_id)
    job.approval_status = approval_status
    job.rejection_reason = reason
    job.reviewed_at = timezone.now()
    job.save(update_fields=['approval_status', 'rejection_reason', 'reviewed_at'])
    notify_job_reviewed(job)
    return JsonResponse(serialize_admin_job(job))


@require_POST
@api_admin_required
def admin_approve_job(request, job_id):
    return _review_job(job_id, JobPost.APPROVAL_APPROVED)


@require_POST
@api_admin_required
def admin_reject_job(request, job_id):
    reason = str(_json_body(request).get('reason', '')).strip()
    return _review_job(job_id, JobPost.APPROVAL_REJECTED, reason)


# ---------- profile ----------

def serialize_profile(request, user):
    profile = get_profile(user)
    jobs = JobPost.objects.filter(employer=user).order_by('-created_at')
    return {
        **serialize_user(user),
        'date_joined': user.date_joined.isoformat(),
        'headline': profile.headline,
        'phone': profile.phone,
        'location': profile.location,
        'bio': profile.bio,
        'skills': profile.skills,
        'website': profile.website,
        'linkedin': profile.linkedin,
        'photo': request.build_absolute_uri(profile.photo.url) if profile.photo else '',
        'updated_at': profile.updated_at.isoformat(),
        'jobs': [serialize_job(job, user) for job in jobs],
    }


@require_http_methods(['GET', 'POST'])
@api_login_required
def profile(request):
    """GET: the logged-in user's profile. POST (multipart): update it; remove_photo=1 clears the photo."""
    user = request.user
    if request.method == 'GET':
        return JsonResponse(serialize_profile(request, user))

    profile_obj, _ = UserProfile.objects.get_or_create(user=user)
    old_photo = profile_obj.photo.name if profile_obj.photo else ''
    account_form = AccountForm(request.POST, instance=user)
    profile_form = UserProfileForm(request.POST, request.FILES, instance=profile_obj)
    if not (account_form.is_valid() & profile_form.is_valid()):
        errors = _form_errors(account_form, profile_form)
        return JsonResponse({'detail': 'Please correct the errors below.', 'errors': errors}, status=400)

    account_form.save()
    profile_obj = profile_form.save(commit=False)
    if request.POST.get('remove_photo') == '1' and 'photo' not in request.FILES:
        profile_obj.photo = None
    profile_obj.save()
    new_photo = profile_obj.photo.name if profile_obj.photo else ''
    if old_photo and old_photo != new_photo:
        profile_obj.photo.storage.delete(old_photo)
    notify(user, Notification.KIND_PROFILE_UPDATED, 'Your profile was updated',
           'Your latest details are now visible on your profile.', '/profile')
    return JsonResponse({'detail': 'Profile updated successfully', 'profile': serialize_profile(request, user)})


@require_POST
@api_login_required
def password_change(request):
    form = PasswordChangeForm(request.user, _json_body(request))
    if not form.is_valid():
        return JsonResponse({'detail': 'Please correct the errors below.', 'errors': _form_errors(form)}, status=400)
    user = form.save()
    notify_password_changed(user)
    auth.update_session_auth_hash(request, user)  # keep the user logged in
    # That gives the session a new key; the tab must send the new one from now on.
    return JsonResponse({'detail': 'Password changed successfully', 'session_key': request.session.session_key})


# ---------- admin panel: employer accounts ----------

def serialize_employer(request, profile):
    user = profile.user
    return {
        'id': str(user.id),
        'username': user.username,
        'name': user.get_full_name(),
        'email': user.email,
        'date_joined': user.date_joined.isoformat(),
        'status': profile.employer_status,
        'rejection_reason': profile.employer_rejection_reason,
        'reviewed_at': profile.employer_reviewed_at.isoformat() if profile.employer_reviewed_at else None,
        'job_count': JobPost.objects.filter(employer=user).count(),
        # Profile details the employer filled in on /profile, so admins can verify them.
        'headline': profile.headline,
        'phone': profile.phone,
        'location': profile.location,
        'bio': profile.bio,
        'website': profile.website,
        'linkedin': profile.linkedin,
        'photo': request.build_absolute_uri(profile.photo.url) if profile.photo else '',
        'company_status': company_status(user),
    }


@require_GET
@api_admin_required
def admin_employers(request):
    """Employer accounts, newest first; ?status=pending|approved|rejected narrows the list."""
    employers = UserProfile.objects.filter(role=UserProfile.ROLE_EMPLOYER).select_related('user')
    counts = {
        value: employers.filter(employer_status=value).count()
        for value, _ in UserProfile.EMPLOYER_STATUS_CHOICES
    }
    counts['all'] = sum(counts.values())
    status = request.GET.get('status', '')
    if status in dict(UserProfile.EMPLOYER_STATUS_CHOICES):
        employers = employers.filter(employer_status=status)
    employers = sorted(employers, key=lambda p: p.user.date_joined, reverse=True)
    return JsonResponse({'results': [serialize_employer(request, p) for p in employers], 'counts': counts})


def _review_employer(request, user_id, status, reason=''):
    profile = get_object_or_404(UserProfile, user_id=user_id, role=UserProfile.ROLE_EMPLOYER)
    profile.employer_status = status
    profile.employer_rejection_reason = reason
    profile.employer_reviewed_at = timezone.now()
    profile.save(update_fields=['employer_status', 'employer_rejection_reason', 'employer_reviewed_at'])
    return JsonResponse(serialize_employer(request, profile))


@require_POST
@api_admin_required
def admin_approve_employer(request, user_id):
    return _review_employer(request, user_id, UserProfile.EMPLOYER_APPROVED)


@require_POST
@api_admin_required
def admin_reject_employer(request, user_id):
    reason = str(_json_body(request).get('reason', '')).strip()
    return _review_employer(request, user_id, UserProfile.EMPLOYER_REJECTED, reason)


# ---------- company verification ----------

COMPANY_FIELDS = [
    'company_name', 'trade_license_number', 'company_type', 'industry', 'year_established',
    'company_address', 'company_email', 'company_phone', 'company_website',
    'contact_person', 'contact_designation', 'ceo_name',
]
DOCUMENT_FIELDS = dict(CompanyVerification.DOCUMENTS)


def serialize_company_verification(verification):
    employer = verification.employer
    return {
        **{field: getattr(verification, field) for field in COMPANY_FIELDS},
        'employer': {
            'id': str(employer.id),
            'username': employer.username,
            'name': employer.get_full_name(),
            'email': employer.email,
        },
        # Links go through company_document(), which checks who is asking.
        'documents': [
            {
                'field': field,
                'label': label,
                'name': getattr(verification, field).name.rsplit('/', 1)[-1],
                'url': f'/api/company-verification/{employer.id}/documents/{field}/',
            }
            for field, label in CompanyVerification.DOCUMENTS
            if getattr(verification, field)
        ],
        'status': verification.status,
        'rejection_reason': verification.rejection_reason,
        'submitted_at': verification.submitted_at.isoformat(),
        'reviewed_at': verification.reviewed_at.isoformat() if verification.reviewed_at else None,
    }


@require_http_methods(['GET', 'POST'])
@api_login_required
def company_verification(request):
    """Employers only. GET: their verification request (or null). POST (multipart): submit or update it."""
    if not get_profile(request.user).is_employer:
        return JsonResponse({'detail': 'Only employer accounts can verify a company.'}, status=403)
    verification = CompanyVerification.objects.filter(employer=request.user).first()
    if request.method == 'GET':
        return JsonResponse({'verification': serialize_company_verification(verification) if verification else None})

    old_files = {field: getattr(verification, field).name for field in DOCUMENT_FIELDS} if verification else {}
    form = CompanyVerificationForm(request.POST, request.FILES, instance=verification)
    if not form.is_valid():
        return JsonResponse({'detail': 'Please correct the errors below.', 'errors': _form_errors(form)}, status=400)

    verification = form.save(commit=False)
    verification.employer = request.user
    # Every submission (including edits to a verified company) goes back to the admins.
    verification.status = CompanyVerification.STATUS_PENDING
    verification.rejection_reason = ''
    verification.submitted_at = timezone.now()
    verification.reviewed_at = None
    for field in DOCUMENT_FIELDS:
        # Optional documents can be removed with remove_<field>=1.
        if field != 'trade_license' and request.POST.get(f'remove_{field}') == '1' and field not in request.FILES:
            setattr(verification, field, None)
    verification.save()

    for field, old_name in old_files.items():
        new_name = getattr(verification, field).name or ''
        if old_name and old_name != new_name:
            CompanyVerification._meta.get_field(field).storage.delete(old_name)
    notify(request.user, Notification.KIND_COMPANY_SUBMITTED, 'Company details received',
           f'{verification.company_name} is now waiting for admin review. You will hear from us here.',
           '/company-verification')
    return JsonResponse({
        'detail': 'Company details submitted. An admin will review your documents soon.',
        'verification': serialize_company_verification(verification),
    })


@require_GET
@api_login_required
def company_document(request, user_id, field):
    """Streams one verification document; only its employer and admins may open it."""
    if field not in DOCUMENT_FIELDS:
        raise Http404
    if not (request.user.is_staff or str(request.user.id) == str(user_id)):
        return JsonResponse({'detail': 'You cannot view this document.'}, status=403)
    verification = get_object_or_404(CompanyVerification, employer_id=user_id)
    document = getattr(verification, field)
    if not document:
        raise Http404
    try:
        handle = document.open('rb')
    except FileNotFoundError:
        raise Http404
    name = document.name.rsplit('/', 1)[-1]
    response = FileResponse(handle, filename=name)  # inline, so PDFs and images open in the browser
    response['X-Content-Type-Options'] = 'nosniff'
    response['Cache-Control'] = 'private, no-store'
    return response


@require_GET
@api_admin_required
def admin_companies(request):
    """Company verification requests, newest first; ?status=pending|verified|rejected narrows the list."""
    items = CompanyVerification.objects.select_related('employer')
    counts = {value: items.filter(status=value).count() for value, _ in CompanyVerification.STATUS_CHOICES}
    counts['all'] = sum(counts.values())
    status = request.GET.get('status', '')
    if status in dict(CompanyVerification.STATUS_CHOICES):
        items = items.filter(status=status)
    items = sorted(items, key=lambda v: v.submitted_at, reverse=True)
    return JsonResponse({'results': [serialize_company_verification(v) for v in items], 'counts': counts})


def _review_company(user_id, status, reason=''):
    verification = get_object_or_404(CompanyVerification, employer_id=user_id)
    verification.status = status
    verification.rejection_reason = reason
    verification.reviewed_at = timezone.now()
    verification.save(update_fields=['status', 'rejection_reason', 'reviewed_at'])

    # The admin panel only has the Companies section now: verifying the company is what
    # approves the employer account (lets them post jobs); rejecting it blocks posting.
    profile = get_profile(verification.employer)
    if profile.is_employer:
        verified = status == CompanyVerification.STATUS_VERIFIED
        profile.employer_status = UserProfile.EMPLOYER_APPROVED if verified else UserProfile.EMPLOYER_REJECTED
        profile.employer_rejection_reason = '' if verified else (reason or 'Your company could not be verified.')
        profile.employer_reviewed_at = verification.reviewed_at
        profile.save(update_fields=['employer_status', 'employer_rejection_reason', 'employer_reviewed_at'])
    notify_company_reviewed(verification)
    return JsonResponse(serialize_company_verification(verification))


@require_POST
@api_admin_required
def admin_verify_company(request, user_id):
    return _review_company(user_id, CompanyVerification.STATUS_VERIFIED)


@require_POST
@api_admin_required
def admin_reject_company(request, user_id):
    reason = str(_json_body(request).get('reason', '')).strip()
    return _review_company(user_id, CompanyVerification.STATUS_REJECTED, reason)
