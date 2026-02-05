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