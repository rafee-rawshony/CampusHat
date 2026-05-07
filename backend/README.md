# CampusHat Backend

A production-grade Django REST Framework backend for CampusHat — a hybrid e-commerce and marketplace platform for university students and faculty in Bangladesh.

## Systems

- **CampusHat Mall** — Full e-commerce (like Daraz) for campus sellers
- **Campus Marketplace** — C2C peer-to-peer ad board for verified students

## Tech Stack

| Component    | Technology                      |
|-------------|--------------------------------|
| Framework   | Django 4.2 LTS + DRF 3.15     |
| Database    | PostgreSQL 15                   |
| Cache       | Redis 7                        |
| Task Queue  | Celery 5.3 + Beat              |
| Auth        | SimpleJWT                       |
| API Docs    | drf-spectacular (Swagger/Redoc)|
| Storage     | AWS S3 (production)            |
| Server      | Gunicorn + Nginx               |
| Container   | Docker + Docker Compose         |

## Quick Start

### 1. Clone & Setup

```bash
git clone https://github.com/rafee-rawshony/CampusHat.git
cd CampusHat
git checkout backend
cd backend
```

### 2. Environment Variables

The `.env` file is tracked in Git with development defaults. Just pull and run.
Only `.env.production` is gitignored. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Django secret key | dev key provided |
| `POSTGRES_DB` | Database name | `campushat` |
| `POSTGRES_USER` | DB user | `campushat_user` |
| `POSTGRES_PASSWORD` | DB password | `campushat_pass` |
| `REDIS_URL` | Redis connection URL | `redis://redis:6379/0` |
| `AWS_ACCESS_KEY_ID` | S3 access key | empty (local storage) |
| `AWS_SECRET_ACCESS_KEY` | S3 secret key | empty |
| `AWS_STORAGE_BUCKET_NAME` | S3 bucket | `campushat-media` |
| `EMAIL_HOST_USER` | SMTP email | empty |
| `EMAIL_HOST_PASSWORD` | SMTP password | empty |
| `DJANGO_SUPERUSER_EMAIL` | Auto-create superuser | empty |
| `DJANGO_SUPERUSER_PASSWORD` | Superuser password | `admin123` |

### 3. Run with Docker

```bash
docker-compose up --build
```

This starts all 6 services:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **Django** on port 8000
- **Celery** worker
- **Celery Beat** scheduler
- **Nginx** on port 80

### 4. Initial Setup

```bash
# Apply migrations
docker-compose exec backend python manage.py migrate

# Seed university categories (175 categories)
docker-compose exec backend python manage.py seed_categories

# Create roles & permissions (19 permissions, 4 roles)
docker-compose exec backend python manage.py setup_initial_roles

# Create a superuser
docker-compose exec backend python manage.py createsuperuser

# Verify
docker-compose exec backend python manage.py check
```

## Development Commands

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Make new migrations
docker-compose exec backend python manage.py makemigrations

# Run tests
docker-compose exec backend python -m pytest --cov=apps

# Django shell
docker-compose exec backend python manage.py shell

# View logs
docker-compose logs -f backend

# Restart Celery workers
docker-compose restart campushat_celery campushat_celerybeat
```

## API Documentation

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **Admin Panel**: http://localhost:8000/admin/

## Celery Beat Schedule

| Task | Schedule | Description |
|------|----------|-------------|
| `expire_marketplace_posts` | Every 15 min | Auto-expire old marketplace ads |
| `send_expiry_warnings` | Daily 9AM UTC+6 | Warn users of expiring posts |
| `expire_coupons` | Hourly | Deactivate expired coupons |
| `end_flash_sales` | Every 5 min | End completed flash sales |
| `update_seller_dashboard_stats` | Every 6 hours | Recompute seller metrics |
| `cleanup_old_analytics` | Weekly (Sun 2AM) | Purge old views/logs |

## App Architecture

```
backend/
├── config/                    # Project configuration
│   ├── settings/              # base.py, development.py, production.py
│   ├── celery.py              # Celery + Beat schedule
│   └── urls.py                # Root URL routing
├── core/                      # Shared utilities
│   ├── models.py              # BaseModel, UUID/Timestamp/SoftDelete
│   ├── permissions.py         # HasPermission, IsApprovedSeller, etc.
│   ├── middleware.py          # ActivityLogMiddleware
│   ├── pagination.py          # CampusHatPagination
│   ├── wallet_engine.py       # create_wallet_transaction()
│   └── utils.py
├── apps/
│   ├── universities/          # University + Campus models
│   ├── authentication/        # User, JWT, verification, addresses
│   ├── marketplace/           # Peer-to-peer ad board
│   ├── sellers/               # SellerProfile, Store, Payouts
│   ├── mall/                  # Products, Variants, Cart, Reviews
│   ├── wallet/                # Wallet, WalletTransaction, Escrow
│   ├── orders/                # Order, OrderItem, Checkout service
│   ├── refunds/               # Refund with atomic wallet reversal
│   ├── delivery/              # DeliveryPartner, Tracking events
│   ├── coupons/               # Coupons, Flash sales
│   ├── admin_panel/           # Roles, Permissions, Notifications
│   └── analytics/             # ProductView, SearchLog, Stats
├── docs/                      # CLAUDE_OPUS_HANDOVER.md
├── requirements/              # base.txt, dev.txt, production.txt
├── docker/                    # Dockerfile, nginx.conf
├── docker-compose.yml
└── manage.py
```

## Production Deployment Checklist

1. Create `.env.production` with real secrets (never commit this)
2. Set `DJANGO_SETTINGS_MODULE=config.settings.production`
3. Run `python manage.py check --deploy` and fix any warnings
4. Set up S3 bucket for media storage
5. Configure SMTP for email (Gmail or SES)
6. Set `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`
7. Enable HTTPS via Nginx/Load Balancer
8. Run `python manage.py collectstatic`
9. Apply migrations: `python manage.py migrate`
10. Seed data: `seed_categories`, `setup_initial_roles`
11. Start Gunicorn, Celery worker, and Celery Beat

## DigitalOcean Deploy Notes

For the full-stack production compose at the repo root:

1. Copy `.env.example` to `.env` and keep `NEXT_PUBLIC_API_URL=/api/v1`
2. Copy `backend/.env.production.example` to `backend/.env`
3. In `backend/.env`, set:
   - `DJANGO_ALLOWED_HOSTS=178.128.122.157,campushat.com,www.campushat.com,localhost,127.0.0.1`
   - `CORS_ALLOWED_ORIGINS=https://campushat.com,https://www.campushat.com,http://178.128.122.157,https://178.128.122.157`
   - `CSRF_TRUSTED_ORIGINS=https://campushat.com,https://www.campushat.com,http://178.128.122.157,https://178.128.122.157`
   - `SITE_URL=https://campushat.com`
   - `FRONTEND_URL=https://campushat.com`
4. Rebuild after any `NEXT_PUBLIC_*` change:

```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

5. Verify from the VPS:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs backend --tail=200
docker compose -f docker-compose.prod.yml logs nginx --tail=200
curl http://127.0.0.1/api/health/
curl -H "Host: campushat.com" http://127.0.0.1/api/health/
```

If the frontend loads but API calls fail in the browser, the usual cause is a stale frontend build with the wrong `NEXT_PUBLIC_API_URL`. Rebuild the frontend image and confirm the browser is calling `/api/v1/...` on the same host.

## License

© 2026 CampusHat Team. All Rights Reserved.
This repository contains proprietary source code.
