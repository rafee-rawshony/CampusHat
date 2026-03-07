# 🚀 CampusHat Backend: Project Status & Handover Document

> **ATTENTION TEAM MEMBERS & CLAUDE OPUS:**  
> Read this document first. It contains the complete context of what has been built up to this point, how the environment is configured, and how to run the project. You do not need to figure things out from scratch.

---

## 1. Current Project State
We have successfully completed **Phase 01 (Project Setup)** and **Phase 02 (Universities & Authentication)**. 
The backend is a production-ready Django API powered by **PostgreSQL, Redis, Celery, and Docker**. 

**Important:** There is NO Firebase and NO SQLite used in this project. Everything is fully self-hosted.

---

## 2. What Has Been Built

### Phase 01: Core Architecture
- Complete Django project setup (`config/`) using `python-decouple` for `.env` management.
- Custom JSON API Renderer (`core/renderers.py`) to ensure every API response follows this exact format:
  ```json
  {
    "success": true,
    "message": "...",
    "data": {},
    "errors": {},
    "code": "..."
  }
  ```
- Base Models (`core/models.py`) providing `UUIDMixin`, `TimestampMixin`, and `SoftDeleteMixin`.
- Custom Exception Handler (`core/exceptions.py`) to catch errors and return them in the strict JSON format above.
- Docker & Docker Compose setup for easy local development.

### Phase 02: Universities & Authentication
#### App: `universities`
- `University` model with auto-generated `system_id` (e.g. `UNIV-00001`) and `slug`. Includes division/district routing and SSO configuration fields.
- Public read endpoints for universities, and admin-only endpoints for Create/Update/Delete (soft-delete).

#### App: `authentication` (Completely Rewritten)
- Custom `User` model (`AbstractBaseUser`) with **Email-based login only** (no username).
- **5 Roles**: `student`, `faculty`, `seller`, `moderator`, `admin`.
- Every user is strictly scoped to a `University` via a Foreign Key.
- **Strict Email Verification**: Users MUST verify their email via a 24-hour token before they can log in.
- **JWT Authentication**: `access_token` (15 mins) and `refresh_token` (7 days) with token blacklisting on logout.
- **Celery Tasks**: Async email sending configured via Redis.
- **14 Automated Tests**: Covering registration, verification, and login logic.

---

## 3. Environment & Collaboration Workflow

To ensure seamless teamwork, we have tracked specific configuration files directly in Git:
- `.env` is tracked! You do not need to create it manually. Just pull the repository, and the defaults will work out-of-the-box. (Note: Only `.env.production` is ignored).
- `docker-compose.yml` is fully configured to spin up:
  1. `campushat_backend` (Django API)
  2. `campushat_db` (PostgreSQL 15)
  3. `campushat_redis` (Redis 7)
  4. `campushat_celery` (Celery Worker)
  5. `campushat_celerybeat` (Celery Scheduler)
  6. `campushat_nginx` (Reverse Proxy)

### ✨ Auto-Database Loading
The repository includes a file named `database_dump.sql` in the `backend/` directory. 
**When you run `docker-compose up` for the first time, Docker will automatically load this dump into your PostgreSQL database.** You will instantly have all the test universities, test accounts, and table structures exactly as they were when Phase 02 ended.

---

## 4. How to Run the Project Local Environment

**Step 1:** Pull the `backend` branch from GitHub.
```bash
git fetch
git checkout backend
git pull origin backend
```

**Step 2:** Start everything via Docker Compose.
```bash
cd backend
docker-compose up --build -d
```

**Step 3:** Access the APIs.
- API Base URL: `http://localhost:8000/api/v1/`
- Interactive Swagger Docs: `http://localhost:8000/api/docs/`
- Django Admin Panel: `http://localhost:8000/admin/`
  - *Admin Login*: `admin@campushat.com` / `Admin@12345`

---

## 5. Rules for Claude Opus & Team Developers

When starting **Phase 03** (or any future phase), adhere strictly to these rules:

1. **Git Workflow:** 
   - All backend work must be committed and pushed to the `backend` branch.
   - Do NOT push intermediate broken code. Use `git commit -m "..."` locally while working. Only `git push origin backend` when a full feature or sub-task is complete and tested.
2. **Standardization:**
   - Any new model MUST inherit from `core.models.BaseModel`.
   - Never use Django's default HTML API views. Always use DRF and let `CampusHatJSONRenderer` format the output.
3. **Database Migrations:**
   - If you alter models, generate migrations using `docker exec campushat_backend python manage.py makemigrations`. Do NOT delete old migrations unless rewriting an app from scratch.
4. **Environment Variables:**
   - If you need a new API key or config, add it to `.env` so other team members get it upon pulling.

Go ahead and build the next phase of CampusHat! 🎓🚀
