import re
from functools import wraps

from django.contrib import auth, messages
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import check_password
from django.contrib.auth.models import User, auth
from django.db.models import Q
from django.http import HttpResponse, HttpResponseForbidden
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.views import View

from .forms import (ApplicantForm, EducationalBackgroundFormSet, JobPostForm,
                    WorkExperienceForm, WorkExperienceFormSet)
from .models import (Applicant, Candidate, EducationalBackground, Employee,
                     JobApplicationForm, JobPost, WorkExperience)

email_address=''
password=''
confirm_password=''
# Create your views here.
def home_view(request):
    latest_jobs = JobPost.objects.order_by('-created_at')[:4]
    user = request.user
    can_post_job = hasattr(user,'employerprofile')
    can_apply_job = hasattr(user,'candidateprofile')

    context = {
        'latest_jobs': latest_jobs,
        'can_post_job': can_post_job,
        'can_apply_job': can_apply_job,
    }
    return render(request, 'home.html', context)
def employer_login_view(request):
    print(request)
    if request.method == 'POST':

        username = request.POST['username']
        password = request.POST['password']
        user = auth.authenticate(request,username=username,password=password)
        print(user)
        if user is not None:
            auth.login(request,user)
            messages.info(request,'Logged in successfully')
            return redirect('/')
        else:
            messages.info(request,'Invalid credentials')
            return redirect('employer_login')
    else:
        return render(request,'login_employer.html')
def candidate_login_view(request):
    if request.method == 'POST':
        print(request)
        username = request.POST['username']
        password = request.POST['password']
        user = auth.authenticate(request,username=username,password=password)
        print(user)
        if user is not None:
            auth.login(request,user)
            messages.info(request,'Logged in successfully')
            return redirect('/')
        else:
            messages.info(request,'Invalid credentials')
            return redirect('candidate_login')
    else:
        return render(request,'login_candidate.html')

def login_choice_view(request):
    return render(request,'login_choice.html')


def logout_view(request):
    logout(request)
    messages.success(request,'Successfully logged out')
    # print("User logged out")
    return redirect('home')

def employer_signup_view(request):
    if request.method == 'POST':
        first_name = request.POST['first_name']
        last_name = request.POST['last_name']
        username = request.POST['username']
        password1 = request.POST['password1']
        password2 = request.POST['password2']
        email = request.POST['email']
        if password1 == password2:
            if User.objects.filter(username=username).exists():
                messages.info(request,'Username is already taken')
                return redirect('employer_signup')
            elif User.objects.filter(email=email).exists():
                messages.info(request,'Email is already taken')
                return redirect('employer_signup')
            else:
                user = User.objects.create_user(username=username,password=password1,email=email,first_name=first_name,last_name=last_name)
                user.save()
                messages.info(request,'User created successfully')
                return redirect('login')
        else:
            messages.info(request,'Passwords are not matching')
            return redirect('employer_signup')
    else:
        return render(request,'employer_signup.html')

def candidate_signup_view(request):
    if request.method == 'POST':
        first_name = request.POST['first_name']
        last_name = request.POST['last_name']
        username = request.POST['username']
        password1 = request.POST['password1']
        password2 = request.POST['password2']
        email = request.POST['email']

        if password1 == password2:
            if User.objects.filter(username=username).exists():
                messages.info(request,'username is already taken')
                return redirect('candidate_signup')
            elif User.objects.filter(email=email).exists():
                messages.info(request,'Email is already taken')
                return redirect('candidate_signup')
            else:
                user = User.objects.create_user(username=username,password=password1,email=email,first_name=first_name,last_name=last_name)
                user.save()
                messages.info(request,'User created successfully')
                return redirect('login')
        else:
            messages.info(request,'Passwords are not matching')
            return redirect('candidate_signup')
    else:
        return render(request,'candidate_signup.html')


def job_list_view(request):
    user_role = None
    if request.user.is_authenticated:
        if Candidate.objects.filter(user=request.user).exists():
            user_role = 'candidate'
        elif Employee.objects.filter(user=request.user).exists():
            user_role = 'employer'
    context = {
        'user_role': user_role,
        'jobs': JobPost.objects.all(),
    }
    return render(request,'jobs/job_list.html',context)

def total_jobs_view(request):
    location = request.GET.get('location','')
    latest = request.GET.get('latest','')
    jobs = JobPost.objects.all()
    if location:
        jobs = jobs.filter(location__icontains=location)
    if latest == '1':
        jobs = jobs.order_by('-created_at')[:10]
    return render(request,'total_jobs.html',{
        'jobs':jobs,
        'location':location,
    })

def choose_role_view(request):
    return render(request,'registration_choose.html')


def job_category_view(request, category):
    jobs = JobPost.objects.filter(title=category)
    context = {
        'jobs':jobs,
        'is_category_page': True
    }
    return render(request,'job_list.html',context)

def technology_jobs_view(request):
    jobs = JobPost.objects.filter(title="Technology")
    return render(request,'technology_jobs.html',{'jobs':jobs})

def networking_jobs_view(request):
    jobs = JobPost.objects.filter(title="Networking")
    return render(request,'networking_jobs.html',{'jobs':jobs})

def engineering_jobs_view(request):
    jobs = JobPost.objects.filter(title='Engineering')
    return render(request,'engineering_jobs.html',{'jobs':jobs})

