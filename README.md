# 💼 JobFinder — Job Circular Website

A job portal for Bangladesh where job seekers find and apply for jobs, and employers post job circulars and review applicants.

🔗 **Live Demo:** _coming soon_ &nbsp;·&nbsp; **API:** _coming soon_

![Home](docs/screenshots/home.png)

## ✨ Features
- 🔍 Search jobs by keyword, location, category, job type and salary
- 👤 Separate accounts for **Job Seekers** and **Employers**
- 📝 Employers post jobs and review applicants
- 📄 Apply with a resume and track your applications
- 🏢 Company verification and an **Admin Panel** to review job posts
- 🌗 Light / dark mode, fully responsive

## 📸 Screenshots
| Browse Jobs | Login |
|---|---|
| ![Jobs](docs/screenshots/jobs.png) | ![Login](docs/screenshots/login.png) |
| **Sign Up** | |
| ![Sign up](docs/screenshots/signup.png) | |

## 🛠️ Tech Stack
- **Frontend:** React + Vite — deployed on **Vercel**
- **Backend:** Django 5.2 REST API — deployed on **Render**
- **Database:** MongoDB Atlas

## ⚙️ Run Locally
```bash
# Backend
cd backend
python -m venv venv && venv/Scripts/activate   # Linux/macOS: source venv/bin/activate
pip install -r ../requirements.txt
# create backend/.env with MONGODB_URI=... and MONGODB_DB=jobportal
python manage.py migrate
python manage.py runserver

# Frontend (new terminal)
cd frontend
npm install
npm run dev     # http://localhost:5173
```

## 👨‍💻 Author
**Khandoker Md. Ragib Ahsan** — [GitHub](https://github.com/ragibKhandoker)
