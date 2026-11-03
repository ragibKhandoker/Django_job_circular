# JobFinder Pro: React frontend

This is a React (Vite) version of the Django templates in `myapp/templates/`. The UI is the same: each page's CSS is copied from its original template. Django still owns the data. The app talks to the JSON API in `myapp/api.py`, which is mounted at `/api/`.

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
│   ├── pages/             one component per original template
│   ├── components/        shared pieces (header, footer, job cards, form fields)
│   ├── hooks/             view-only effects (title/stylesheets, scrolling)
│   └── styles/pages/      generated, scoped CSS (one file per template)
├── config/routes.js   URL paths (same as myapp/urls.py)
└── App.jsx            router
```

Rules: views only import controllers, never models. Controllers import models. Models import neither.

## Styles

`npm run extract-styles` regenerates `src/views/styles/pages/*.css` from the `<style>` blocks in `myapp/templates/`. It scopes every selector to the page's wrapper class (`body` becomes `.page-home`, `h1` becomes `.page-home h1`). This stops the pages' global selectors from clashing in one app. Do one of these, not both:

- edit the template's `<style>` and re-run the script, or
- edit the generated CSS directly and stop using the script.

Bootstrap and Google Fonts load only while the page that used them is mounted (`views/hooks/usePageAssets.js`), as they did in the original templates.
