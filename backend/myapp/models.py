from django import forms
from django.conf import settings
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Employee(models.Model):
    employer_id = models.AutoField(primary_key=True)
    company_name = models.CharField(max_length=100)
    full_name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100,unique=True)
    password = models.CharField(max_length=100)
    confirm_password = models.CharField(max_length=100)
    phone = models.CharField(max_length=20,blank= True)
    address = models.CharField(max_length=100)
    company_location = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.employer_id}, {self.company_name}, {self.full_name}, {self.email}, {self.password}, {self.confirm_password}, {self.phone}, {self.address}, {self.company_location}"


    def clean(self):
        if Employee.objects.exclude(pk=self.pk).filter(email=self.email).exists():
            raise forms.ValidationError("Email already exists in Employee records.")
        if self.password != self.confirm_password:
            raise forms.ValidationError("Passwords do not match.")

class Candidate(models.Model):
    user = models.OneToOneField('auth.User', on_delete=models.CASCADE, null=True, blank=True)
    candidate_id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100,unique=True)
    password = models.CharField(max_length=100)
    confirm_password = models.CharField(max_length=100)
    phone = models.CharField(max_length=20,blank=True)
    address = models.CharField(max_length=100)
    location = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.candidate_id}, {self.full_name}, {self.email}, {self.password}, {self.confirm_password}, {self.phone}, {self.address}, {self.location}"

    def clean(self):
        if Employee.objects.exclude(pk=self.pk).filter(email=self.email).exists():
            raise forms.ValidationError("Email already exists in Employee records.")
        if self.password != self.confirm_password:
            raise forms.ValidationError("Passwords do not match.")





class JobPost(models.Model):
    JOB_CHOICES = [
        ("Technology", "Technology"),
        ("Networking", "Networking"),
        ("Engineering", "Engineering"),
        ("Marketing", "Marketing"),
        ("Content Writing", "Content Writing"),
        ("Customer Support", "Customer Support"),
        ("Finance", "Finance"),
        ("Healthcare", "Healthcare"),
        ("Design", "Design"),
        ("Education", "Education"),
    ]

    SALARY_CHOICES = [
        ('<20000', 'Less than 20,000'),
        ('20000-40000', '20,000 - 40,000'),
        ('40000-60000', '40,000 - 60,000'),
        ('60000-80000', '60,000 - 80,000'),
        ('80000-100000', '80,000 - 100,000'),
        ('>100000', 'More than 100,000'),
    ]

    STATUS_CHOICES = [
        ("full_time", "Full time"),
        ("part_time", "Part time"),
        ("remote", "Remote"),
        ("hibrid", "Hibrid"),
        ("internship", "Internship"),
        ("contractual", "Contractual"),
    ]


    EDUCATION_CHOICES = [
        ('high_school', 'High School'),
        ('bachelors', "Bachelor's"),
        ('masters', "Master's"),
        ('phd', 'PhD'),
    ]

    EXPERIENCE_CHOICES = [
        ('entry_level', 'Entry Level (0-2 years)'),
        ('mid_level', 'Mid Level (3-5 years)'),
        ('senior_level', 'Senior Level (5+ years)'),
    ]

    employer = models.ForeignKey(User,on_delete=models.CASCADE)
    job_id = models.IntegerField(default=0)
    company_name = models.CharField(max_length=100)
    title = models.CharField(max_length=200, choices=JOB_CHOICES)
    location = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    salary = models.CharField(max_length=100, choices=SALARY_CHOICES)
    status = models.CharField(choices=STATUS_CHOICES, max_length=100)
    requirements = models.TextField(max_length=400)
    educational_level = models.CharField(max_length=50, choices=EDUCATION_CHOICES)
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_CHOICES)
    deadline = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} ({self.status})"

class JobApplicationForm(models.Model):
    JOB_TYPES = [
        ('FT', 'Full-time'),
        ('PT', 'Part-time'),
        ('CN', 'Contract'),
        ('IN', 'Internship'),
        ('RM', 'Remote'),
    ]
    job = models.ForeignKey(JobPost, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(max_length=500)
    location = models.CharField(max_length=100)
    salary = models.CharField(max_length=100)
    job_type = models.CharField(max_length=100,choices=JOB_TYPES)
    posted_date = models.DateTimeField(auto_now_add=True)
    deadline = models.DateField(auto_now_add=True)
    requirements = models.TextField(max_length=500)
    company_name = models.CharField(max_length=100)
    industry = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    def __str__(self):
        return f"{self.title} ({self.job_type})"

class Applicant(models.Model):
    job = models.ForeignKey(JobPost,on_delete=models.CASCADE,db_column='job')
    full_name = models.CharField(max_length=100)
    email = models.CharField(max_length=100)
    phone = models.CharField(max_length=20,blank=True)
    address = models.CharField(max_length=100)
    cover_letter = models.TextField(blank=True)
    resume = models.FileField(upload_to='resumes/')
    linkedin_profile = models.URLField(max_length=100,blank=True)
    portfolio_website = models.URLField(max_length=100,blank=True)
    date_applied = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.full_name}, {self.email}, {self.phone}, {self.address}, {self.cover_letter}, {self.resume}, {self.linkedin_profile}, {self.portfolio_website}"

class WorkExperience(models.Model):
    applicant = models.ForeignKey('Applicant',on_delete=models.CASCADE,related_name='work_experiences')
    company_name = models.CharField(max_length=100)
    position = models.CharField(max_length=100)
    responsibilities = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True,blank=True)
    description = models.TextField(blank=True)
    currently_working = models.BooleanField(default=False)
    def __str__(self):
        return f"{self.company_name},{self.position},{self.start_date},{self.end_date},{self.responsibilities},{self.description},{self.currently_working}"
    def save(self, *args, **kwargs):
        if self.currently_working:
            self.end_date = None
        else:
            if self.end_date and self.end_date < self.start_date:
                raise ValueError("End date cannot be before start date.")
        super().save(*args, **kwargs)

class EducationalBackground(models.Model):
    DEGREE_TYPES = [
        ('HS', 'High School'),
        ('AD', 'Associate Degree'),
        ('BD', "Bachelor's Degree"),
        ('MD', "Master's Degree"),
        ('PHD', 'Doctorate'),
        ('OT', 'Other'),
    ]
    degree_type = models.CharField(max_length=100, choices=DEGREE_TYPES)
    applicant = models.ForeignKey('Applicant',on_delete=models.CASCADE,related_name='educational_backgrounds')
    institution_name = models.CharField(max_length=150)
    start_year = models.PositiveIntegerField(null=True,blank=True)
    end_year = models.PositiveIntegerField(null=True,blank=True)
    grade = models.CharField(max_length=100,blank=True)
    field_of_study = models.CharField(max_length=100,blank=True)
    def __str__(self):
        return f"{self.degree_type}, {self.institution_name}, {self.start_year}, {self.end_year}, {self.grade}, {self.field_of_study}"
    def save(self, *args, **kwargs):
        if self.start_year and self.end_year and self.end_year < self.start_year:
            raise ValueError("End year cannot be before start year.")
        super().save(*args, **kwargs)
