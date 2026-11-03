# JobFinder Pro: React frontend

This is the website UI, built with React (Vite). Django only serves data: the app talks to the JSON API in `backend/myapp/api.py`, which is mounted at `/api/`.

## Run

```powershell
# terminal 1: Django (WSL / Linux)
cd backend
python3 -m venv .venv && .venv/bin/pip install -r ../requirements.txt   # first time only
cp .env.example .env      # then put your MongoDB Atlas URI in .env
.venv/bin/python manage.py migrate
.venv/bin/python manage.py runserver

# terminal 2: React
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Vite proxies `/api` to Django (`http://127.0.0.1:8000`, or set `DJANGO_URL`). `/media` (uploaded resumes) is proxied too. This keeps the session and CSRF cookies same-origin.

The database is MongoDB Atlas (`django-mongodb-backend`). Set `MONGODB_URI` and `MONGODB_DB` in `backend/.env`. On startup, `runserver` prints whether Atlas connected, and `/api/health/` reports the database status.

## MVC structure

```
src/
├── models/            M: data and business rules. No React here.
│   ├── httpClient.js      fetch wrapper (CSRF header, JSON errors as ApiError)
│   ├── JobModel.js        Job entity (initials, postedAgo, ...) and job API calls
│   ├── ApplicantModel.js  application submit, candidate list/detail
│   ├── AuthModel.js       login / logout / signup / password reset
│   ├── choices.js         mirrors the Django model choices
│   └── formatters.js      ports of Django filters (timesince, truncatewords, date)
├── controllers/       C: hooks that own state, call models, decide navigation
│   ├── AuthController.jsx     logged-in user context
│   ├── FlashController.jsx    replacement for Django's messages framework
│   ├── RequireAuth.jsx        @login_required equivalent
│   ├── HomeController.js, AuthPagesController.js, JobsController.js,
│   │   ApplicationController.js, CandidatesController.js
│   └── useForm.js, useAsync.js
├── views/             V: presentation only (JSX + CSS)
│   ├── pages/             one component per page
│   ├── components/        shared pieces (header, footer, job cards, form fields)
│   ├── hooks/             view-only effects (title/stylesheets, scrolling)
│   └── styles/pages/      scoped CSS (one file per page)
├── config/routes.js   URL paths (same as myapp/urls.py)
└── App.jsx            router
```

Rules: views only import controllers, never models. Controllers import models. Models import neither.

## Styles

Each page's CSS lives in `src/views/styles/pages/` and every selector is scoped to the page's wrapper class (for example `.page-home h1`), so pages' styles never clash.

Bootstrap and Google Fonts load only while the page that used them is mounted (`views/hooks/usePageAssets.js`), so they never affect other pages.
