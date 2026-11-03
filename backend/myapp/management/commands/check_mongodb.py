"""Step-by-step MongoDB Atlas connection check: python manage.py check_mongodb"""
import socket
from urllib.parse import urlparse

from django.conf import settings
from django.core.management.base import BaseCommand
from pymongo import MongoClient
from pymongo.errors import ConfigurationError, OperationFailure, ServerSelectionTimeoutError


class Command(BaseCommand):
    help = 'Check the MongoDB Atlas connection configured in backend/.env.'

    def handle(self, *args, **options):
        uri = settings.MONGODB_URI
        self.step(1, '.env has MONGODB_URI')
        if uri == 'mongodb://localhost:27017/':
            return self.fail('MONGODB_URI is not set. Copy .env.example to .env and fill it in.')
        if '<db_password>' in uri or '<password>' in uri:
            return self.fail('Replace <db_password> in backend/.env with your Atlas database user password.')
        self.ok()

        host = urlparse(uri).hostname
        self.step(2, f'DNS lookup for {host}')
        if uri.startswith('mongodb+srv://'):
            try:
                import dns.resolver
                dns.resolver.resolve(f'_mongodb._tcp.{host}', 'SRV')
            except Exception as exc:
                return self.fail(f'SRV lookup failed ({exc}). Check the cluster name and your internet/DNS.')
        else:
            try:
                socket.gethostbyname(host)
            except OSError as exc:
                return self.fail(f'Host lookup failed ({exc}).')
        self.ok()

        self.step(3, 'Connect and authenticate')
        client = MongoClient(uri, serverSelectionTimeoutMS=10000)
        try:
            client.admin.command('ping')
            client[settings.MONGODB_DB].list_collection_names()
        except OperationFailure as exc:
            return self.fail(
                f'Authentication failed ({exc.details.get("errmsg", exc) if exc.details else exc}).\n'
                '   Check the username/password under Atlas > Database Access.\n'
                '   URL-encode special characters in the password (@ -> %40, : -> %3A).'
            )
        except ServerSelectionTimeoutError:
            return self.fail(
                'Could not reach the cluster. Most likely your IP is not allowed:\n'
                '   Atlas > Network Access > Add IP Address > "Add Current IP Address"\n'
                '   (or 0.0.0.0/0 for development only).'
            )
        except ConfigurationError as exc:
            return self.fail(f'Invalid connection string ({exc}).')
        finally:
            client.close()
        self.ok()

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ MongoDB Atlas Connected! (database: {settings.MONGODB_DB})\n'
            'Next: python manage.py migrate'
        ))

    def step(self, number, text):
        self.stdout.write(f'[{number}/3] {text} ... ', ending='')

    def ok(self):
        self.stdout.write(self.style.SUCCESS('OK'))

    def fail(self, message):
        self.stdout.write(self.style.ERROR('FAILED'))
        self.stdout.write(self.style.ERROR(f'❌ {message}'))
