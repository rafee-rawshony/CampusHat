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

### Phase 05: Seller System & Stores
Full seller module at `apps/sellers/`.
- **5 Models**:
  - `SellerProfile`: BD law docs (NID, trade license, TIN, VAT, brand auth), **Fernet-encrypted** bank/mobile details, student seller detection, commission rates (7% student / 10% regular).
  - `Store`: Storefront with auto-slug, logo, banner, status workflow (draft→under_review→active), ratings, review counts.
  - `SellerBadge`: `student_seller` (auto-displays 'Student Seller of {uni.short_name}'), `verified_seller`, `official_store`, `best_seller`, `club_seller`, `fast_dispatch`. Award/revoke by admin.
  - `SellerPayoutRequest`: Withdrawal requests (bank/bKash/Nagad/Rocket), admin processing.
  - `StudentBenefit`: Commission discounts, free listings, priority ranking for student sellers.
- **API Endpoints**:
  - Seller: `register/`, `my-profile/` (GET/PATCH), `my-dashboard/`
  - Store: `create/`, `my-store/`, `update/`, `submit-for-review/`, public `/{slug}/`, listing with filters
  - Payouts: `request/`, list
  - Admin Seller: `pending/`, `{id}/`, `approve/`, `reject/`, `suspend/`
  - Admin Store: `pending/`, `{id}/`, `approve/` (auto-awards student badge), `reject/`
  - Admin Badge: `award/`, `{badge_id}/revoke/`
  - Admin Payout: `pending/`, `process/`, `reject/`
- **Security**: Fernet symmetric encryption (from `cryptography` lib) for `bank_account_details`, `mobile_banking_number`, `nid_number`. Key from `ENCRYPTION_KEY` env var.
- **Celery Tasks**: `notify_admin_new_seller_application`, `notify_seller_approval_result`, `notify_store_approval_result`, `notify_payout_processed`
- **Signals**: `post_save` on `SellerProfile` triggers approval notification
- **Permissions**: `IsApprovedSeller` (already existed in `core/permissions.py`)
- **28 Automated Tests**: All passing.

### Phase 06: CampusHat Mall
Full e-commerce mall module at `apps/mall/`.
- **7 Models**:
  - `MallCategory`: 3-level hierarchy (Main→Sub→Sub-Sub), auto-slug, `get_full_tree()` class method, `full_path` property, `get_descendants()` for filtering.
  - `StoreProduct`: Full product with base/discount price, SKU, JSONB `tags` (with GIN index), `has_variants` toggle, stock management, rating/review counts. Auto-slug from `store.slug-product.name`.
  - `StoreProductImage`: Multi-image per product (max 8), sort_order, is_primary flag.
  - `ProductVariant`: JSONB `attributes` (e.g., `{'color':'Red','size':'XL'}`), per-variant stock, `price_override`, `effective_price` property.
  - `ProductReview`: 1-5 rating, unique per (product, reviewer), seller response with timestamp, visibility toggle.
  - `Cart`: One per user (OneToOneField), coupon_code placeholder for Phase 08.
  - `CartItem`: Price snapshot (`unit_price_snapshot`) set at add-to-cart time, `line_total` property.
- **API Endpoints**:
  - Categories: `GET /mall/categories/` (flat), `GET /mall/categories/tree/` (nested), `GET /mall/categories/{slug}/` (detail), admin CRUD
  - Products: `GET /mall/products/` (filtered listing), `GET /mall/products/{slug}/` (detail), `POST` (seller), `PATCH/DELETE` (owner)
  - Reviews: `GET /mall/products/{slug}/reviews/`, `POST /mall/products/{slug}/reviews/create/`, `PATCH .../reviews/{id}/seller-response/`
  - Variants: `GET/POST /mall/products/{slug}/variants/`, `PATCH/DELETE .../variants/{id}/`
  - Cart: `GET /cart/`, `POST /cart/add/`, `PATCH /cart/update/{id}/`, `DELETE /cart/remove/{id}/`, `DELETE /cart/clear/`, `POST /cart/apply-coupon/`, `DELETE /cart/remove-coupon/`, `GET /cart/summary/`
- **Filters**: `category_slug` (includes descendants), `store_slug`, `price_min/max`, `is_featured`, `tags` (JSON contains), `search` (name+description)
- **Ordering**: `-created_at`, `base_price`, `-sold_count`, `-rating_avg`
- **Signals**: Variant `post_save` → updates parent stock; Review `post_save` → recalculates `rating_avg`/`review_count`
- **Category Seeder**: `python manage.py seed_categories` — 175 categories across 8 top-level groups (Electronics, Fashion, Cosmetics, Food, Books, Home, Sports, Campus Services)
- **Stock Safety**: `select_for_update` on cart-add for atomic stock validation; `unit_price_snapshot` frozen at add time.

### Phase 07: Order & Payment Engine
Wallet at `apps/wallet/`, Orders at `apps/orders/`, engine at `core/wallet_engine.py`.
- **7 Models across 2 apps**:
  - `Wallet`: user/seller/platform types, balance computed from transactions, `get_platform_wallet()` singleton, `refresh_balance()`, locked_balance.
  - `WalletTransaction`: IMMUTABLE ledger (save raises PermissionError on update, delete blocked). Balance snapshots, reason tracking, reference linking.
  - `Payment`: Gateway response storage, status tracking (pending→success→failed→reversed).
  - `Order`: Full lifecycle with `VALID_TRANSITIONS` state machine (placed→confirmed→packed→shipped→delivered). Immutable financial snapshots (commission, prices, delivery fee). `transition_status()` method with automatic history creation.
  - `OrderItem`: Immutable price/commission snapshots per item.
  - `OrderStatusHistory`: Full audit trail of every status change.
  - `Invoice`: Auto-generated via Celery task with PDF URL placeholder.
