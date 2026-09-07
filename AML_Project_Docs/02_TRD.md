# Technical Requirements Document (TRD)

**Product:** Explainable Graph-Enhanced ML Framework for Adaptive AML Detection
**Version:** 1.0 | **Date:** 2 September 2026
**Related documents:** [PRD](./01_PRD.md) · [Backend Schema](./03_Backend_Schema.md) · [Design Scheme](./04_Design_Scheme.md) · [Implementation Plan](./05_Implementation_Plan.md)

---

## 1. Architecture Overview

```
┌──────────────────────┐      Supabase Auth SDK     ┌───────────────────────────┐
│  Next.js + TypeScript │ ─────────────────────────▶ │  Supabase Auth (GoTrue)   │
│  Frontend (Vercel)    │ ◀───────────────────────── │  (Login, MFA, JWT tokens) │
└──────────┬───────────┘    Session & Supabase JWT   └─────────────┬─────────────┘
           │                                                       │
           │ HTTPS / REST (Bearer Supabase JWT)                    │
           ▼                                                       │
┌────────────────────────────────────────┐                         │
│ FastAPI (Python) Backend API           │                         │
│ (Render / Railway)                     │                         │
│                                        │                         │
│  ┌──────────────────────────────────┐  │                         │
│  │ Supabase JWT Verification & RBAC │  │                         │
│  ├──────────────────────────────────┤  │                         │
│  │ Transaction service              │  │                         │
│  ├──────────────────────────────────┤  │                         │
│  │ ML inference                     │──┼──▶ scikit-learn / XGBoost model
│  ├──────────────────────────────────┤  │                         │
│  │ SHAP explainer                   │──┼──▶ SHAP engine          │
│  ├──────────────────────────────────┤  │                         │
│  │ Graph engine                     │──┼──▶ NetworkX             │
│  ├──────────────────────────────────┤  │                         │
│  │ Alerting/reporting               │  │                         │
│  └──────────────────────────────────┘  │                         │
└──────────────────┬─────────────────────┘                         │
                   │ SQL (AsyncPG / SQLAlchemy)                    │
                   ▼                                               │
┌──────────────────────────────────────────────────────────────────▼────┐
│ Supabase PostgreSQL (Managed DB & Security)                           │
│ - auth.users (Supabase-managed auth & credentials)                    │
│ - public.user_profiles / roles (Application RBAC mapping)             │
│ - transactions, accounts, customers, predictions, explanations, alerts│
│ - Row-Level Security (RLS) policies aligned with Supabase Auth context│
└───────────────────────────────────────────────────────────────────────┘
```

High-level flow (from SRS Appendix B.1, adapted for Supabase Auth):
`Administrator / Data Operator / AML Analyst → Supabase Auth (Sign-in / Session & Token) → Next.js Web App → FastAPI Services (Supabase JWT Verification & RBAC) → ML Model + Graph Engine + SHAP Engine → Supabase PostgreSQL → Alerts, Risk Profiles, Investigations, Feedback, Reports.`

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, React, Tailwind CSS |
| Frontend hosting | Vercel |
| Backend API | Python, FastAPI |
| Backend hosting | railway |
| Database | Supabase (managed PostgreSQL) |
| ML | scikit-learn / XGBoost |
| Explainability | SHAP (SHapley Additive exPlanations) |
| Graph analysis | NetworkX |
| Auth | Supabase Auth (GoTrue) — Managed email/password & OAuth, Supabase JWTs, session handling, RBAC via app_metadata/profiles |
| Transport | HTTPS, JSON over REST |

## 3. Design & Implementation Constraints

- Frontend, API, ML, graph, and persistence layers **must remain modularly separated** (no tight coupling — enables independent iteration per Agile sprint).
- **Authentication & Identity management is strictly outsourced to Supabase Auth** (`auth.users`, GoTrue engine); the FastAPI backend does NOT store password hashes, register credentials, or issue authentication tokens.
- Real labeled AML data may be restricted → public/synthetic data pipelines must be swappable.
- All sensitive traffic over HTTPS.
- Predictions are decision-support only; the API must never expose an "auto-action" endpoint that blocks/flags a customer without a human-review step.
- Academic/cloud resource limits bound scale — architecture should favor low-cost managed services (Supabase free/low tier, Vercel, Render/Railway) with clear upgrade path.

## 4. System Modules

