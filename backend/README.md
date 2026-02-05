# CampusHat Backend

Django REST API for CampusHat.

## Tech Stack

- Django
- Django REST Framework
- SQLite / PostgreSQL
- JWT Authentication

## Project Structure

```bash
apps/
├── users/
├── marketplace/
└── mall/
```

## Rules

- All APIs must be documented
- Separate apps for each module

## Setup

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
