# CampusHat Git Workflow Guideline

This document defines how our team will use Git and GitHub to keep the project clean, professional, and organized.

---

## 🌿 Branch Structure

We use the following main branches:

| Branch | Purpose |
|--------|---------|
| main | Production-ready stable code (Only Project Leader can merge here) |
| develop | Integration branch where features are merged first |
| frontend | Frontend related base work |
| backend | Backend related base work |

---

## 🚀 Rule #1 — Never work directly on main

No one is allowed to push or commit directly to `main`.

All work must go through feature branches and Pull Requests.

---

## 🧑‍💻 Creating a New Branch for Work

For every new task/feature/bugfix, create a new branch from `develop`.

### Branch Naming Rule:
feature/feature-name
bugfix/bug-name
ui/page-name
api/endpoint-name

### Example:
feature/login-system
ui/homepage-design
api/user-auth
bugfix/navbar-error
---

## 🔄 Workflow Step-by-Step

### Step 1 — Pull latest develop
git checkout develop
git pull origin develop

### Step 2 — Create new branch
git checkout -b feature/your-feature-name

### Step 3 — Do your work and commit
git add .
git commit -m "Add: login form validation"

### Step 4 — Push branch
git push origin feature/your-feature-name

### Step 5 — Create Pull Request (PR)
PR will be from:
feature/your-feature-name → develop

---

## 🔍 Pull Request Rules

- Describe what you did
- Add screenshots if UI related
- Keep PR small and focused

---

## 🧠 After PR is Approved

Project Leader will merge `develop → main` when ready.

---

## ❌ What is NOT Allowed

- No direct commit to `main`
- No direct commit to `develop`
- No random branch names
- No large mixed commits

---

## ✅ Commit Message Format
Add: new feature
Fix: bug description
Update: improvement
Remove: delete something
Refactor: code improvement

Example:
Add: user registration API
Fix: navbar responsive issue

---

## 🏁 Final Flow Diagram

Developer Work:

feature branch → develop → main

Only Project Leader merges to `main`.
