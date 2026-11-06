import shutil
import tempfile
from datetime import timedelta

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone

from . import api, models
from .models import CompanyVerification, PasswordResetRequest, UserProfile


def login_tab(client, user):
    """Logs `user` in and sends the session key the way the frontend does (X-Session-Key)."""
    client.force_login(user)
    client.defaults['HTTP_X_SESSION_KEY'] = client.session.session_key


def pdf(name='license.pdf'):
    return SimpleUploadedFile(name, b'%PDF-1.4 test', content_type='application/pdf')


class CompanyVerificationTests(TestCase):
    def setUp(self):
        # Keep uploaded test documents out of the real private_media folder.
        self.tmp = tempfile.mkdtemp()
        storage = models._private_storage
        self._saved = storage.__dict__.copy()
        storage.__dict__.pop('location', None)
        storage.__dict__.pop('base_location', None)
        storage._location = self.tmp

        self.employer = User.objects.create_user('acme', 'acme@example.com', 'pass12345')
        UserProfile.objects.create(user=self.employer, role=UserProfile.ROLE_EMPLOYER)
        self.seeker = User.objects.create_user('seeker', 'seeker@example.com', 'pass12345')
        UserProfile.objects.create(user=self.seeker, role=UserProfile.ROLE_CANDIDATE)
        self.admin = User.objects.create_user('boss', 'boss@example.com', 'pass12345', is_staff=True)

    def tearDown(self):
        models._private_storage.__dict__.clear()
        models._private_storage.__dict__.update(self._saved)
        shutil.rmtree(self.tmp, ignore_errors=True)

    def submit(self, **extra):
        data = {
            'company_name': 'Acme Ltd',
            'trade_license_number': 'TRAD/123',
            'company_address': 'Dhaka',
            'company_email': 'hr@acme.com',
            'company_phone': '01700000000',
            'contact_person': 'Rahim',
            **extra,
        }
        return self.client.post('/api/company-verification/', data)

    def test_employer_submits_and_admin_verifies(self):
        login_tab(self.client, self.employer)
        self.assertEqual(self.client.get('/api/auth/me/').json()['company_status'], 'not_submitted')

        response = self.submit(trade_license=pdf())
        self.assertEqual(response.status_code, 200, response.content)
        body = response.json()['verification']
        self.assertEqual(body['status'], 'pending')
        self.assertEqual([d['field'] for d in body['documents']], ['trade_license'])

        # The employer can open their own document.
        doc_url = body['documents'][0]['url']
        self.assertEqual(self.client.get(doc_url).status_code, 200)

        # Other users cannot.
        login_tab(self.client, self.seeker)
        self.assertEqual(self.client.get(doc_url).status_code, 403)
        self.assertEqual(self.client.get('/api/company-verification/').status_code, 403)

        # Admin sees it, opens the document and verifies.
        login_tab(self.client, self.admin)
        listing = self.client.get('/api/admin/companies/?status=pending').json()
        self.assertEqual(listing['counts']['pending'], 1)
        self.assertEqual(self.client.get(doc_url).status_code, 200)
        response = self.client.post(f'/api/admin/companies/{self.employer.id}/verify/')
        self.assertEqual(response.json()['status'], 'verified')

        login_tab(self.client, self.employer)
        me = self.client.get('/api/auth/me/').json()
        self.assertEqual(me['company_status'], 'verified')
        # Verifying the company also approves the employer account.
        self.assertEqual(me['employer_status'], 'approved')
        self.assertTrue(me['can_post_jobs'])

        # Rejecting it blocks job posting again.
        login_tab(self.client, self.admin)
        self.client.post(f'/api/admin/companies/{self.employer.id}/reject/', {'reason': 'Expired license'},
                         content_type='application/json')
        login_tab(self.client, self.employer)
        me = self.client.get('/api/auth/me/').json()
        self.assertEqual(me['employer_status'], 'rejected')
        self.assertEqual(me['employer_rejection_reason'], 'Expired license')
        self.assertFalse(me['can_post_jobs'])

    def test_trade_license_required_and_file_type_checked(self):
        login_tab(self.client, self.employer)
        response = self.submit()
        self.assertEqual(response.status_code, 400)
        self.assertIn('trade_license', response.json()['errors'])

        bad = SimpleUploadedFile('license.exe', b'MZ', content_type='application/octet-stream')
        response = self.submit(trade_license=bad)
        self.assertEqual(response.status_code, 400)
        self.assertIn('trade_license', response.json()['errors'])

    def test_resubmit_keeps_saved_files_and_resets_review(self):
        login_tab(self.client, self.employer)
        self.submit(trade_license=pdf(), tin_certificate=pdf('tin.pdf'))
        CompanyVerification.objects.filter(employer=self.employer).update(status='rejected', rejection_reason='Blurry')

        # No new files: the saved ones stay. The TIN certificate is removed on request.
        response = self.submit(company_name='Acme Limited', remove_tin_certificate='1')
        self.assertEqual(response.status_code, 200, response.content)
        body = response.json()['verification']
        self.assertEqual(body['status'], 'pending')
        self.assertEqual(body['rejection_reason'], '')
        self.assertEqual(body['company_name'], 'Acme Limited')
        self.assertEqual([d['field'] for d in body['documents']], ['trade_license'])


