from django.contrib import admin

from .models import CompanyVerification, JobPost, Notification, UserProfile

# admin.site.register(UserSignup)
admin.site.register(JobPost)
admin.site.register(UserProfile)
admin.site.register(CompanyVerification)
admin.site.register(Notification)
