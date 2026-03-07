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
git clone https://github.com/your-org/CampusHat.git
cd CampusHat
git checkout backend
cd backend
```

### 2. Environment Variables

```bash
cp .env.example .env
# Edit .env with your values
```

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

### 4. Verify

```bash
docker-compose exec backend python manage.py check
```

## Development Commands

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Run tests
docker-compose exec backend python -m pytest

# Django shell
docker-compose exec backend python manage.py shell

# View logs
docker-compose logs -f backend
```

## API Documentation

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **Admin**: http://localhost:8000/admin/

## Project Structure

```
backend/
├── config/           # Django project configuration
│   ├── settings/     # Modular settings (base/dev/prod)
│   ├── celery.py     # Celery app configuration
│   └── urls.py       # Root URL routing
├── apps/             # Django apps (added in later phases)
├── core/             # Shared base classes & utilities
│   ├── models.py     # BaseModel, UUID/Timestamp/SoftDelete mixins
│   ├── permissions.py
│   ├── pagination.py
│   ├── exceptions.py
│   ├── renderers.py
│   └── utils.py
├── requirements/     # Pip requirements (base/dev/prod)
├── docker/           # Dockerfiles & nginx config
├── docker-compose.yml
└── manage.py
```

## License

© 2026 CampusHat Team. All Rights Reserved.
This repository contains proprietary source code.