### 4.1 Auth & Authorization Service (Supabase Auth Only)
- **Delegated Authentication:** All user sign-in, password reset, session refresh, and credential storage are handled exclusively by **Supabase Auth** (`auth.users` / GoTrue engine) via client-side SDK (`@supabase/ssr` or `@supabase/supabase-js`). The FastAPI backend maintains zero password hashes and has no custom login endpoints.
- **FastAPI Supabase JWT Verification:** FastAPI acts as a secure OAuth2/JWT resource server. Every incoming request must provide an `Authorization: Bearer <supabase_jwt>` header. FastAPI middleware verifies the token signature (using `SUPABASE_JWT_SECRET` or Supabase JWKS endpoint), audience (`authenticated`), and expiration.
- **Role-Based Access Control (RBAC):** Roles (`Administrator`, `AML Analyst`, `Authorized Data Operator`) are maintained in Supabase `app_metadata` or synced to a `public.user_profiles` table, embedded in the JWT claims, and enforced via FastAPI dependency injection (e.g., `Depends(require_role("Administrator"))`) on all protected routes.
- **User Management & Administration:** User invitations, role assignments, and account deactivations are administered via the Supabase Auth Admin API (invoked by backend using `SUPABASE_SERVICE_ROLE_KEY` or through the Supabase Studio dashboard).

### 4.2 Transaction Ingestion Service
- CSV upload endpoint (multipart) + authorized API ingestion endpoint.
- Row-level validation (identifiers, amount > 0, ISO timestamp, required fields present).
- Returns per-row ingestion report (accepted / rejected + reason).
- Supports server-side search, sort, filter, pagination on `GET /transactions`.

### 4.3 ML Inference Service
- Loads a versioned, serialized model (e.g., `joblib`/`pickle` artifact tagged with `model_version`).
- `POST /predict` (internal, triggered on ingestion or on demand) → returns `risk_probability` (0–1).
- Maps probability → configurable categorical band (Low / Medium / High) via an admin-configurable threshold table.
- Persists `model_version` + `predicted_at` timestamp with every prediction (immutable audit trail).
- Evaluation harness reports precision, recall, F1, PR-AUC, ROC-AUC, FPR, FNR per model version.

### 4.4 Graph Engine
- Builds a directed multigraph per run/window: nodes = accounts, edges = transactions (weighted by amount/time).
- Computes indicators: in/out-degree, transaction velocity, fan-in/fan-out ratio, cycle detection (e.g., `networkx.simple_cycles` bounded by depth), neighborhood-risk aggregate (mean/max risk of k-hop neighbors).
- Exposes a filtered subgraph payload (nodes+edges+indicators) for the frontend visualization (e.g., via `react-flow`, `vis-network`, or `d3` on the client — see Design Scheme).
- Depth/size-capped for performance; heavy computations can run as background jobs.

### 4.5 Explainability (XAI) Service
- Runs SHAP (`TreeExplainer` for tree-based models) against the ML model per prediction.
- Extracts top-N contributing features (positive/negative) with magnitudes.
- Templated natural-language generator turns top SHAP features into a readable sentence (e.g., "Flagged mainly due to: unusually large transfer amount (+0.31), new counterparty relationship (+0.18), part of a 4-node transaction cycle (+0.12).").
- Explanation payload persisted alongside the prediction for audit (immutable).

### 4.6 Risk Scoring & Alerting Service
- Combines ML probability + graph neighborhood-risk into a unified customer/transaction risk score (documented, versioned formula — e.g., weighted sum, tunable weights stored in config).
- Alert generation: configurable threshold rules create `alert` records referencing the triggering transaction(s)/customer.
- Customer risk profile recalculated on: new high-risk transaction, new alert outcome, or scheduled recompute.

### 4.7 Investigation Workflow Service
- CRUD for alerts: assign to analyst, add case notes/comments, change status (Open / In Progress / Closed).
- Outcome labeling: `confirmed_suspicious`, `false_positive`, `further_investigation`.
- Feedback captured in a dedicated table for later **governed** (human-initiated) model review — never auto-retrain.

### 4.8 Dashboard & Reporting Service
- Aggregation endpoints for: transaction volume over time, alert counts by status/risk band, risk distribution histogram, trend lines.
- Date-range report generation (PDF/CSV export) restricted to authorized roles.

## 5. API Design Principles

