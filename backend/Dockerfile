# Backend API image (build from the repo root: docker build -f backend/Dockerfile .)
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBUG=False \
    PORT=8000

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
RUN SECRET_KEY=build-only python manage.py collectstatic --noinput

EXPOSE 8000

# Needs MONGODB_URI (and SECRET_KEY, ALLOWED_HOSTS, CSRF_TRUSTED_ORIGINS) at run time.
CMD python manage.py migrate --noinput && gunicorn myproject.wsgi:application --bind 0.0.0.0:${PORT}
