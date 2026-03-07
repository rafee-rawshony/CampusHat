# Phase 02: Universities & Authentication — Task Checklist

## Universities App
- [x] Create `apps/universities/` with `__init__.py`, `apps.py`
- [x] Create `University` model with all fields, auto system_id, auto slug
- [x] Create serializers (List, Detail, CreateUpdate)
- [x] Create `UniversityViewSet` with list, retrieve, search, create, update, destroy
- [x] Create `apps/universities/urls.py`
- [x] Register in admin
- [x] Register app in settings and URL config

## Authentication App (Rewrite)
- [x] Rewrite `User` model from `AbstractUser` → `AbstractBaseUser + PermissionsMixin`
- [x] Create custom `UserManager` with `create_user()` / `create_superuser()`
- [x] Create `EmailVerificationToken` model
- [x] Create serializers (Registration, Login, Profile, Detail, Update, ChangePassword)
- [x] Create views (register, verify-email, login, refresh, logout, me, update, change-password, resend-verification)
- [x] Create `apps/authentication/urls.py`
- [x] Create Celery task `send_verification_email`
- [x] Create email template
- [x] Rewrite admin registration
- [x] Create `backends.py` (EmailBackend for email-based auth)
- [x] Write tests (registration, login, email verification)

## Configuration Updates
- [x] Add `apps.universities` to `INSTALLED_APPS` in settings
- [x] Add URL patterns in `config/urls.py`
- [x] Add `AUTHENTICATION_BACKENDS` in settings

## Database Migrations
- [x] Delete old migration for stub User model
- [x] Generate fresh migrations for both apps
- [x] Verify migrations are valid

## Verification
- [x] Docker Compose up with all services running
- [x] Migrations applied successfully
- [x] All 6 endpoint tests passed (Registration, Login blocked, Verification, Login+JWT, Me, Logout)
