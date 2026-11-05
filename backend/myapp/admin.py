from django.contrib import admin

from .models import JobPost, UserProfile

# admin.site.register(UserSignup)
admin.site.register(JobPost)
admin.site.register(UserProfile)
