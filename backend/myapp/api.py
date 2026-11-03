"""JSON API consumed by the React frontend (frontend/)."""
import json
from functools import wraps

from django.contrib import auth
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.models import User
from django.db.models import Q
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from .db_status import ping_mongodb
from .forms import ApplicantForm, EducationalBackgroundForm, JobPostForm, WorkExperienceForm
from .models import Applicant, JobPost


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


# ---------- serializers ----------

def serialize_user(user):
    if not user.is_authenticated:
        return {'is_authenticated': False}
    return {
        'is_authenticated': True,
        'id': str(user.id),
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
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
    }


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
    User.objects.create_user(
        username=username,
        password=data.get('password1'),
        email=email,
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', ''),
    )
    return JsonResponse({'detail': 'User created successfully'}, status=201)


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

    queryset = JobPost.objects.all()
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
    form = JobPostForm(_json_body(request))
    if not form.is_valid():
        return JsonResponse({'detail': 'Please correct the errors below.', 'errors': _form_errors(form)}, status=400)
    job = form.save(commit=False)
    job.employer = request.user
    job.save()
    return JsonResponse(serialize_job(job, request.user), status=201)


@require_http_methods(['GET', 'DELETE'])
def job_detail(request, job_id):
    job = get_object_or_404(JobPost, id=job_id)
    if request.method == 'DELETE':
        if not request.user.is_authenticated or job.employer_id != request.user.id:
            return JsonResponse({'detail': 'You are not allowed to delete this job.'}, status=403)
        job.delete()
        return HttpResponse(status=204)
    return JsonResponse(serialize_job(job, request.user))


@require_POST
@api_login_required
def apply(request, job_id):
    job = get_object_or_404(JobPost, id=job_id)
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
