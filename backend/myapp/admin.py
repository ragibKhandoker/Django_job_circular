from django.contrib import admin

from .models import ApplicantBan, CompanyVerification, JobPost, Notification, PasswordResetMessage, PasswordResetRequest, UserProfile

# admin.site.register(UserSignup)
admin.site.register(JobPost)
admin.site.register(UserProfile)
admin.site.register(CompanyVerification)
admin.site.register(Notification)
admin.site.register(PasswordResetRequest)
admin.site.register(PasswordResetMessage)
admin.site.register(ApplicantBan)
