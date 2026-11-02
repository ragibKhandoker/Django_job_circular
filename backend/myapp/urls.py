from django.contrib.auth import views as auth_views
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView
from django.urls import path

from . import views
from .views import (candidate_login_view, candidate_signup_view,
                    choose_role_view, employer_login_view,
                    employer_signup_view, home_view, login_choice_view,
                    logout_view)

urlpatterns = [
    path('', views.home_view, name='home'),
    path('signup/', views.choose_role_view, name='signup'),
    path('signup/employer/', views.employer_signup_view, name='employer_signup'),
    path('signup/candidate/', candidate_signup_view, name='candidate_signup'),
    path('apply/<int:job_id>/', views.apply_form, name='apply_form'),
    path('jobs/category/<str:category>/', views.job_category_view, name='job_category'),
    path('delete_job/<int:job_id>/', views.delete_job, name='delete_job'),
    path('post-job/', views.post_job, name='post_job'),
    path('job-list/', views.job_list, name='job_list'),
    path('jobs/total/', views.total_jobs_view, name='TotalJob'),
    path('application-success/', views.application_success, name='application_success'),
    path('apply-success/', views.apply_success, name='apply_success'),
    path('browse-candidates/',views.browse_candidates,name='browse_candidates'),
    path('candidate/<int:applicant_id>/',views.candidate_detail,name="candidate_detail"),
    path('login_choice/',views.login_choice_view,name='login'),
    path('login_choice/employer_login/',views.employer_login_view,name='employer_login'),
    path('login_choice/candidate_login/',views.candidate_login_view,name='candidate_login'),
    path('logout/',views.logout_view,name='logout'),
    #  For Employer
    path('password-reset/',auth_views.PasswordResetView.as_view(template_name='password_reset.html')),

    path('password-reset/done/',auth_views.PasswordResetDoneView.as_view(template_name='password_reset_done.html'),name='password_reset_done'),

    path('reset<uidb64>/<token>/',auth_views.PasswordResetConfirmView.as_view(template_name = 'password_reset_confirm.html'),
         name = 'password_reset_confirm'),

    path('reset/done',auth_views.PasswordResetCompleteView.as_view(template_name='password_reset_complete')),

    # For candidate
    path('password-reset/',
         auth_views.PasswordResetView.as_view(template_name='password_reset.html'),
         name='password_reset'),

    path('password-reset/done/',
         auth_views.PasswordResetDoneView.as_view(template_name='password_reset_done.html'),
         name='password_reset_done'),

    path('reset/<uidb64>/<token>/',
         auth_views.PasswordResetConfirmView.as_view(template_name='password_reset_confirm.html'),
         name='password_reset_confirm'),

    path('reset/done/',
         auth_views.PasswordResetCompleteView.as_view(template_name='password_reset_complete.html'),
         name='password_reset_complete'),


]
