"""JSON API consumed by the React frontend (frontend/)."""
import json
from functools import wraps

from django.contrib import auth
from django.contrib.auth.forms import PasswordChangeForm, PasswordResetForm
from django.contrib.auth.models import User
from django.db.models import Q
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from .db_status import ping_mongodb
from .forms import (AccountForm, ApplicantForm, EducationalBackgroundForm, JobPostForm, UserProfileForm,
                    WorkExperienceForm)
from .models import Applicant, JobPost, UserProfile


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
        return view_func(request, *args, **kwargs)
    return wrapper


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


def serialize_user(user):
    if not user.is_authenticated:
        return {'is_authenticated': False}
    profile = get_profile(user)
    return {
        'role': profile.role,
        'employer_status': profile.employer_status if profile.is_employer else None,
        'employer_rejection_reason': profile.employer_rejection_reason if profile.is_employer else '',
        'can_post_jobs': profile.can_post_jobs,
        'can_apply': profile.can_apply,
        'is_authenticated': True,
        'id': str(user.id),
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'is_staff': user.is_staff,
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


@require_POST
def login(request):
    data = _json_body(request)
    user = auth.authenticate(request, username=data.get('username', ''), password=data.get('password', ''))
    if user is None:
        return JsonResponse({'detail': 'Invalid credentials'}, status=400)
    auth.login(request, user)
    return JsonResponse({'detail': 'Logged in successfully', 'user': serialize_user(user)})


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
    auth.login(request, user)
    return JsonResponse({'detail': 'Welcome to the admin panel', 'user': serialize_user(user)})


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
    if role == UserProfile.ROLE_EMPLOYER:
        detail = 'Employer account created. An admin will verify it before you can post jobs.'
    else:
        detail = 'User created successfully'
    return JsonResponse({'detail': detail}, status=201)


@require_POST
def password_reset(request):
    form = PasswordResetForm(_json_body(request))
    if not form.is_valid():
        return JsonResponse({'detail': 'Enter a valid email address.'}, status=400)
    form.save(request=request)
    return JsonResponse({'detail': 'Password reset email sent.'})


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
    return JsonResponse({'detail': 'Profile updated successfully', 'profile': serialize_profile(request, user)})


@require_POST
@api_login_required
def password_change(request):
    form = PasswordChangeForm(request.user, _json_body(request))
    if not form.is_valid():
        return JsonResponse({'detail': 'Please correct the errors below.', 'errors': _form_errors(form)}, status=400)
    user = form.save()
    auth.update_session_auth_hash(request, user)  # keep the user logged in
    return JsonResponse({'detail': 'Password changed successfully'})


# ---------- admin panel: employer accounts ----------

def serialize_employer(profile):
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
    return JsonResponse({'results': [serialize_employer(p) for p in employers], 'counts': counts})


def _review_employer(user_id, status, reason=''):
    profile = get_object_or_404(UserProfile, user_id=user_id, role=UserProfile.ROLE_EMPLOYER)
    profile.employer_status = status
    profile.employer_rejection_reason = reason
    profile.employer_reviewed_at = timezone.now()
    profile.save(update_fields=['employer_status', 'employer_rejection_reason', 'employer_reviewed_at'])
    return JsonResponse(serialize_employer(profile))


@require_POST
@api_admin_required
def admin_approve_employer(request, user_id):
    return _review_employer(user_id, UserProfile.EMPLOYER_APPROVED)


@require_POST
@api_admin_required
def admin_reject_employer(request, user_id):
    reason = str(_json_body(request).get('reason', '')).strip()
    return _review_employer(user_id, UserProfile.EMPLOYER_REJECTED, reason)
