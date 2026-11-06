from django.urls import path, register_converter

from . import api
from .converters import ObjectIdConverter

register_converter(ObjectIdConverter, 'oid')

urlpatterns = [
    path('health/', api.health),
    path('csrf/', api.csrf),
    path('auth/me/', api.me),
    path('auth/login/', api.login),
    path('auth/session/fork/', api.fork_session),
    path('auth/admin-login/', api.admin_login),
    path('auth/logout/', api.logout),
    path('auth/signup/', api.signup),
    path('auth/password-reset/', api.password_reset),
    path('auth/profile/', api.profile),
    path('auth/password-change/', api.password_change),
    path('notifications/', api.notifications),
    path('notifications/read/', api.notifications_read),
    path('company-verification/', api.company_verification),
    path('company-verification/<oid:user_id>/documents/<str:field>/', api.company_document),
    path('jobs/', api.jobs),
    path('jobs/<oid:job_id>/', api.job_detail),
    path('jobs/<oid:job_id>/apply/', api.apply),
    path('candidates/', api.candidates),
    path('candidates/<oid:applicant_id>/', api.candidate_detail),
    path('admin/jobs/', api.admin_jobs),
    path('admin/jobs/<oid:job_id>/approve/', api.admin_approve_job),
    path('admin/jobs/<oid:job_id>/reject/', api.admin_reject_job),
    path('admin/employers/', api.admin_employers),
    path('admin/employers/<oid:user_id>/approve/', api.admin_approve_employer),
    path('admin/employers/<oid:user_id>/reject/', api.admin_reject_employer),
    path('admin/companies/', api.admin_companies),
    path('admin/companies/<oid:user_id>/verify/', api.admin_verify_company),
    path('admin/companies/<oid:user_id>/reject/', api.admin_reject_company),
]
