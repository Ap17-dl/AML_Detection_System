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

Create a project at [supabase.com](https://supabase.com), then apply migrations via Alembic:
`0001_roles_and_users.py` through `0007_alerts_cases_feedback.py`.

From **Project Settings → API**, collect:
- Project URL (`SUPABASE_URL`)
- `anon` public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `service_role` key (`SUPABASE_SERVICE_ROLE_KEY`)
- JWT Secret (`SUPABASE_JWT_SECRET`)

From **Project Settings → Database**, collect the connection string (`DATABASE_URL`).

### 2. Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_JWT_SECRET, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL
alembic upgrade head    # applies migrations 0001 through 0007
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs · Health check: http://localhost:8000/health

Run backend tests/lint:

```bash
pytest -c pyproject.toml app/tests
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

Run frontend tests/lint/build:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

### 4. Create your first user & sample datasets

1. Supabase Auth is invite-only (AML-FR-03). Create the first Administrator in Supabase Dashboard: **Authentication → Users → Add user**, with `app_metadata: { "role_id": 1 }`.
2. Once signed in, explore the built screens:
   - **/dashboard**: Real-time triage KPIs, risk distribution donut, open alerts feed.
   - **/transactions**: Search, filter by date/channel/risk, sort, view drawer details.
   - **/transactions/import**: Drag-and-drop CSV importer with error reporting. Sample files are provided in [`sample_data/`](./sample_data):
     - `sample_data/transactions_standard_batch.csv`: 60 valid transactions.
     - `sample_data/transactions_aml_suspicious.csv`: Structuring, circular flows, night wires, rapid movement.
     - `sample_data/transactions_validation_errors.csv`: Edge cases for ingestion error reporting validation.
   - **/alerts & /alerts/[id]**: Analyst investigation case manager with SHAP feature importance, disposition notes, and feedback.
   - **/customers & /customers/[id]**: Customer risk scoring with trend chart history and recalculation.
   - **/network**: Interactive 2D force-directed transactional funds-flow graph with cycle detection.
   - **/reports**: Regulatory metrics and transaction/alert CSV export center.
   - **/admin**: User management, ML model registry, and immutable audit logs.

## Pre-commit hooks

```bash
pip install pre-commit
pre-commit install
```

Runs Ruff/Black on `backend/` and ESLint/Prettier on `frontend/` before each commit.

## CI

`.github/workflows/ci.yml` runs on every push/PR: backend (Ruff, Black, Pytest) and frontend
(ESLint, `tsc --noEmit`, Prettier, Vitest, `next build`) as independent jobs.

