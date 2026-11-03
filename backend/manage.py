#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def check_dependencies():
    """Exit with a clear message when the backend's packages aren't installed."""
    try:
        import django  # noqa: F401
        import django_mongodb_backend  # noqa: F401
    except ImportError as exc:
        # PowerShell only runs scripts from the current folder with a leading .\
        activate = r'.\venv\Scripts\Activate.ps1' if os.name == 'nt' else 'source .venv/bin/activate'
        sys.exit(
            f"\n❌ Missing package: {exc.name}\n"
            f"   Python in use: {sys.executable}\n"
            f"   Activate the backend virtual environment first (from backend/):\n"
            f"     {activate}\n"
            f"   or install the packages: pip install -r ../requirements.txt\n"
        )


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
    check_dependencies()
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
