from django.urls import path, register_converter

from . import api
from .converters import ObjectIdConverter

register_converter(ObjectIdConverter, 'oid')

urlpatterns = [
    path('health/', api.health),
    path('csrf/', api.csrf),
    path('auth/me/', api.me),
    path('auth/login/', api.login),
    path('auth/logout/', api.logout),
    path('auth/signup/', api.signup),
    path('auth/password-reset/', api.password_reset),
    path('jobs/', api.jobs),
    path('jobs/<oid:job_id>/', api.job_detail),
    path('jobs/<oid:job_id>/apply/', api.apply),
    path('candidates/', api.candidates),
    path('candidates/<oid:applicant_id>/', api.candidate_detail),
]