class TabSessionTests(TestCase):
    """Each browser tab keeps its own login (X-Session-Key header), independent of the others."""

    def setUp(self):
        self.seeker = User.objects.create_user('seeker', 's@example.com', 'pass12345')
        UserProfile.objects.create(user=self.seeker, role=UserProfile.ROLE_CANDIDATE)
        self.employer = User.objects.create_user('acme', 'a@example.com', 'pass12345')
        UserProfile.objects.create(user=self.employer, role=UserProfile.ROLE_EMPLOYER)
        self.admin = User.objects.create_user('boss', 'b@example.com', 'pass12345', is_staff=True)

    def login(self, username, role, key=None):
        headers = {'HTTP_X_SESSION_KEY': key} if key else {}
        response = self.client.post('/api/auth/login/', {'username': username, 'password': 'pass12345', 'role': role},
                                    content_type='application/json', **headers)
        self.assertEqual(response.status_code, 200, response.content)
        return response.json()['session_key']

    def me(self, key):
        return self.client.get('/api/auth/me/', HTTP_X_SESSION_KEY=key).json()

    def test_tabs_keep_their_own_user(self):
        seeker_tab = self.login('seeker', 'candidate')
        employer_tab = self.login('acme', 'employer')
        admin_tab = self.client.post('/api/auth/admin-login/', {'email': 'b@example.com', 'password': 'pass12345'},
                                     content_type='application/json').json()['session_key']

        self.assertEqual(self.me(seeker_tab)['username'], 'seeker')
        self.assertEqual(self.me(employer_tab)['username'], 'acme')
        self.assertEqual(self.me(admin_tab)['username'], 'boss')
        # No shared cookie: a request without the header is anonymous.
        self.assertFalse(self.client.get('/api/auth/me/').json()['is_authenticated'])

        # Logging out one tab leaves the others logged in.
        self.client.post('/api/auth/logout/', HTTP_X_SESSION_KEY=employer_tab)
        self.assertFalse(self.me(employer_tab)['is_authenticated'])
        self.assertEqual(self.me(seeker_tab)['username'], 'seeker')
        self.assertEqual(self.me(admin_tab)['username'], 'boss')

    def test_new_tab_forks_and_logging_in_there_keeps_the_original(self):
        original = self.login('seeker', 'candidate')
        fork = self.client.post('/api/auth/session/fork/', HTTP_X_SESSION_KEY=original).json()
        self.assertEqual(fork['user']['username'], 'seeker')
        self.assertNotEqual(fork['session_key'], original)

        # The new tab logs in as someone else, starting from its (forked) key.
        self.login('acme', 'employer', key=fork['session_key'])
        self.assertEqual(self.me(original)['username'], 'seeker')

        # Logging in from a tab that still holds the original key does not end the original session either.
        self.login('acme', 'employer', key=original)
        self.assertEqual(self.me(original)['username'], 'seeker')


