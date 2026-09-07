# PLAN.md — Sprint 0 + Sprint 1

**Scope of this session:** Sprint 0 (Project Setup) and Sprint 1 (Foundation: Auth, UI Shell, Database) only,
per `AML_Project_Docs/05_Implementation_Plan.md`. Nothing from Sprint 2+ (transactions, ML, graph, alerts,
dashboard) is built now.

**AML-FRs covered this session:** AML-FR-01 (authenticate registered users), AML-FR-02 (RBAC), AML-FR-03
(admins manage users and roles).

---

## Architecture note — auth (resolves a doc inconsistency)

The Implementation Plan's Sprint 1 line ("Auth endpoints: register, login, refresh, logout; JWT issuance;
password hashing") conflicts with the TRD (§3, §4.1, §6.3) and Backend Schema (§1, §4, §7), which state as a
hard constraint that **Supabase Auth (GoTrue) owns all credentials, sign-in, and token issuance** — FastAPI
must never hash a password, register a credential, or mint a token; it only **verifies** the Supabase JWT and
enforces RBAC on top of it.

This plan follows the TRD/Schema (per your instruction to read those "carefully" as the contract/schema
source of truth). Practically:

- **Frontend** talks to Supabase Auth directly (`@supabase/ssr`) for sign-in/session/refresh. No custom login
  API on our backend.
- **Backend** never touches passwords. It verifies `Authorization: Bearer <supabase_jwt>` (signature via
  `SUPABASE_JWT_SECRET`, audience `authenticated`, expiry), resolves the caller's role from `public.users`,
  and exposes `require_role(...)` as a FastAPI dependency.
- **Admin user/role management** (AML-FR-03) is real backend surface this sprint: `GET /api/v1/users`,
  `POST /api/v1/users/invite`, `PATCH /api/v1/users/{id}/role`, using the Supabase Admin API
  (`SUPABASE_SERVICE_ROLE_KEY`), Administrator-only, each writing an `audit_logs` row.
- **Sprint 1 QA** substitutes "password hashing / token issuance" tests (not applicable to our backend) with:
  **JWT verification unit tests** (valid, expired, bad signature, wrong audience) and **RBAC deny/allow
  matrix tests** across all three roles.

---

## Repo layout

Single git repo rooted at `/Users/aryankumarsingh/Desktop/Ankush` (will run `git init` there):

```
Ankush/
├── AML_Project_Docs/        (untouched, existing)
├── README.md                 (links docs + how to run both apps)
├── .github/workflows/ci.yml  (lint, type-check, test, build — both apps)
├── .pre-commit-config.yaml
├── frontend/                 (Next.js + TypeScript + Tailwind)
└── backend/                  (FastAPI + SQLAlchemy + Alembic)
```

---

## Sprint 0 — Project Setup

- `git init` at repo root; `.gitignore` (node_modules, `.venv`, `__pycache__`, `.env*`, build artifacts).
- **Backend skeleton:** FastAPI app factory, `pyproject.toml` (Ruff + Black config), `requirements.txt`
  (fastapi, uvicorn, sqlalchemy, asyncpg, alembic, pydantic-settings, python-jose or pyjwt, supabase-py,
  pytest, pytest-asyncio, httpx). Alembic initialized against `DATABASE_URL`.
- **Frontend skeleton:** `create-next-app` (App Router, TypeScript, Tailwind), ESLint + Prettier config,
  `@supabase/ssr` + `@supabase/supabase-js` deps, `vitest` + `@testing-library/react` for unit tests.
- **Pre-commit hooks:** Ruff + Black (backend), ESLint + Prettier (frontend), trailing-whitespace/end-of-file
  basic hooks.
- **GitHub Actions CI skeleton** (`.github/workflows/ci.yml`): two jobs — `backend` (ruff, black --check,
  pytest) and `frontend` (eslint, tsc --noEmit, vitest, next build) — both on push/PR.
- **Root README.md** linking the PRD/TRD/Schema/Design/Plan docs and stating run instructions (filled in
  fully at the end of Sprint 1).
