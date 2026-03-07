# Phase 02: Universities & Authentication

Build two Django apps — `universities` (new) and `authentication` (rewrite existing stub) — with full models, serializers, views, URL routing, Celery tasks, admin, and tests.

## User Review Required

> [!IMPORTANT]
> The existing `User` model (stub from Phase 01) inherits from `AbstractUser`. Phase 02 requires rewriting it to use `AbstractBaseUser + PermissionsMixin`. This means **deleting the existing migration** (`0001_initial.py`) and regenerating. Since the project is in early development with no production data, this is safe.

> [!WARNING]
> The `faculty` role is specified in the Phase 02 prompt but was NOT in the Phase 01 stub. It will be added to `ROLE_CHOICES` in the new model.

## Proposed Changes

### Universities App (NEW)

#### [NEW] [\_\_init\_\_.py](file:///H:/New%20folder/CampusHat/backend/apps/universities/__init__.py)
App package init with `default_app_config`.

#### [NEW] [apps.py](file:///H:/New%20folder/CampusHat/backend/apps/universities/apps.py)
`UniversitiesConfig` with `name = 'apps.universities'`.

#### [NEW] [models.py](file:///H:/New%20folder/CampusHat/backend/apps/universities/models.py)
`University(BaseModel)` with all specified fields:
- `name`, `short_name`, `slug`, `system_id`, `division` (choices), `district`, `postal_code`, `full_address`, `short_description`, `logo_url`, `is_active`, `sso_enabled`, `sso_provider`, `sso_domain`
- Auto-generate `system_id` (UNIV-00001) and `slug` (from short_name) on save
- Indexes on `[slug, short_name, is_active]`

#### [NEW] [serializers.py](file:///H:/New%20folder/CampusHat/backend/apps/universities/serializers.py)
- `UniversityListSerializer` — subset of fields for list views
- `UniversityDetailSerializer` — all fields
- `UniversityCreateUpdateSerializer` — writable fields for admin

#### [NEW] [views.py](file:///H:/New%20folder/CampusHat/backend/apps/universities/views.py)
`UniversityViewSet(ModelViewSet)` with:
- `list` / `retrieve` — public, no auth
- `search` — custom action, filter by name/short_name/district/division
- `create` / `update` — admin only
- `destroy` — admin only, soft-delete (set `is_active=False`)
- Lookup by `slug`

#### [NEW] [urls.py](file:///H:/New%20folder/CampusHat/backend/apps/universities/urls.py)
Router-based URL patterns for the ViewSet.

#### [NEW] [admin.py](file:///H:/New%20folder/CampusHat/backend/apps/universities/admin.py)
Register `University` with custom list_display, search, filters.

---

### Authentication App (REWRITE)

#### [MODIFY] [models.py](file:///H:/New%20folder/CampusHat/backend/apps/authentication/models.py)
Full rewrite:
- `UserManager(BaseUserManager)` — `create_user()`, `create_superuser()`
- `User(AbstractBaseUser, PermissionsMixin, UUIDMixin, TimestampMixin)` with all specified fields: `university` FK, `email` (unique, login field), `phone`, `full_name`, `profile_picture`, `role` (5 choices), `is_email_verified`, `is_phone_verified`, `is_active`, `is_staff`, `reputation_score`, `last_login`, `deleted_at`
- Properties: `is_verified_student`, `is_approved_seller`, `display_name`
- `soft_delete()` method
- Indexes on `[email, (university_id, role, is_active)]`
- `EmailVerificationToken(UUIDMixin)` — `user` FK, `token`, `expires_at`, `is_used`, `created_at`

#### [NEW] [serializers.py](file:///H:/New%20folder/CampusHat/backend/apps/authentication/serializers.py)
- `UserRegistrationSerializer` — validate university, email, password; create user + token
- `UserLoginSerializer` — validate credentials, check active/verified
- `UserProfileSerializer` — read-only public profile
- `UserDetailSerializer` — full own profile
- `UserUpdateSerializer` — update name/phone/picture
- `ChangePasswordSerializer` — old + new password validation