- RESTful resource-oriented endpoints under `/api/v1/...`.
- JSON request/response bodies; consistent error envelope `{ "error": { "code", "message", "details" } }`.
- Standard HTTP status codes (200/201/400/401/403/404/409/422/500).
- All list endpoints support `?search=&sort=&page=&page_size=&filter[...]=`.
- Every mutating endpoint validates payload via Pydantic schemas before touching the DB.
- Auth via `Authorization: Bearer <supabase_jwt>` header; FastAPI validates Supabase signature and claims before executing business logic; unauthorized (401) or forbidden (403) requests rejected before business logic runs.

### 5.1 Representative Endpoints

| Method | Path | Purpose | Roles |
|---|---|---|---|
| *Client SDK* | *Supabase Auth API* | Sign in / refresh session (handled by `@supabase/ssr` or `@supabase/supabase-js`) | All |
| GET | `/api/v1/auth/me` | Retrieve authenticated user profile & claims from verified Supabase JWT | All authenticated |
| GET | `/api/v1/users` | List users & assigned roles (queries profiles / Supabase Admin) | Administrator |
| POST | `/api/v1/users/invite` | Invite new user with role assignment via Supabase Auth Admin API | Administrator |
| PATCH | `/api/v1/users/{id}/role` | Update user role in Supabase `app_metadata` / profiles | Administrator |
| POST | `/api/v1/transactions/import` | CSV/API ingestion | Data Operator, Admin |
| GET | `/api/v1/transactions` | Search/filter/paginate | Analyst, Admin, Data Operator |
| GET | `/api/v1/transactions/{id}/prediction` | Risk score + category | Analyst, Admin |
| GET | `/api/v1/transactions/{id}/explanation` | SHAP-based explanation | Analyst, Admin |
| GET | `/api/v1/graph/accounts/{account_id}` | Filtered network subgraph | Analyst, Admin |
| GET | `/api/v1/customers/{id}/risk-profile` | Current + historical risk | Analyst, Admin |
| GET/POST | `/api/v1/alerts` | List/create alerts | Analyst, Admin |
| PATCH | `/api/v1/alerts/{id}` | Assign/comment/update/close | Analyst |
| GET | `/api/v1/dashboard/summary` | KPIs, distributions, trends | All authenticated |
| GET | `/api/v1/reports?from=&to=` | Date-range report | Analyst, Admin |
| GET | `/api/v1/audit-logs` | Audit trail | Administrator |

## 6. Non-Functional Requirements

### 6.1 Performance
- Single prediction (ML + graph lookup): **< 2s** under normal load.
- Common dashboard views: **< 3s** on prototype-scale data.
- Batch ingestion: progress indicator + completion status (poll or WebSocket/SSE).
- Model evaluation reports precision, recall, F1, PR-AUC, ROC-AUC, FPR, FNR per version.

### 6.2 Safety
- No automatic accusation/blocking/penalization from ML output alone.
- High-risk results require authorized human review before any downstream action.
- Destructive actions (delete user, delete case) require explicit confirmation step.
- Ingestion/processing failures must not silently corrupt source data (transactional writes, rollback on partial failure).

### 6.3 Security
- **Supabase-Managed Credentials:** Passwords and authentication credentials are managed exclusively by Supabase Auth (`auth.users`). Passwords are never received, stored, or hashed by the FastAPI backend; all credential hashing and security policies are isolated in Supabase's managed auth engine.
- **Supabase Token Security:** HTTPS end-to-end; short-lived Supabase JWT access tokens passed via `Authorization: Bearer <supabase_jwt>`; automatic token refresh handled client-side by Supabase SDK.
- **Backend Token Validation:** FastAPI cryptographically verifies Supabase JWT signatures, expiration, and audience (`authenticated`) on every protected request using `SUPABASE_JWT_SECRET` or Supabase JWKS.
- **Dual-Layer RBAC & RLS:** Least-privilege RBAC enforced server-side via FastAPI role dependencies (`require_role(...)`), complemented by Supabase PostgreSQL Row-Level Security (RLS) policies utilizing Supabase Auth context (`auth.uid()`, `auth.jwt()`).
- **Secrets Management:** Secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, model paths) managed via environment variables / secret manager — never committed to git.
- **Audit Logging:** Material actions (login events via Supabase Auth webhooks, role changes, alert outcomes, data exports, config changes) written to `audit_logs`.
- **OWASP Top 10 Mitigation:** Injection (parameterized queries via SQLAlchemy/asyncpg), broken auth (mitigated via Supabase managed auth), XSS (React auto-escaping + CSP headers), CSRF (token-based auth / SameSite cookies), broken access control (strict server-side RBAC + DB RLS), security misconfiguration.

