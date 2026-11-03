# 💼 Job_Circular_Website

# 📌 Project Overview
The Job Circular Website is a mini job portal built using the Django framework, designed to simplify the job search and recruitment process. It provides a user-friendly platform where job seekers can browse and search for jobs based on categories, and employers can easily post job listings.

This project demonstrates a clean, category-based job management system that balances simplicity and functionality. It is ideal for learning and demonstrating the core concepts of full-stack web development using Django, PostgreSQL, and basic front-end technologies.

# 🚀 Features
- 🔍 **Job Search by Category** – Easily filter jobs by different sectors.
- 📝 **Job Posting for Employers** – Employers can create and manage job listings.
- 🔐 **Admin Dashboard** – Django admin panel to manage users, categories, and jobs.
- 📱 **Responsive Design** – Clean and mobile-friendly UI using HTML and CSS.
- 🗂️ **Category-based Job Organization** – Jobs are organized into categories for better filtering.
# 🛠️ Technologies Used
- **Frontend:** React (Vite) in `frontend/`
- **Backend:** Django 5.2 (Python)
- **Database:** MongoDB Atlas (via `django-mongodb-backend`)

# ⚙️ Getting Started
Commands below are for WSL / Linux / macOS, run from the project root.

# 1️⃣ Set up MongoDB Atlas (one time)
1. **Database user:** Atlas → *Security → Database Access* → *Add New Database User*. Pick a username and password (note the password).
2. **Allow your IP:** Atlas → *Security → Network Access* → *Add IP Address* → *Add Current IP Address*. (`0.0.0.0/0` allows everyone; use it for development only.)
3. **Connection string:** Atlas → *Database → Connect → Drivers* → copy the `mongodb+srv://...` string.

# 2️⃣ Configure `backend/.env`
```bash
cp backend/.env.example backend/.env   # skip if backend/.env already exists
```
Edit `backend/.env`:
```
MONGODB_URI=mongodb+srv://<user>:<db_password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=jobportal
```
- Replace `<db_password>` with the real password. URL-encode special characters (`@` → `%40`, `:` → `%3A`, `/` → `%2F`, `#` → `%23`).
- `.env` is gitignored. Never commit it.
- The database (`MONGODB_DB`) is created automatically on first write.

# 3️⃣ Install the backend
WSL / Linux / macOS (venv in `backend/.venv`):
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r ../requirements.txt
```
Windows PowerShell (venv in `backend/venv`):
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r ..\requirements.txt
```
Activate the venv every time you open a new terminal (the prompt then starts with `(venv)`). All commands below assume it is active.

On Windows you can skip activation with the helper script in `backend/`:
```powershell
.\run.ps1                 # runserver
.\run.ps1 check_mongodb
.\run.ps1 migrate
```

# 4️⃣ Check the Atlas connection
```bash
python manage.py check_mongodb
```
It checks the `.env`, the DNS lookup, and the login one by one, and says what to fix if a step fails.

# 5️⃣ Create collections and an admin user
```bash
python manage.py migrate
python manage.py createsuperuser
```

# 6️⃣ Run
```bash
python manage.py runserver       # backend: http://localhost:8000 (prints Atlas status on startup)
cd ../frontend && npm install && npm run dev   # frontend: http://localhost:5173
```
Health check: http://localhost:8000/api/health/

# 🩺 Troubleshooting
| Message | Fix |
|---|---|
| `Missing package` / `No module named 'django'` | Activate the venv: `source .venv/bin/activate` (WSL) or `.\venv\Scripts\Activate.ps1` (Windows PowerShell) |
| `The term '\activate' is not recognized` | In PowerShell, start the path with `.\`: `.\venv\Scripts\Activate.ps1` (run from `backend/`) |
| `running scripts is disabled on this system` | Run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, or use `.\run.ps1` |
| `PORT 8000 is occupied` | Another server is already on 8000. Stop it (Ctrl+C in its terminal) or run on another port: `python manage.py runserver 8001` |
| `Authentication failed` | Wrong username/password, or special characters not URL-encoded |
| `Could not reach the cluster` / timeout | Add your IP under Atlas → Network Access |
| `SRV lookup failed` | Wrong cluster name, or no internet/DNS |

## 👤 User Roles
- **Admin:** Can manage users, categories, and job posts via the Django admin panel.
- **Employer:** Can create, update, and delete job listings.
- **Job Seeker:** Can search for and view jobs based on categories.
## 📝 License
This project is licensed under the [MIT License](LICENSE).




