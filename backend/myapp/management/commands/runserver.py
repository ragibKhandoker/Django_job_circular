"""runserver with a startup banner: MongoDB status, URLs, and port checks."""
import json
import os
import socket
import urllib.request

from django.contrib.staticfiles.management.commands.runserver import Command as RunserverCommand

from myapp.db_status import mongodb_info

FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
LINE = '=' * 54


class Command(RunserverCommand):
    def inner_run(self, *args, **options):
        host = '127.0.0.1' if self.addr in ('0.0.0.0', '::', '0') else self.addr
        url = f'http://{"localhost" if host == "127.0.0.1" else host}:{self.port}'

        if self._port_in_use(host):
            self._handle_port_in_use(host, url)

        self.stdout.write('⏳ Connecting to MongoDB Atlas...')
        db = mongodb_info()
        self._db_ok = db['ok']
        if db['ok']:
            self.stdout.write(self.style.SUCCESS('✅ MongoDB Atlas Database Connected!'))
            self.stdout.write(f'    Cluster:      {db["host"]}')
            self.stdout.write(f'    Database:     {db["database"]}')
            self.stdout.write(f'    MongoDB:      v{db["version"]}  (ping {db["ping_ms"]} ms)')
            self.stdout.write(f'    Collections:  {db["collections"]}')
        else:
            self.stdout.write(self.style.ERROR(f'❌ MongoDB Atlas Connection Failed: {db["error"]}'))
            self.stdout.write('   Run "python manage.py check_mongodb" to find the problem.')

        self.stdout.write(f'\n{LINE}')
        self.stdout.write(' 💼 JobFinder Pro (Django) is running!')
        self.stdout.write(f' ➜  Database:     MongoDB Atlas ({"connected" if db["ok"] else "NOT connected"})')
        self.stdout.write(f' ➜  Backend URL:  {url}')
        self.stdout.write(f' ➜  API Status:   {url}/api/health/')
        self.stdout.write(f' ➜  Admin:        {url}/admin/')
        self.stdout.write(f' ➜  Frontend:     {FRONTEND_URL}  (npm run dev)')
        self.stdout.write(f'{LINE}\n')

        super().inner_run(*args, **options)

    def check_migrations(self):
        # Without a database the migration check would crash the server;
        # keep running so the banner and /api/health/ can report the problem.
        if self._db_ok:
            super().check_migrations()

    def _port_in_use(self, host):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(1)
            return sock.connect_ex((host, int(self.port))) == 0

    def _handle_port_in_use(self, host, url):
        try:
            with urllib.request.urlopen(f'http://{host}:{self.port}/api/health/', timeout=5) as response:
                health = json.loads(response.read())
            if response.status == 200 and health.get('status') == 'OK':
                self.stdout.write(f'JobFinder backend is already running at {url}; reusing it.')
                os._exit(0)
        except Exception as exc:
            self.stderr.write(f'Could not verify the service using this port: {exc}')
        self.stderr.write(f'PORT {self.port} is occupied by a service that is not the JobFinder API.')
        os._exit(1)