- **Wallet Engine** (`core/wallet_engine.py`):
  - `create_wallet_transaction()`: Atomic with `select_for_update()`, balance snapshot, `InsufficientBalanceError`.
- **Checkout Service** (`apps/orders/services/checkout.py`):
  - 14-step atomic flow: validate cart → lock stock → check stock → calculate totals → get commission rate (with StudentBenefit discount) → debit buyer wallet → create order + items → deduct stock (F-expression) → credit seller + platform wallets → clear cart → create status history → queue async tasks.
- **API Endpoints**:
  - Wallet: `GET /wallet/balance/`, `GET /wallet/transactions/`, `POST /wallet/topup/`
  - Buyer Orders: `POST /orders/checkout/`, `GET /orders/`, `GET /orders/{id}/`, `PATCH /orders/{id}/cancel/`, `GET /orders/{id}/tracking/`
  - Seller Orders: `GET /seller/orders/`, `GET /seller/orders/{id}/`, `PATCH .../confirm/`, `PATCH .../pack/`, `PATCH .../ship/`
  - Admin Orders: `GET /admin/orders/`, `GET /admin/orders/{id}/`, `PATCH /admin/orders/{id}/status/`
- **Celery Tasks**: `generate_invoice_task`, `send_order_confirmation`, `notify_seller_new_order`, `notify_order_status_change`
- **Commission Engine**: `commission_rate` from SellerProfile, minus active `StudentBenefit.discount_percentage`. Stored immutably in `OrderItem.commission_rate_snapshot` and `commission_amount`.

### Phase 08: Refunds, Delivery & Coupons
Three new apps: `apps/refunds/`, `apps/delivery/`, `apps/coupons/`.
- **Refunds** (`apps/refunds/`):
  - `Refund` model: evidence URLs, calculated reversal amounts, 5-step status flow.
  - `process_approved_refund()` atomic service: credits buyer, debits seller + platform wallets.
  - Buyer: `POST /refunds/request/`, `GET /refunds/my-refunds/`, `GET /refunds/{id}/`
  - Admin: pending list, approve, reject, process (atomic wallet reversal).
- **Delivery** (`apps/delivery/`):
  - `DeliveryPartner`, `Delivery`, `DeliveryTrackingEvent` models.
  - Public: `GET /delivery/track/{tracking_code}/`
  - Admin: `POST /admin/delivery/{id}/update-status/` (creates events, transitions order).
- **Coupons** (`apps/coupons/`):
  - `Coupon`: %, fixed, free_delivery types, `validate_for_user()`, F()-expression `increment_usage()`.
  - `CouponUsage`, `FlashSale`, `FlashSaleProduct` models.
  - Seller CRUD for coupons + flash sales.
  - Admin: platform-wide coupons + flash sales.
  - Public: `GET /coupons/validate/`, `GET /flash-sales/active/`, `GET /flash-sales/{id}/`
  - **Celery tasks**: `expire_coupons` (hourly), `end_flash_sales` (5-min with select_for_update).

### Phase 09: Admin Panel & Permissions
New app: `apps/admin_panel/`, plus `HasPermission` added to `core/permissions.py`.
- **Models** (6): `Role`, `Permission`, `RolePermission` (join table), `UserRole` (multi-role), `AdminActionLog` (audit trail with `log()` classmethod), `Notification` (8 types with `create_notification()` classmethod).
- **Permission System**: `HasPermission(codename)` class in `core/permissions.py` — admin role bypasses all; otherwise checks `UserRole → RolePermission → Permission.codename`.
- **Dashboard**: `GET /admin/dashboard/` — 14 aggregate stats (users, sellers, stores, orders today, revenue, pending approvals, refunds, platform wallet).
- **User Management**: `GET /admin/users/` (filter by role/university/status/search), detail, suspend, activate, change-role, assign-role.
- **Role Management**: CRUD roles, add/remove permissions via `RolePermission`.
- **Platform Wallet**: `GET /admin/wallet/platform-balance/`, `GET /admin/wallet/transactions/`.
- **Notifications**: `GET /notifications/` (own), unread-count, mark-read, mark-all-read.
- **Admin Broadcast**: `POST /admin/notifications/broadcast/` → Celery task `broadcast_notification` (batches of 500).
- **Action Logs**: `GET /admin/action-logs/` with module/action filters.
- **Management Command**: `setup_initial_roles` — seeds 19 permissions across 8 modules, creates 4 roles (super_admin, moderator, finance_admin, support) with proper permission assignments.

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

## 4. How to Run Development Tests

The project uses a mix of standard Django tests (for early phases) and comprehensive endpoint scripts (for later phases). Claude Opus should verify tests pass before/after making changes.

**Phase 02 & 03 Tests** (Auth, Roles, Universities, Verifications):
```bash
docker exec campushat_backend python manage.py test apps.authentication
```

**Phase 04 Tests** (Marketplace end-to-end):
```bash
docker exec campushat_backend python test_phase04.py
```

**Phase 05 Tests** (Sellers end-to-end):
```bash
docker exec campushat_backend python test_phase05.py
```

---

## 5. How to Run the Project Local Environment

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
