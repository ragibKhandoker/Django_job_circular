from django import forms
from django.conf import settings
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.files.storage import FileSystemStorage
from django.db import models
from django.utils import timezone
from django_mongodb_backend.fields import ObjectIdAutoField


class Employee(models.Model):
    employer_id = ObjectIdAutoField(primary_key=True)
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
    candidate_id = ObjectIdAutoField(primary_key=True)
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
    requirements = models.TextField(max_length=10000)
    educational_level = models.CharField(max_length=50, choices=EDUCATION_CHOICES)
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_CHOICES)
    deadline = models.DateField(null=True, blank=True)

    # New posts wait for an admin (staff user) to verify them before they are public.
    APPROVAL_PENDING = 'pending'
    APPROVAL_APPROVED = 'approved'
    APPROVAL_REJECTED = 'rejected'
    APPROVAL_CHOICES = [
        (APPROVAL_PENDING, 'Pending review'),
        (APPROVAL_APPROVED, 'Approved'),
        (APPROVAL_REJECTED, 'Rejected'),
    ]
    approval_status = models.CharField(max_length=20, choices=APPROVAL_CHOICES, default=APPROVAL_PENDING)
    rejection_reason = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

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


class UserProfile(models.Model):
    """Extra details shown on /profile, plus the account's role; created at sign-up (or on first use)."""
    ROLE_CANDIDATE = 'candidate'
    ROLE_EMPLOYER = 'employer'
    ROLE_CHOICES = [(ROLE_CANDIDATE, 'Job seeker'), (ROLE_EMPLOYER, 'Employer')]

    # Employer accounts must be approved by an admin before they can post jobs.
    EMPLOYER_PENDING = 'pending'
    EMPLOYER_APPROVED = 'approved'
    EMPLOYER_REJECTED = 'rejected'
    EMPLOYER_STATUS_CHOICES = [
        (EMPLOYER_PENDING, 'Pending review'),
        (EMPLOYER_APPROVED, 'Approved'),
        (EMPLOYER_REJECTED, 'Rejected'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_CANDIDATE)
    employer_status = models.CharField(max_length=20, choices=EMPLOYER_STATUS_CHOICES, default=EMPLOYER_PENDING)
    employer_rejection_reason = models.TextField(blank=True)
    employer_reviewed_at = models.DateTimeField(null=True, blank=True)
    headline = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=100, blank=True)
    bio = models.TextField(max_length=1000, blank=True)
    skills = models.CharField(max_length=300, blank=True, help_text='Comma-separated.')
    website = models.URLField(max_length=200, blank=True)
    linkedin = models.URLField(max_length=200, blank=True)
    photo = models.ImageField(upload_to='profile_photos/', blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.username}"

    @property
    def is_employer(self):
        return self.role == self.ROLE_EMPLOYER

    @property
    def can_post_jobs(self):
        return self.user.is_staff or (self.is_employer and self.employer_status == self.EMPLOYER_APPROVED)

    @property
    def can_apply(self):
        return not self.is_employer


# Company documents are private: they live outside MEDIA_ROOT (so /media/ never serves them)
# and are only downloadable through the API by the employer who uploaded them or an admin.
_private_storage = FileSystemStorage(location=settings.BASE_DIR / 'private_media')


def private_storage():
    # A callable keeps the machine-specific path out of migrations.
    return _private_storage

COMPANY_DOCUMENT_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png']


def company_document_path(instance, filename):
    return f'company_documents/{instance.employer_id}/{filename}'


class CompanyVerification(models.Model):
    """Company details and documents an employer submits so an admin can confirm the company is real."""
    STATUS_PENDING = 'pending'
    STATUS_VERIFIED = 'verified'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending review'),
        (STATUS_VERIFIED, 'Verified'),
        (STATUS_REJECTED, 'Rejected'),
    ]
    # (field name, label) for every uploadable document, in display order.
    DOCUMENTS = [
        ('trade_license', 'Trade license'),
        ('tin_certificate', 'TIN certificate'),
        ('incorporation_certificate', 'Certificate of incorporation'),
        ('owner_id_document', 'CEO / owner NID or passport'),
        ('other_document', 'Other supporting document'),
    ]

    employer = models.OneToOneField(User, on_delete=models.CASCADE, related_name='company_verification')
    company_name = models.CharField(max_length=150)
    trade_license_number = models.CharField(max_length=60)
    company_type = models.CharField(max_length=60, blank=True)
    industry = models.CharField(max_length=80, blank=True)
    year_established = models.PositiveIntegerField(null=True, blank=True)
    company_address = models.CharField(max_length=255)
    company_email = models.EmailField(max_length=150)
    company_phone = models.CharField(max_length=20)
    company_website = models.URLField(max_length=200, blank=True)
    contact_person = models.CharField(max_length=100)
    contact_designation = models.CharField(max_length=100, blank=True)
    ceo_name = models.CharField('CEO / owner name', max_length=100, blank=True)

    trade_license = models.FileField(upload_to=company_document_path, storage=private_storage, max_length=255)
    tin_certificate = models.FileField(upload_to=company_document_path, storage=private_storage, max_length=255, blank=True)
    incorporation_certificate = models.FileField(upload_to=company_document_path, storage=private_storage, max_length=255, blank=True)
    owner_id_document = models.FileField(upload_to=company_document_path, storage=private_storage, max_length=255, blank=True)
    other_document = models.FileField(upload_to=company_document_path, storage=private_storage, max_length=255, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    rejection_reason = models.TextField(blank=True)
    submitted_at = models.DateTimeField(default=timezone.now)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.company_name} ({self.get_status_display()})"


class Notification(models.Model):
    """In-app message for a user, e.g. "your job post was approved". Shown under the bell on /profile."""
    KIND_JOB_APPROVED = 'job_approved'
    KIND_JOB_REJECTED = 'job_rejected'
    KIND_COMPANY_VERIFIED = 'company_verified'
    KIND_COMPANY_REJECTED = 'company_rejected'
    KIND_CHOICES = [
        (KIND_JOB_APPROVED, 'Job post approved'),
        (KIND_JOB_REJECTED, 'Job post rejected'),
        (KIND_COMPANY_VERIFIED, 'Company verified'),
        (KIND_COMPANY_REJECTED, 'Company not verified'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    kind = models.CharField(max_length=30, choices=KIND_CHOICES)
    title = models.CharField(max_length=150)
    message = models.TextField(blank=True)
    link = models.CharField(max_length=200, blank=True, help_text='Frontend path to open, e.g. /profile.')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username}: {self.title}"
