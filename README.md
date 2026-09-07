# Explainable Graph-Enhanced AML Detection Platform

An AML decision-support platform combining transaction-level ML, account-network graph analysis,
and SHAP-based explainability to help analysts triage and investigate suspicious activity.

**Specification documents** (single source of truth for this build):

- [Product Requirements](./AML_Project_Docs/01_PRD.md)
- [Technical Requirements](./AML_Project_Docs/02_TRD.md)
- [Backend / Database Schema](./AML_Project_Docs/03_Backend_Schema.md)
- [Design Scheme](./AML_Project_Docs/04_Design_Scheme.md)
- [Implementation Plan](./AML_Project_Docs/05_Implementation_Plan.md)
- [Session plan & status](./PLAN.md) — what's built so far and what's deferred

## Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS, deployed to Vercel.
- **Backend:** FastAPI (Python), deployed to Railway/Render.
- **Database & Auth:** Supabase (PostgreSQL + Auth/GoTrue) — the backend never handles passwords
  or issues tokens; it only verifies Supabase-issued JWTs (see TRD §3–4, Schema §1).
- **Migrations:** Alembic.

## Repository layout

```
AML_Project_Docs/   Specification documents (do not move)
frontend/            Next.js app
backend/             FastAPI app
.github/workflows/   CI (lint, type-check, test, build)
```

## Local setup

### 1. Provision Supabase

Create a project at [supabase.com](https://supabase.com), then in the SQL Editor run the migration
SQL in `backend/alembic/versions/` in order (`0001_roles_and_users.py`, `0002_audit_logs.py` — or
run them via Alembic as described below). From **Project Settings → API**, collect:

- Project URL
- `anon` public key
- `service_role` key
- JWT Secret (**Project Settings → API → JWT Settings**)

From **Project Settings → Database**, collect the connection string (use the pooler connection,
SSL required).

### 2. Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_JWT_SECRET, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL
alembic upgrade head    # applies 0001 (roles/users) and 0002 (audit_logs)
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs · Health check: http://localhost:8000/health

Run backend tests/lint:

```bash
pytest
ruff check .
black --check .
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

App: http://localhost:3000 (redirects to `/login`)

Run frontend tests/lint:

```bash
npm test
npm run lint
npm run typecheck
npm run format:check
```

> Node.js 22+ is recommended (`@supabase/supabase-js` warns on Node 20, which is what this
> session's sandbox had available); the app runs fine on 20 but will need bumping eventually.

### 4. Create your first user

Supabase Auth has no public sign-up in this app (invite-only, AML-FR-03). Create the first
Administrator directly in the Supabase Dashboard: **Authentication → Users → Add user**, then set
`app_metadata: { "role_id": 1 }` before — or right after — creation so the `handle_new_user()`
trigger assigns the Administrator role. Once that account exists, use it to invite further users
via `POST /api/v1/users/invite` (or a future Administration UI screen, Sprint 6).

## Pre-commit hooks

```bash
pip install pre-commit   # or: pipx install pre-commit
pre-commit install
```

Runs Ruff/Black on `backend/` and ESLint/Prettier on `frontend/` before each commit.

## CI

`.github/workflows/ci.yml` runs on every push/PR: backend (Ruff, Black, Pytest) and frontend
(ESLint, `tsc --noEmit`, Prettier, Vitest, `next build`) as independent jobs.