#### [MODIFY] [views.py](file:///H:/New%20folder/CampusHat/backend/apps/authentication/views.py)
All endpoints:
- `POST /register/` → create user, generate token, queue Celery task
- `GET /verify-email/?token=xxx` → verify token, activate user
- `POST /login/` → JWT pair + user data
- `POST /token/refresh/` → SimpleJWT refresh
- `POST /logout/` → blacklist refresh token
- `GET /me/` → own profile
- `PATCH /me/update/` → update profile
- `POST /change-password/`
- `POST /resend-verification/`

#### [NEW] [urls.py](file:///H:/New%20folder/CampusHat/backend/apps/authentication/urls.py)
URL patterns for all auth endpoints.

#### [NEW] [tasks.py](file:///H:/New%20folder/CampusHat/backend/apps/authentication/tasks.py)
Celery task `send_verification_email(user_id)` — fetch user/token, send HTML email with verification link.

#### [NEW] [templates/emails/verification_email.html](file:///H:/New%20folder/CampusHat/backend/templates/emails/verification_email.html)
HTML email template for verification with link to `{FRONTEND_URL}/verify-email?token={token}`.

#### [MODIFY] [admin.py](file:///H:/New%20folder/CampusHat/backend/apps/authentication/admin.py)
Full rewrite for `UserAdmin` (custom fieldsets since we use `AbstractBaseUser`), plus `EmailVerificationToken` admin.

#### [MODIFY] [apps.py](file:///H:/New%20folder/CampusHat/backend/apps/authentication/apps.py)
No changes needed (already correct).

#### [NEW] [tests/\_\_init\_\_.py](file:///H:/New%20folder/CampusHat/backend/apps/authentication/tests/__init__.py)
#### [NEW] [tests/test_user_registration.py](file:///H:/New%20folder/CampusHat/backend/apps/authentication/tests/test_user_registration.py)
Tests: register, duplicate email, inactive university.
#### [NEW] [tests/test_login.py](file:///H:/New%20folder/CampusHat/backend/apps/authentication/tests/test_login.py)
Tests: valid login, wrong password, unverified email.
#### [NEW] [tests/test_email_verification.py](file:///H:/New%20folder/CampusHat/backend/apps/authentication/tests/test_email_verification.py)
Tests: valid token, expired token, used token.

---

### Configuration Updates

#### [MODIFY] [base.py](file:///H:/New%20folder/CampusHat/backend/config/settings/base.py)
Add `'apps.universities'` to `LOCAL_APPS`.

#### [MODIFY] [urls.py](file:///H:/New%20folder/CampusHat/backend/config/urls.py)
Add:
- `path('api/v1/auth/', include('apps.authentication.urls'))`
- `path('api/v1/universities/', include('apps.universities.urls'))`

---

### Migrations

#### [DELETE] [0001_initial.py](file:///H:/New%20folder/CampusHat/backend/apps/authentication/migrations/0001_initial.py)
Delete the Phase 01 stub migration.

New migrations will be generated for both apps via `python manage.py makemigrations`.

## Verification Plan

### Automated Tests
Run the test suite with:
```bash
cd H:\New folder\CampusHat\backend
python manage.py test apps.authentication.tests --verbosity=2
```

Tests cover:
- **Registration**: successful registration, duplicate email rejection, inactive university rejection
- **Login**: valid login with JWT tokens, wrong password, unverified email blocked
- **Email Verification**: valid token acceptance, expired token rejection, used token rejection

### Syntax/Import Verification
```bash
cd H:\New folder\CampusHat\backend
python manage.py check --deploy 2>&1 | head -50
python manage.py makemigrations --check --dry-run
```

### Manual Verification
Since this project requires PostgreSQL + Redis (Docker), the user should:
1. Start Docker containers: `docker-compose up -d` in the backend directory
2. Run migrations: `python manage.py migrate`
3. Test registration endpoint via curl/Postman:
   ```
   POST http://localhost:8000/api/v1/auth/register/
   Body: {"email": "test@example.com", "password": "testpass123", "full_name": "Test User", "university_id": "<uuid>"}
   ```
4. Confirm JWT tokens work after email verification