def marketing_jobs_view(request):
    jobs = JobPost.objects.filter(title='Marketing')
    return render(request,'marketing_jobs.html',{'jobs':jobs})

def content_jobs_view(request):
    jobs = JobPost.objects.filter(title='Content Writing')
    return render(request,'content_jobs.html',{'jobs':jobs})

def customer_support_view(request):
    jobs = JobPost.objects.filter(title='Customer Support')
    return render(request,'customer_jobs.html',{'jobs':jobs})

def finance_jobs_view(request):
    jobs = JobPost.objects.filter(title='Finance')
    return render(request,'finance_jobs.html',{'jobs':jobs})

def health_jobs_view(request):
    jobs = JobPost.objects.filter(title='Healthcare')
    return render(request,'health_jobs.html',{'jobs':jobs})

def design_jobs_view(request):
    jobs = JobPost.objects.filter(title='Design')
    return render(request,'design_jobs.html',{'jobs':jobs})

def education_jobs_view(request):
    jobs = JobPost.objects.filter(title='Education')
    return render(request,'education_jobs.html',{'jobs':jobs})

def tech_apply(request,job_id):
    try:
        job = Techjob.objects.get(pk=job_id)
    except Techjob.DoesNotExist:
        return HttpResponse("Job not found",status=404)
    return render(request,'apply.html',{'job':job})

def employer_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated or request.user.groups.filter(name='employer').exists():
            return redirect('employer_login')
        return view_func(request, *args, **kwargs)
    return wrapper



@employer_required
def post_job(request):
    if request.method == 'POST':
        form = JobPostForm(request.POST)
        if form.is_valid():
            job = form.save(commit=False)
            job.employer = request.user
            job.save()
            messages.success(request,'Job posted successfully!')
            return redirect(f"{reverse('job_list')}?posted=true&job_id={job.id}")

    else:
        form = JobPostForm()
    return render(request,'post_job.html',{'form':form})
@login_required
def delete_job(request,job_id):
    job = get_object_or_404(JobPost,id=job_id)
    if not job.employer or job.employer != request.user:
        return HttpResponseForbidden("You are not allowed to delete this job.")
    job.delete()
    return redirect('job_list')


def create_job(request):
    form = JobPostForm()
    return render(request,'post_job.html',{'form':form})

def job_list(request):
    jobs = JobPost.objects.all()
    context = {
        'jobs':jobs,
        'is_category_page':False
    }
    return render(request,'job_list.html',context)


def apply_job_view(request,job_id):
    job = get_object_or_404(JobPost,id = job_id)
    return render(request,'apply_success.html',{'job':job})

def candidate_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated or request.user.groups.filter(name='candidate').exists():
            return redirect('candidate_login')
        return view_func(request, *args, **kwargs)
    return wrapper


@candidate_required
def apply_form(request, job_id):

    job = get_object_or_404(JobPost, id=job_id)
    if request.method == 'POST':
        applicant_form = ApplicantForm(request.POST, request.FILES)
        work_formset = WorkExperienceFormSet(request.POST, prefix='work')
        edu_formset = EducationalBackgroundFormSet(request.POST, prefix='edu')

        if applicant_form.is_valid() and work_formset.is_valid() and edu_formset.is_valid():
            applicant = applicant_form.save(commit=False)
            applicant.job = job
            applicant.save()

            for work_exp in work_formset.save(commit=False):
                work_exp.applicant = applicant
                work_exp.save()

            for edu in edu_formset.save(commit=False):
                edu.applicant = applicant
                edu.save()

            return render(request, 'application_submitted.html', {
                'applicant': applicant,
                'work_experiences': applicant.work_experiences.all(),
                'educational_backgrounds': applicant.educational_backgrounds.all()
            })

        else:
            print(applicant_form.errors)
            print(work_formset.errors)
            print(edu_formset.errors)
            messages.error(request, "Please correct the errors below.")
    else:
        applicant_form = ApplicantForm()
        work_formset = WorkExperienceFormSet(prefix='work')
        edu_formset = EducationalBackgroundFormSet(prefix='edu')

    return render(request, 'apply_form.html', {
        'job': job,
        'form': applicant_form,
        'work_formset': work_formset,
        'edu_formset': edu_formset
    })

@login_required
def browse_candidates(request):
    candidates = Applicant.objects.all()
    return render(request,'browse_candidates.html',{'candidates':candidates})

def candidate_detail(request,applicant_id):
    applicant = get_object_or_404(Applicant,id=applicant_id)
    return render(request,'candidate_detail.html',{'applicant':applicant})

def save_personal_info(request):
    if request.method == 'POST':
        applicant = Applicant(
            full_name = request.POST.get('full_name'),
            email = request.POST.get('email'),
            phone = request.POST.get('phone'),
            address = request.POST.get('address'),
            cover_letter = request.POST.get('cover_letter'),
            resume = request.FILES.get('resume'),
            linkedIn_profile = request.POST.get('linkedIn_profile'),
            portfolio_website = request.POST.get('portfolio_website')
        )
        applicant.save()

        return redirect('application_success')
    return render(request,'apply_form.html')
def application_view(request):
    if request.method == 'POST':
        print("Form submitted")
        form = JobApplicationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('success_page')
    else:
        form = JobApplicationForm()
    return render(request,'application.html',{'form':form})
def application_success(request):
    return render(request,'application_success.html')

def apply_success(request):
    return render(request, 'apply_success.html')
