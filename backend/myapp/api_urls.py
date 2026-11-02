from django.urls import path

from . import api

urlpatterns = [
    path('csrf/', api.csrf),
    path('auth/me/', api.me),
    path('auth/login/', api.login),
    path('auth/logout/', api.logout),
    path('auth/signup/', api.signup),
    path('auth/password-reset/', api.password_reset),
    path('jobs/', api.jobs),
    path('jobs/<int:job_id>/', api.job_detail),
    path('jobs/<int:job_id>/apply/', api.apply),
    path('candidates/', api.candidates),
    path('candidates/<int:applicant_id>/', api.candidate_detail),
]
