from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.forms import modelformset_factory
from django.utils import timezone

from .models import (COMPANY_DOCUMENT_EXTENSIONS, Applicant, Candidate, CompanyVerification,
                     EducationalBackground, Employee, JobApplicationForm, JobPost, UserProfile,
                     WorkExperience)

# class CandidateRegistrationForm(forms.ModelForm):
#     class Meta:
#         model = Candidate
#         fields = [
#             'full_name', 'email', 'password', 'confirm_password',
#             'phone', 'address', 'location'
#         ]
#         widgets = {
#             'password': forms.PasswordInput(),
#             'confirm_password': forms.PasswordInput(),
#         }
#     def save(self, commit=True):
#         user = super().save(commit=False)
#         if commit:
#             user.save()
#         return user

#     def clean(self):
#         cleaned_data = super().clean()
#         email = cleaned_data.get("email")
#         if Candidate.objects.filter(email=email).exists():
#             raise forms.ValidationError("Email already exists.")
#         return cleaned_data


# class EmployeeRegistrationForm(forms.ModelForm):
#     class Meta:
#         model = Employee
#         fields = [
#             'company_name', 'full_name', 'email', 'password',
#             'confirm_password', 'phone', 'address', 'company_location'
#         ]
#         widgets = {
#             'password': forms.PasswordInput(),
#             'confirm_password': forms.PasswordInput(),
#         }
#     def clean(self):
#         cleaned_data = super().clean()
#         email = cleaned_data.get("email")
#         if Employee.objects.filter(email=email).exists():
#             raise forms.ValidationError("Email already exists.")
#         return cleaned_data





class JobPostForm(forms.ModelForm):
    class Meta:
        model = JobPost
        fields = [
            'job_id','title','company_name','status','requirements','location','salary','educational_level','experience_level','deadline'
        ]
        widgets  = {
            'deadline': forms.DateInput(attrs={'type':'date'}),
        }
    def clean(self):
        clean_data = super().clean()
        if not clean_data.get('status'):
            raise forms.ValidationError("Select at least one job")

class ApplicantForm(forms.ModelForm):
    class Meta:
        model = Applicant
        fields = [

            'full_name','email', 'phone', 'address',
            'resume', 'cover_letter','linkedin_profile',
            'portfolio_website'
        ]
        widgets = {
            'cover_letter': forms.Textarea(attrs={'rows': 4}),
            'linkedin_profile': forms.URLInput(attrs={'placeholder':'Linkedin Profile URL'}),
            'portfolio_website':forms.URLInput(attrs={'placeholder':'Portfolio Website URL'}),
        }
class WorkExperienceForm(forms.ModelForm):
    class Meta:
        model = WorkExperience
        fields = [
            'company_name',
            'position',
            'responsibilities',
            'start_date',
            'end_date',
            'description',
            'currently_working'
        ]
        widgets = {
            'start_date': forms.DateInput(attrs={'type':'date'}),
            'end_date': forms.DateInput(attrs={'type':'date'}),
            'responsibilities': forms.Textarea(attrs={'rows':4}),
            'description':forms.Textarea(attrs={'rows':4}),
        }

class EducationalBackgroundForm(forms.ModelForm):
    class Meta:
        model = EducationalBackground
        fields = [
            'institution_name', 'degree_type', 'field_of_study',
            'start_year', 'end_year', 'grade',

        ]
        widgets = {
           'start_year':forms.NumberInput(attrs={'min':1900,
                                                 'max':2100,
                                                 'placeholder':'YYYY'}),
           'end_year':forms.NumberInput(attrs={'min':1900,
                                               'max':2100,
                                               'placeholder':'YYYY'}),
           'description':forms.Textarea(attrs={'rows':4}),

        }

WorkExperienceFormSet = modelformset_factory(
    WorkExperience,
    form=WorkExperienceForm,
    extra=0
)
EducationalBackgroundFormSet = modelformset_factory(
    EducationalBackground,
    form=EducationalBackgroundForm,
    extra=0
)
class JobApplicationForm(forms.ModelForm):
    class Meta:
        model = Applicant
        fields = [
            'full_name', 'email', 'phone', 'address',
            'resume', 'cover_letter','linkedin_profile',
            'portfolio_website'
        ]
        widgets = {
            'cover_letter': forms.Textarea(attrs={'rows': 4}),
            'linkedin_profile': forms.URLInput(attrs={'placeholder':'LinkedIn Profile URL'}),
            'portfolio_website':forms.URLInput(attrs={'placeholder':'Portfolio Website URL'}),
        }


MAX_PHOTO_BYTES = 2 * 1024 * 1024


class AccountForm(forms.ModelForm):
    """The django.contrib.auth User fields a user may edit on /profile/edit."""
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username', 'email']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['email'].required = True

    def clean_email(self):
        email = self.cleaned_data['email'].strip()
        if User.objects.exclude(pk=self.instance.pk).filter(email__iexact=email).exists():
            raise forms.ValidationError('This email is already used by another account.')
        return email


class UserProfileForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        # Skills are no longer edited on /profile/edit; leaving the field out keeps saved data intact.
        fields = ['headline', 'phone', 'location', 'bio', 'website', 'linkedin', 'photo']

    def clean_photo(self):
        photo = self.cleaned_data.get('photo')
        if photo and photo.size > MAX_PHOTO_BYTES:
            raise forms.ValidationError('Photo must be 2 MB or smaller.')
        return photo


MAX_COMPANY_DOCUMENT_BYTES = 5 * 1024 * 1024


class CompanyVerificationForm(forms.ModelForm):
    """Employer's company verification request. Saved files are kept when no new file is sent."""
    class Meta:
        model = CompanyVerification
        fields = [
            'company_name', 'trade_license_number', 'company_type', 'industry', 'year_established',
            'company_address', 'company_email', 'company_phone', 'company_website',
            'contact_person', 'contact_designation', 'ceo_name',
            'trade_license', 'tin_certificate', 'incorporation_certificate', 'owner_id_document', 'other_document',
        ]

    def clean_year_established(self):
        year = self.cleaned_data.get('year_established')
        if year and not 1800 <= year <= timezone.now().year:
            raise forms.ValidationError('Enter a valid year.')
        return year

    def _clean_document(self, name):
        document = self.cleaned_data.get(name)
        # Only newly uploaded files need checking; a saved file was checked when it was uploaded.
        if document and name in self.files:
            extension = document.name.rsplit('.', 1)[-1].lower() if '.' in document.name else ''
            if extension not in COMPANY_DOCUMENT_EXTENSIONS:
                raise forms.ValidationError('Upload a PDF, JPG or PNG file.')
            if document.size > MAX_COMPANY_DOCUMENT_BYTES:
                raise forms.ValidationError('Each document must be 5 MB or smaller.')
        return document

    def clean_trade_license(self):
        return self._clean_document('trade_license')

    def clean_tin_certificate(self):
        return self._clean_document('tin_certificate')

    def clean_incorporation_certificate(self):
        return self._clean_document('incorporation_certificate')

    def clean_owner_id_document(self):
        return self._clean_document('owner_id_document')

    def clean_other_document(self):
        return self._clean_document('other_document')