class NotificationTests(TestCase):
    """Admin reviews create notifications for the employer."""

    def setUp(self):
        from .models import JobPost
        self.employer = User.objects.create_user('acme', 'a@example.com', 'pass12345')
        UserProfile.objects.create(user=self.employer, role=UserProfile.ROLE_EMPLOYER,
                                   employer_status=UserProfile.EMPLOYER_APPROVED)
        self.admin = User.objects.create_user('boss', 'b@example.com', 'pass12345', is_staff=True)
        self.job = JobPost.objects.create(
            employer=self.employer, company_name='Acme Ltd', title='Technology', location='Dhaka',
            salary='20000-40000', status='full_time', requirements='Python', educational_level='bachelors',
            experience_level='entry_level',
        )

    def test_job_review_notifies_employer(self):
        login_tab(self.client, self.admin)
        self.client.post(f'/api/admin/jobs/{self.job.id}/approve/')
        self.client.post(f'/api/admin/jobs/{self.job.id}/reject/', {'reason': 'Salary missing'},
                         content_type='application/json')

        login_tab(self.client, self.employer)
        self.assertEqual(self.client.get('/api/auth/me/').json()['unread_notifications'], 2)
        data = self.client.get('/api/notifications/').json()
        self.assertEqual(data['unread_count'], 2)
        kinds = [n['kind'] for n in data['results']]
        self.assertCountEqual(kinds, ['job_approved', 'job_rejected'])
        rejected = next(n for n in data['results'] if n['kind'] == 'job_rejected')
        self.assertIn('Salary missing', rejected['message'])

        # Mark one, then all, as read.
        result = self.client.post('/api/notifications/read/', {'ids': [rejected['id']]},
                                  content_type='application/json').json()
        self.assertEqual(result['unread_count'], 1)
        result = self.client.post('/api/notifications/read/', {}, content_type='application/json').json()
        self.assertEqual(result['unread_count'], 0)

    def test_notifications_are_private(self):
        login_tab(self.client, self.admin)
        self.client.post(f'/api/admin/jobs/{self.job.id}/approve/')
        # The admin got none; the employer's notification is not in the admin's list.
        self.assertEqual(self.client.get('/api/notifications/').json()['results'], [])