### 6.4 Software Quality Attributes
- **Availability:** target 99% during scheduled testing windows.
- **Reliability:** recoverable errors, no silent data loss; retries/backoff for transient DB/model errors.
- **Usability:** consistent navigation, plain-language explanations (see Design Scheme).
- **Maintainability:** modular services, documented OpenAPI (auto-generated by FastAPI), versioned ML models, automated tests per module.
- **Scalability:** stateless API pods behind a load balancer → horizontal scaling; heavy graph/ML jobs offloadable to background workers (e.g., Celery/RQ or async task queue) if load grows.
- **Testability:** every functional requirement (AML-FR-01…25) traceable to at least one automated test case (unit/integration/E2E).

## 7. External Interfaces

- **Next.js client ↔ Supabase Auth:** Direct HTTPS communication via `@supabase/ssr` / `@supabase/supabase-js` for sign-in, MFA, session management, and JWT token retrieval.
- **Next.js client ↔ FastAPI:** REST over HTTPS, JSON payloads, authenticated via `Authorization: Bearer <supabase_jwt>`.
- **FastAPI ↔ Supabase Auth:** In-process JWT signature & claims verification (`SUPABASE_JWT_SECRET` / JWKS); administrative user/role operations via Supabase Python SDK using `SUPABASE_SERVICE_ROLE_KEY`.
- **FastAPI ↔ Supabase PostgreSQL:** SQLAlchemy/asyncpg connection pool, SSL enforced.
- **FastAPI ↔ ML model:** in-process model load (versioned artifact) or a dedicated inference module; model artifact stored alongside metadata table.
- **ML output ↔ SHAP engine:** synchronous call per prediction (or cached per transaction to avoid recompute).
- **Transaction data ↔ NetworkX graph engine:** in-memory graph construction per request/window, optionally cached (e.g., Redis or in-process TTL cache) for frequently viewed accounts.

## 8. Environments & Deployment

| Environment | Frontend | Backend | DB & Auth |
|---|---|---|---|
| Local dev | `next dev` | `uvicorn` (reload) | Supabase Local CLI (`supabase start`) or Dev project |
| Staging | Vercel preview | Render/Railway staging service | Supabase staging project (Auth + PostgreSQL) |
| Production (prototype) | Vercel production | Render/Railway production service | Supabase production project (Auth + PostgreSQL) |

**Key Configuration / Environment Variables:**
- **Frontend:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_BASE_URL`
- **Backend:** `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (SSL mode required)

CI/CD: GitHub Actions (lint, type-check, unit tests, build) → auto-deploy frontend to Vercel on merge to `main`; backend deployed via Render/Railway build hook. Database migrations via Alembic or Supabase CLI migrations (versioned, reviewed before apply).

## 9. Traceability Matrix (excerpt)

| Requirement | Module | Test type |
|---|---|---|
| AML-FR-01–03 | Auth & Authorization Service (Supabase Auth) | Unit (FastAPI Supabase JWT validator & RBAC dependencies) + integration (Supabase Auth test tokens, role access matrix) |
| AML-FR-04–06 | Transaction Ingestion Service | Unit (validators) + integration (upload E2E) |
| AML-FR-07–09 | ML Inference Service | Unit (mapping logic) + model eval harness |
| AML-FR-10–12 | Graph Engine | Unit (indicator calc) + visual regression |
| AML-FR-13–15 | Explainability Service | Unit (SHAP output shape) + snapshot tests |
| AML-FR-16–18 | Risk Profiling Service | Unit + scheduled-job integration test |
| AML-FR-19–22 | Investigation Workflow | Integration (state machine) + E2E |
| AML-FR-23–25 | Dashboard & Reporting | Integration (aggregation correctness) + E2E |

## 10. Constraints Carried Forward from SRS

- Academic timeline and free/low-cost cloud tiers bound dataset size and concurrency assumptions.
- Model artifacts and preprocessing pipeline versions must stay in lockstep (breaking preprocessing changes require a new `model_version`).
- TBD items (dataset choice, final thresholds, retention period, deployment provider, GNN inclusion) tracked in the PRD and revisited each sprint review.
