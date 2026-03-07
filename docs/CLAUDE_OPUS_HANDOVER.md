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

### Phase 03: User Verification System
Extends `authentication` app with identity validation and session management.
- **New Models**:
  - `UserVerification`: Handles document verification workflow (student ID, faculty ID) with AWS S3 private uploading and tiers (bronze/silver/gold). Admin review queue (`status`, `rejection_reason`).
  - `UserSession`: Stateful JWT session tracking with `token_hash` (SHA-256), device IP tracking, and forced logout (revocation).
  - `UserAddress`: Address profiles with atomic `is_default` toggling.
- **S3 Integration**: Documents are uploaded via `boto3` to a private S3 bucket. Admin API receives 15-minute presigned URLs for safe document viewing.
- **Permissions**: `IsVerifiedStudent` verifies directly against the `UserVerification` model logic instead of simple booleans.
- **Signals**: Automatic `reputation_score` increment when verified.
- **12 Automated Tests**: Covering submitting docs, admin reviewing, session login creation, and addresses.

### Phase 04: Campus Marketplace
Full marketplace module at `apps/marketplace/`.
- **8 Models**:
  - `MarketplaceCategory`: 3-level hierarchy per ad_type (sell/rent/service/food). Auto-slug generation.
  - `MarketplaceProduct`: Full lifecycle (pending → active → expired/sold/hidden → repost). ActiveProductManager, duration validation (sell/rent: 7/15/30, service/food: 30/90/180), auto `expires_at` on create.
  - `MarketplaceProductImage`: Multi-image per product (max 8), S3 upload with local fallback.
  - `MarketplaceOffer`: Price negotiation, one offer per buyer, 48h expiry, accept/reject/counter.
  - `MarketplaceChat` + `MarketplaceMessage`: Per-product buyer-seller threads, message types (text/image/offer_ref), block, mark-read.
  - `MarketplaceReview`: 1-5 rating per product per reviewer.
  - `MarketplaceReport`: Content moderation (spam/fake/scam), admin review queue.
- **API Endpoints**:
  - Public: `GET /marketplace/listings/` (filterable), `GET /marketplace/listings/{id}/` (atomic view_count increment)
  - Verified user: `POST /marketplace/listings/`, hide/unhide/repost/mark-sold, offers, chat, reviews, reports
  - Owner: `GET /marketplace/my-listings/` (all statuses)
  - Admin: `/admin/marketplace/pending/`, approve/reject, reports queue, report action
- **Celery Beat Tasks**:
  - `expire_marketplace_posts`: every 15 min, atomic `select_for_update()` + `transaction.atomic()`
  - `send_expiry_warning`: daily 9 AM BDT, warns posts expiring in 2-3 days
- **Filters** (django-filter): `post_type`, `university_slug`, `category_slug`, `price_min/max`, `condition`, `campus_visibility`, `is_negotiable`
- **Rules**:
  - Guest/unverified users NEVER see user contact info (ListSerializer vs DetailSerializer)
  - `status=pending` posts NEVER appear in public listings
  - Admin must approve before post goes live
  - `view_count` uses `F()` expression (never `.save()` on entire object)
  - Auto-expiry uses `select_for_update()` inside `atomic()`
- **26 Automated Tests**: All passing.

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