class PasswordResetRequestTests(TestCase):
    def setUp(self):
        self.seeker = User.objects.create_user('seeker', 'seeker@example.com', 'OldPass!2345')
        UserProfile.objects.create(user=self.seeker, role=UserProfile.ROLE_CANDIDATE)
        self.admin = User.objects.create_user('boss', 'boss@example.com', 'pass12345', is_staff=True)

    def post(self, url, data=None, **headers):
        return self.client.post(url, data or {}, content_type='application/json', **headers)

    def logout(self):
        self.client.logout()
        self.client.defaults.pop('HTTP_X_SESSION_KEY', None)

    def login(self, username, password, role='candidate'):
        self.logout()
        response = self.post('/api/auth/login/', {'username': username, 'password': password, 'role': role})
        if response.status_code == 200:
            self.client.defaults['HTTP_X_SESSION_KEY'] = response.json()['session_key']
        return response

    def thread(self, token):
        return self.client.get('/api/auth/password-reset/thread/', HTTP_X_RESET_TOKEN=token)

    def user_says(self, token, body):
        return self.post('/api/auth/password-reset/thread/', {'body': body}, HTTP_X_RESET_TOKEN=token)

    def open_request(self, identifier='seeker@example.com', message='I forgot my password'):
        response = self.post('/api/auth/password-reset/', {'identifier': identifier, 'message': message})
        self.assertEqual(response.status_code, 201, response.content)
        return response.json()['token']

    def as_admin(self):
        self.logout()
        login_tab(self.client, self.admin)

    def issue(self, reset):
        self.as_admin()
        response = self.post(f'/api/admin/password-requests/{reset.id}/issue/')
        self.assertEqual(response.status_code, 200, response.content)
        self.logout()
        return response

    def temp_from_chat(self, token):
        temp = [m for m in self.thread(token).json()['messages'] if m['kind'] == 'temp_password'][-1]
        return temp

    def test_full_flow_with_chat(self):
        token = self.open_request()
        reset = PasswordResetRequest.objects.get(user=self.seeker)
        self.assertNotIn(token, reset.access_token_hash)  # only the hash is stored

        # The user and the admin chat.
        self.assertEqual(self.thread(token).json()['messages'][0]['body'], 'I forgot my password')
        self.as_admin()
        listing = self.client.get('/api/admin/password-requests/').json()
        self.assertEqual(listing['counts']['unread'], 1)
        self.post(f'/api/admin/password-requests/{reset.id}/messages/', {'body': 'What is your registered email?'})
        self.assertEqual(self.client.get('/api/admin/password-requests/').json()['counts']['unread'], 0)
        self.logout()
        self.user_says(token, 'seeker@example.com')
        self.assertEqual([m['sender'] for m in self.thread(token).json()['messages']], ['user', 'admin', 'user'])

        # The admin sends a temporary password but never sees it.
        response = self.issue(reset)
        self.assertNotIn('temp_password', response.json())
        admin_temp = [m for m in response.json()['messages'] if m['kind'] == 'temp_password'][0]
        self.assertNotIn('temp_password', admin_temp)
        self.assertEqual(admin_temp['state'], 'active')

        # Only the user's chat shows it.
        message = self.temp_from_chat(token)
        temp = message['temp_password']
        self.assertEqual(message['username'], 'seeker')
        reset.refresh_from_db()
        self.assertNotIn(temp, reset.temp_cipher)

        # Log in with it: everything except setting a password is blocked, and it leaves the chat.
        response = self.login('seeker', temp)
        self.assertEqual(response.status_code, 200, response.content)
        self.assertTrue(response.json()['user']['must_change_password'])
        self.assertEqual(self.client.get('/api/auth/profile/').status_code, 403)
        message = self.temp_from_chat(token)
        self.assertEqual(message['state'], 'used')
        self.assertNotIn('temp_password', message)

        response = self.post('/api/auth/password-set/', {'new_password1': 'BrandNew!789', 'new_password2': 'BrandNew!789'})
        self.assertEqual(response.status_code, 200, response.content)
        self.client.defaults['HTTP_X_SESSION_KEY'] = response.json()['session_key']
        self.assertEqual(self.client.get('/api/auth/profile/').status_code, 200)
        reset.refresh_from_db()
        self.assertEqual(reset.status, 'completed')
        self.assertFalse(self.thread(token).json()['can_reply'])

        # One-time: the temporary password no longer works; the new one does.
        self.assertEqual(self.login('seeker', temp).status_code, 400)
        self.assertEqual(self.login('seeker', 'BrandNew!789').status_code, 200)

    def test_unknown_account_looks_the_same_and_cannot_get_a_password(self):
        token = self.open_request(identifier='nobody@example.com')
        self.assertEqual(self.thread(token).status_code, 200)
        reset = PasswordResetRequest.objects.get(identifier='nobody@example.com')
        self.assertIsNone(reset.user)
        self.as_admin()
        self.assertEqual(self.post(f'/api/admin/password-requests/{reset.id}/issue/').status_code, 400)
        # The admin can still reply.
        self.assertEqual(self.post(f'/api/admin/password-requests/{reset.id}/messages/', {'body': 'No account found'}).status_code, 200)

    def test_status_reports_unread_without_marking_read(self):
        token = self.open_request()
        reset = PasswordResetRequest.objects.get(user=self.seeker)
        status = lambda: self.client.get('/api/auth/password-reset/thread/status/', HTTP_X_RESET_TOKEN=token).json()
        self.assertEqual(status()['unread'], 0)

        self.as_admin()
        self.post(f'/api/admin/password-requests/{reset.id}/messages/', {'body': 'Hi, which email did you use?'})
        self.logout()
        self.assertEqual(status()['unread'], 1)
        self.assertEqual(status()['latest']['body'], 'Hi, which email did you use?')  # still unread

        self.issue(reset)
        data = status()
        self.assertEqual(data['unread'], 2)
        self.assertTrue(data['temp_password_ready'])
        self.assertEqual(data['latest']['kind'], 'temp_password')
        self.assertNotIn('temp_password', data['latest'])

        self.thread(token)  # opening the chat marks them read
        self.assertEqual(status()['unread'], 0)

    def test_chat_needs_the_secret_token(self):
        self.open_request()
        self.assertEqual(self.thread('x' * 43).status_code, 404)
        self.assertEqual(self.client.get('/api/auth/password-reset/thread/').status_code, 404)

    def test_temp_password_works_only_once(self):
        token = self.open_request()
        reset = PasswordResetRequest.objects.get(user=self.seeker)
        self.issue(reset)
        temp = self.temp_from_chat(token)['temp_password']
        self.assertEqual(self.login('seeker', temp).status_code, 200)
        self.assertEqual(self.login('seeker', temp).status_code, 400)  # second use refused
        self.assertTrue(self.thread(token).json()['needs_new_request'])

        # The admin cannot send another one on the same request...
        self.as_admin()
        response = self.post(f'/api/admin/password-requests/{reset.id}/issue/')
        self.assertEqual(response.status_code, 400)
        self.assertIn('new request', response.json()['detail'])

        # ...the user has to ask again.
        self.logout()
        token2 = self.open_request(identifier='seeker')
        self.issue(PasswordResetRequest.objects.get(user=self.seeker, status='pending'))
        self.assertEqual(self.login('seeker', self.temp_from_chat(token2)['temp_password']).status_code, 200)

    def test_temp_password_claim_is_atomic(self):
        self.open_request()
        self.issue(PasswordResetRequest.objects.get(user=self.seeker))
        profile = UserProfile.objects.get(user=self.seeker)
        # Two logins checked the same password; only the first claim succeeds.
        self.assertTrue(api._claim_temp_password(self.seeker, profile.temp_password))
        self.assertFalse(api._claim_temp_password(self.seeker, profile.temp_password))

    def test_expired_needs_new_request(self):
        token = self.open_request()
        reset = PasswordResetRequest.objects.get(user=self.seeker)
        self.issue(reset)
        temp = self.temp_from_chat(token)['temp_password']
        UserProfile.objects.filter(user=self.seeker).update(temp_password_expires_at=timezone.now() - timedelta(minutes=1))
        PasswordResetRequest.objects.filter(id=reset.id).update(temp_expires_at=timezone.now() - timedelta(minutes=1))
        self.assertEqual(self.temp_from_chat(token)['state'], 'expired')
        self.assertTrue(self.thread(token).json()['needs_new_request'])
        self.assertEqual(self.login('seeker', temp).status_code, 400)
        self.as_admin()
        self.assertEqual(self.post(f'/api/admin/password-requests/{reset.id}/issue/').status_code, 400)
        # The old password still works, and logging in with it lifts the "set a new password" step.
        self.assertEqual(self.login('seeker', 'OldPass!2345').status_code, 200)

    def test_real_password_login_clears_forced_change(self):
        self.open_request()
        reset = PasswordResetRequest.objects.get(user=self.seeker)
        self.issue(reset)
        UserProfile.objects.filter(user=self.seeker).update(must_change_password=True)
        response = self.login('seeker', 'OldPass!2345')
        self.assertFalse(response.json()['user']['must_change_password'])

    def test_reject_withdraws_temp_password(self):
        token = self.open_request()
        reset = PasswordResetRequest.objects.get(user=self.seeker)
        self.issue(reset)
        temp = self.temp_from_chat(token)['temp_password']
        self.as_admin()
        response = self.post(f'/api/admin/password-requests/{reset.id}/reject/', {'reason': 'Could not confirm'})
        self.assertEqual(response.json()['status'], 'rejected')
        self.logout()
        self.assertEqual(self.login('seeker', temp).status_code, 400)
        chat = self.thread(token).json()
        self.assertFalse(chat['can_reply'])
        self.assertIn('Could not confirm', chat['messages'][-1]['body'])
        self.assertEqual(self.user_says(token, 'hello?').status_code, 400)

    def test_only_admins_see_requests(self):
        self.open_request()
        login_tab(self.client, self.seeker)
        self.assertEqual(self.client.get('/api/admin/password-requests/').status_code, 403)
