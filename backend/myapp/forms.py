from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.forms import modelformset_factory

from .models import (Applicant, Candidate, EducationalBackground, Employee,
                     JobApplicationForm, JobPost, WorkExperience)

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
