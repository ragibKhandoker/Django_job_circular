"""Create or update the admin-panel account: python manage.py create_admin --email you@example.com --password secret"""
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Create (or update) a staff account that can log in to the admin panel and verify job posts.'

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True)
        parser.add_argument('--password', required=True)
        parser.add_argument('--username', help='Defaults to the part of the email before "@".')

    def handle(self, *args, email, password, username=None, **options):
        email = email.strip()
        if '@' not in email:
            raise CommandError('Enter a valid email address.')
        if len(password) < 8:
            raise CommandError('Use a password of 8 or more characters.')

        user = User.objects.filter(email__iexact=email).first()
        created = user is None
        if created:
            username = username or email.split('@')[0]
            if User.objects.filter(username=username).exists():
                raise CommandError(f'Username "{username}" is taken; pass --username.')
            user = User(username=username, email=email)

        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()

        action = 'Created' if created else 'Updated'
        self.stdout.write(self.style.SUCCESS(f'{action} admin "{user.username}" ({email}). Log in at /admin-panel/login.'))