- `.env.example` in both `frontend/` and `backend/` listing required variable **names only** (no values):
  - Frontend: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_BASE_URL`
  - Backend: `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`

No Supabase/Vercel/Railway cloud provisioning is done from here (no CLI access to your accounts) — the docs'
"provision Supabase/Vercel/Render" bullet is left to you; I'll give exact steps + the SQL/migration to run.

---

## Sprint 1 — Foundation: Auth, UI Shell, Database

### Backend
- Alembic migration `0001_roles_and_users`: creates `public.roles` (seeded 3 rows) and `public.users`
  exactly per `03_Backend_Schema.md` §3.1 — including the `handle_new_user()` trigger on `auth.users` and
  `current_user_role()` helper, and the RLS policies for `roles`/`users` from that doc. This is the only
  schema slice needed for Sprint 1; later sprints add the rest via their own migrations (002+).
- SQLAlchemy models for `Role`, `User` mirroring the migration.
- `app/core/security.py`: Supabase JWT verification dependency (`get_current_user`) + `require_role(*roles)`
  dependency factory.
- Endpoints: `GET /api/v1/auth/me`, `GET /api/v1/users` (Admin), `POST /api/v1/users/invite` (Admin, calls
  Supabase Admin API), `PATCH /api/v1/users/{id}/role` (Admin) — each role-change/invite writes an
  `audit_logs` row (table/model added now since Sprint 1 already needs it for these two actions; full audit
  wiring for every module happens in Sprint 6 per the plan).
- Consistent error envelope `{ "error": { "code", "message", "details" } }` and standard status codes per
  TRD §5.

### Frontend
- Tailwind config carrying the Design Scheme §2 tokens verbatim (colors incl. dark-mode pairs, Inter/JetBrains
  Mono type scale, 8px spacing scale, radii, breakpoints).
- Supabase browser/server clients (`@supabase/ssr`) and a session-aware middleware for protected routes.
- Login screen (§4.1): centered card, email+password, inline error state, no role selector.
- App shell (§3): sidebar + topbar, role-aware nav (items filtered by role fetched from `/api/v1/auth/me`),
  theme toggle stub (light/dark via tokens; full theming polish isn't a Sprint 1 deliverable but the tokens
  must be correct now since every later screen depends on them).
- Empty-state Dashboard route (shell only — no KPIs/charts, those are Sprint 6) reachable only when
  authenticated, satisfying the exit criterion "role-appropriate empty-state dashboard shell."
- Unauthorized/unauthenticated redirect behavior for protected routes.

### QA (both repos, CI-gated)
- Backend `pytest`: JWT verification (valid / expired / bad signature / wrong audience), RBAC deny/allow
  matrix (each of the 3 roles × each protected endpoint), `/auth/me` shape, invite/role-update happy path +
  non-admin 403.
- Frontend `vitest`: role-aware nav rendering (per role, correct items shown/hidden), protected-route
  redirect logic.
- CI green on both jobs.

**Exit criteria (matches Implementation Plan):** a user can log in via Supabase Auth, land on a
role-appropriate empty dashboard shell, and is blocked from routes/endpoints their role doesn't permit.

---

## Explicitly deferred (not touched this session)

Everything from Sprint 2 onward: customers/accounts/transactions/ingestion, ML inference, SHAP explanations,
graph engine, alerts/case-notes/feedback, dashboard KPIs, reports, full audit-log UI. Also deferred: actual
Supabase/Vercel/Railway provisioning (you run this), production deployment, Docker (not called for by the
docs' local-dev section — `next dev` / `uvicorn --reload` only).

---

## Status — Sprint 0 + Sprint 1 complete

### Done

**Sprint 0**
- Git repo initialized at `Ankush/` (not yet committed — see note below).
- Backend skeleton: FastAPI app factory, Ruff+Black config (`pyproject.toml`), `requirements.txt`,
  Alembic wired to `DATABASE_URL` with an async engine.
- Frontend skeleton: Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind v4, ESLint +
  Prettier (with `prettier-plugin-tailwindcss`), Vitest + Testing Library.
- `.pre-commit-config.yaml` (Ruff/Black on `backend/`, ESLint/Prettier on `frontend/`).
- `.github/workflows/ci.yml`: two independent jobs — backend (Ruff, Black, Pytest) and frontend
  (ESLint, `tsc --noEmit`, Prettier check, Vitest, `next build`).
- `backend/.env.example`, `frontend/.env.example` — variable names only, no values.
- Root `README.md` linking all five docs plus exact local setup steps.

**Sprint 1 — Backend**
- Migration `0001_roles_and_users`: `public.roles` (seeded) + `public.users`, the
  `handle_new_user()` signup trigger, `current_user_role()` helper, and the roles/users RLS
  policies — matching `03_Backend_Schema.md` §3 exactly.
- Migration `0002_audit_logs`: `public.audit_logs` + its RLS policies, pulled forward from its
  Sprint 6 slot (see architecture note above) because invite/role-change actions need it now.
- **Both migrations verified end-to-end this session** against a real local PostgreSQL 16
  instance with a stubbed `auth.users`/`auth.uid()` (approximating Supabase) — `alembic upgrade
  head` and `alembic downgrade base` both ran clean, and an insert into `auth.users` correctly
  fired the trigger and populated `public.users` with the right role/name.
- Supabase JWT verification (`decode_supabase_jwt`) + `require_role(...)` RBAC dependency.
- Endpoints: `GET /api/v1/auth/me`, `GET /api/v1/users`, `POST /api/v1/users/invite`,
  `PATCH /api/v1/users/{id}/role` (all Admin-only except `/auth/me`), each mutating one
  audit-logging the action.
- Shared error envelope (`{"error": {code, message, details}}`) via a global exception handler.
- 21 backend tests (pytest): JWT valid/expired/bad-signature/wrong-audience, the RBAC deny/allow
  matrix across role combinations, `/auth/me` shape + missing-token 401, and the three admin
  endpoints' allow/deny/404 paths. Ruff + Black clean.

**Sprint 1 — Frontend**
- Tailwind v4 tokens in `globals.css` matching Design Scheme §2 exactly: full light/dark color
  set (incl. risk/status colors), Inter + JetBrains Mono via `next/font/google`, the `text-display
  / h2 / h3 / body / caption / label` type scale, and the 10px card radius token (6px/12px already
  match Tailwind's defaults).
- Supabase browser/server clients (`@supabase/ssr`) and `proxy.ts` (Next.js 16's renamed
  `middleware.ts`) refreshing the session cookie on every request.
- Login screen (§4.1: centered card, inline error under the password field, no role selector) plus
  a forgot-password screen (Supabase-delegated reset email).
- `(app)/layout.tsx`: the protected-route wrapper — verifies the session server-side via
  `getUser()`, fetches the caller's role from `/api/v1/auth/me`, redirects to `/login` if
  unauthenticated, shows an inline (non-toast) error if the API is unreachable.
- App shell: `Sidebar` (role-filtered nav per §3's IA — items without a built screen yet render
  disabled, not as dead links), `Topbar` (role/name, working theme toggle, sign-out), empty-state
  `/dashboard`.
- 9 frontend tests (Vitest + Testing Library): nav role-visibility matrix, Sidebar rendering per
  role, LoginForm's inline-error and success-redirect paths, and the protected-layout's
  redirect/render logic. ESLint, `tsc --noEmit`, and Prettier all clean; `next build` succeeds.

### Deliberately deferred (not in this session's scope)
- Everything from Sprint 2 onward (transactions/ingestion, ML inference, SHAP, graph engine,
  alerts/case-notes/feedback, dashboard KPIs, reports, Administration screens) — including the
  Topbar's global-search and notifications affordances from the Design Scheme, which need data
  those sprints introduce.
- Actual Supabase/Vercel/Railway project provisioning, and applying the migrations to that real
  project (this session verified them against a local stand-in Postgres instead — see below).
- The initial commit — the repo is initialized and everything above is staged-ready, but nothing
  has been committed yet; say the word and I'll make the first commit.

## How to run it locally

Full steps (including Supabase provisioning) are in [`README.md`](./README.md). Short version once
Supabase env vars are filled in:

```bash
# Backend
cd backend && python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_JWT_SECRET, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL
alembic upgrade head
uvicorn app.main:app --reload   # http://localhost:8000/docs

# Frontend (separate terminal)
cd frontend && npm install
cp .env.example .env.local   # fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev   # http://localhost:3000
```

Create your first Administrator directly in the Supabase Dashboard (Authentication → Users →
Add user, with `app_metadata: {"role_id": 1}`) — there's no public sign-up, per AML-FR-03.
