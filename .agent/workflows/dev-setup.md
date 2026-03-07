---
description: How to set up, run, and test the CampusHat backend for development
---

# CampusHat Backend — Development Workflow

## Prerequisites
- Docker Desktop installed and running
- Git CLI
- PowerShell (Windows) / Terminal (Mac/Linux)

## 1. Clone & Setup

```bash
git clone <repo-url>
cd CampusHat
git checkout backend
```

## 2. Environment File

The `.env` file is already committed for dev convenience. If missing, copy from `.env.example`:
```bash
cp backend/.env.example backend/.env
```

Key variables:
- `DJANGO_SECRET_KEY` — change in production
- `DB_NAME=campushat_db`, `DB_USER=campushat_user`, `DB_PASSWORD=campushat_password`
- `ENCRYPTION_KEY` — Fernet key for seller financial data encryption (auto-derived from SECRET_KEY if empty)

## 3. Start All Services

// turbo
```bash
cd backend
docker-compose up --build -d
```

This starts 6 containers:
| Container | Port | Purpose |
|---|---|---|
| `campushat_backend` | 8000 | Django + Gunicorn |
| `campushat_db` | 5432 | PostgreSQL 15 |
| `campushat_redis` | 6379 | Redis (cache + Celery) |
| `campushat_celery` | — | Celery worker |
| `campushat_celerybeat` | — | Celery Beat scheduler |
| `campushat_nginx` | 80 | Nginx reverse proxy |

## 4. Run Migrations (if needed)

// turbo
```bash
docker exec campushat_backend python manage.py migrate
```

## 5. Load Database Dump (full data from all phases)

// turbo
```bash
docker exec -i campushat_db psql -U campushat_user -d campushat_db < backend/database_dump.sql
```

## 6. Verify Everything Works

// turbo
```bash
docker exec campushat_backend python manage.py check
docker exec campushat_backend python manage.py showmigrations
```

## 7. Run Phase Tests

// turbo
```bash
docker exec campushat_backend python test_phase04.py
docker exec campushat_backend python test_phase05.py
```

## 8. Access APIs

- Swagger Docs: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/
- Admin Panel: http://localhost:8000/admin/

## 9. Key API Endpoints

### Auth (Phase 02-03)
- `POST /api/v1/auth/register/`
- `POST /api/v1/auth/login/`
- `GET  /api/v1/auth/me/`
- `POST /api/v1/auth/verification/submit/`

### Marketplace (Phase 04)
- `GET  /api/v1/marketplace/listings/`
- `POST /api/v1/marketplace/listings/`
- `GET  /api/v1/marketplace/categories/`

### Sellers (Phase 05)
- `POST /api/v1/sellers/register/`
- `GET  /api/v1/sellers/my-dashboard/`
- `POST /api/v1/stores/create/`
- `GET  /api/v1/stores/`

### Admin
- `GET /api/v1/admin/marketplace/pending/`
- `GET /api/v1/admin/sellers/pending/`
- `GET /api/v1/admin/stores/pending/`

## 10. Common Commands

```bash
# View logs
docker logs campushat_backend --tail 50

# Shell into backend
docker exec -it campushat_backend bash

# Django shell
docker exec -it campushat_backend python manage.py shell

# Create superuser
docker exec -it campushat_backend python manage.py createsuperuser

# Make new migrations
docker exec campushat_backend python manage.py makemigrations <app_name>

# Reset and rebuild
docker-compose down -v
docker-compose up --build -d

# Generate fresh database dump
docker exec campushat_db pg_dump -U campushat_user campushat_db -c --if-exists > backend/database_dump.sql
```

## 11. Phase Status

| Phase | Status | Tables | Tests |
|---|---|---|---|
| 01 Project Setup | ✅ Done | — | Docker check |
| 02 Universities & Auth | ✅ Done | 3 (users, universities, email_tokens) | Auth tests |
| 03 User Verification | ✅ Done | 3 (verifications, sessions, addresses) | Verification tests |
| 04 Campus Marketplace | ✅ Done | 8 (categories, products, images, offers, chats, messages, reviews, reports) | 26/26 pass |
| 05 Seller System | ✅ Done | 5 (seller_profiles, stores, badges, payouts, benefits) | 28/28 pass |
| 06 CampusHat Mall | 🔲 Next | — | — |
| 07 Order & Payment | 🔲 | — | — |
| 08 Refunds & Delivery | 🔲 | — | — |
| 09 Admin Panel | 🔲 | — | — |
| 10 Analytics & Polish | 🔲 | — | — |

## 12. For Claude Opus / AI Continuation

Read `docs/CLAUDE_OPUS_HANDOVER.md` before starting any new phase. It contains:
- Full architecture details
- Every model and field documented
- API endpoint inventory
- Design rules and conventions
- What NOT to change
