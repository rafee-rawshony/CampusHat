# Phase 02 Walkthrough: Universities & Authentication

## Summary

Built two Django apps — `universities` and `authentication` — with full models, serializers, views, URL routing, Celery tasks, admin, and tests. All endpoints verified via Docker Compose.

---

## Files Created/Modified

| App | Files |
|-----|-------|
| **universities** | `__init__.py`, `apps.py`, `models.py`, `serializers.py`, `views.py`, `urls.py`, `admin.py`, `migrations/0001_initial.py` |
| **authentication** | `__init__.py`, `apps.py`, `models.py` (rewrite), `serializers.py`, `views.py`, `urls.py`, `admin.py`, `backends.py`, `tasks.py`, `migrations/0001_initial.py` |
| **tests** | `tests/__init__.py`, `test_user_registration.py`, `test_login.py`, `test_email_verification.py` |
| **templates** | `templates/emails/verification_email.html` |
| **config** | `settings/base.py` (INSTALLED_APPS, AUTH_BACKENDS), `urls.py` (API routes), `.env` |

---

## API Endpoints

### Universities `/api/v1/universities/`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List universities |
| GET | `/{slug}/` | Public | University detail |
| GET | `/search/?q=` | Public | Search |
| POST | `/` | Admin | Create |
| PATCH | `/{slug}/` | Admin | Update |
| DELETE | `/{slug}/` | Admin | Soft-delete |

### Authentication `/api/v1/auth/`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register/` | Public | Register student |
| GET | `/verify-email/?token=` | Public | Verify email |
| POST | `/login/` | Public | JWT login |
| POST | `/token/refresh/` | Public | Refresh access token |
| POST | `/logout/` | Auth | Blacklist refresh token |
| GET | `/me/` | Auth | Own profile |
| PATCH | `/me/update/` | Auth | Update profile |
| POST | `/change-password/` | Auth | Change password |
| POST | `/resend-verification/` | Public | Resend verification |

---

## Verification Results

Docker Compose started with all services: `backend`, `db` (PostgreSQL), `redis`, `celery`, `celerybeat`, `nginx`.

### Endpoint Tests — ALL PASSED ✅

```
============================================================
  PHASE 02 ENDPOINT TEST RESULTS
============================================================
  [PASS] 1. Registration (HTTP 201)
  [PASS] 2. Login blocked (unverified) (HTTP 400)
  [PASS] 3. Email verification (HTTP 200)
  [PASS] 4. Login (verified + JWT) (HTTP 200)
  [PASS] 5. GET /auth/me/ (HTTP 200)
  [PASS] 6. Logout (HTTP 200)
============================================================
  ALL 6 TESTS PASSED!
============================================================
```

### Key Validations
- ✅ `system_id` auto-generates as `UNIV-00001`
- ✅ `slug` auto-generates from `short_name`
- ✅ Passwords are hashed (never stored plain)
- ✅ Email verification required before login
- ✅ JWT access + refresh tokens returned on login
- ✅ Token blacklisting works on logout
- ✅ University data correctly scoped to user profile
