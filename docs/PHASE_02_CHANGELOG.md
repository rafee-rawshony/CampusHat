# CampusHat Backend — Phase 02 Changelog

## What Was Built

### App 1: `apps/universities/`
- **University model** with 15 fields, auto `system_id` (UNIV-00001), auto `slug`
- SSO configuration fields (Google/Microsoft/SAML support)
- Division choices for all 8 Bangladesh divisions
- Full CRUD ViewSet — public list/retrieve/search, admin-only create/update/destroy
- Soft-delete on destroy (sets `is_active=False`)

### App 2: `apps/authentication/` (Full Rewrite)
- **Custom User model** (`AbstractBaseUser + PermissionsMixin`) — email-based login, no username
- **5 Roles**: student, faculty, seller, moderator, admin
- **University FK** — every user is scoped to a university
- **Email verification** — token-based with 24-hour expiry
- **JWT authentication** — 15min access token, 7-day refresh, token rotation + blacklisting
- **Celery task** — async verification email sending
- **Email auth backend** — `backends.py` for `authenticate(email=...)`

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/universities/` | Public | List universities |
| GET | `/api/v1/universities/{slug}/` | Public | University detail |
| GET | `/api/v1/universities/search/?q=` | Public | Search |
| POST | `/api/v1/universities/` | Admin | Create university |
| PATCH | `/api/v1/universities/{slug}/` | Admin | Update university |
| DELETE | `/api/v1/universities/{slug}/` | Admin | Soft-delete |
| POST | `/api/v1/auth/register/` | Public | Register (student) |
| GET | `/api/v1/auth/verify-email/?token=` | Public | Verify email |
| POST | `/api/v1/auth/login/` | Public | JWT login |
| POST | `/api/v1/auth/token/refresh/` | Public | Refresh token |
| POST | `/api/v1/auth/logout/` | Auth | Blacklist token |
| GET | `/api/v1/auth/me/` | Auth | Own profile |
| PATCH | `/api/v1/auth/me/update/` | Auth | Update profile |
| POST | `/api/v1/auth/change-password/` | Auth | Change password |
| POST | `/api/v1/auth/resend-verification/` | Public | Resend verification |

### Config Changes
- `apps.universities` added to `INSTALLED_APPS`
- `AUTHENTICATION_BACKENDS` set to `EmailBackend`
- URL patterns registered for both apps
- `.env` now tracked in git for team dev environment

---

## How to Run (For Team Members)

```bash
# 1. Clone and switch to backend branch
git clone https://github.com/rafee-rawshony/CampusHat.git
cd CampusHat/backend

# 2. Start all services
docker-compose up --build

# 3. Server runs at http://localhost:8000
# API docs at http://localhost:8000/api/docs/
# Admin at http://localhost:8000/admin/
```

Docker Compose starts: PostgreSQL, Redis, Django backend, Celery worker, Celery beat, Nginx.

### Useful URLs
- **Swagger Docs**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **Admin Panel**: http://localhost:8000/admin/

---

## Files Added/Modified

```
backend/
├── apps/
│   ├── universities/          ← NEW APP
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── models.py          (University model)
│   │   ├── serializers.py     (List/Detail/CreateUpdate)
│   │   ├── views.py           (UniversityViewSet)
│   │   ├── urls.py
│   │   ├── admin.py
│   │   └── migrations/
│   │       └── 0001_initial.py
│   │
│   └── authentication/        ← REWRITTEN
│       ├── __init__.py
│       ├── apps.py
│       ├── models.py          (User + EmailVerificationToken)
│       ├── serializers.py     (6 serializers)
│       ├── views.py           (9 endpoint views)
│       ├── urls.py
│       ├── admin.py           (Custom UserAdmin)
│       ├── backends.py        (EmailBackend)
│       ├── tasks.py           (Celery email task)
│       ├── migrations/
│       │   └── 0001_initial.py
│       └── tests/
│           ├── test_user_registration.py
│           ├── test_login.py
│           └── test_email_verification.py
│
├── config/
│   ├── settings/base.py       (INSTALLED_APPS, AUTH_BACKENDS updated)
│   └── urls.py                (API routes registered)
│
├── templates/
│   └── emails/
│       └── verification_email.html
│
└── .env                       (development defaults)
```
