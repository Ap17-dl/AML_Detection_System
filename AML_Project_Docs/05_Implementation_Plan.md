# Implementation Plan

**Product:** Explainable Graph-Enhanced ML Framework for Adaptive AML Detection
**Process Model:** Agile (Scrum-style, 6 sprints) — selected per SDLC study document
**Version:** 1.0 | **Date:** 2 September 2026
**Related documents:** [PRD](./01_PRD.md) · [TRD](./02_TRD.md) · [Backend Schema](./03_Backend_Schema.md) · [Design Scheme](./04_Design_Scheme.md)

---

## 1. Methodology

Agile was selected (see the source SDLC study) because the system needs continuous ML experimentation, threshold tuning, and analyst feedback loops that a linear model (Waterfall/V-Model) cannot absorb without expensive rework. Each sprint below ends with a demoable increment, a retro, and an updated backlog/TBD list.

- **Sprint length:** 2 weeks (adjust to academic calendar as needed).
- **Ceremonies:** Sprint planning (day 1), daily standup, sprint review/demo (last day), retro (last day).
- **Definition of Done (per increment):** code merged to `main`, migrations applied, unit + integration tests passing in CI, feature demoable in staging, relevant AML-FRs marked covered in the traceability matrix (TRD §9).

## 2. Team Roles (map to a small academic/prototype team; consolidate as needed)

| Role | Responsibility |
|---|---|
| Product/Project lead | Backlog, sprint planning, stakeholder (faculty) demos |
| Frontend engineer | Next.js/TypeScript UI, design-system implementation |
| Backend engineer | FastAPI services, auth, DB schema/migrations |
| ML engineer | Model training/evaluation, SHAP integration |
| Graph/Data engineer | NetworkX graph engine, ingestion pipeline |
| QA / Test owner | Test plans, traceability matrix upkeep, CI gates |

*(On a solo/academic project, one person rotates through these hats per sprint — the sprint breakdown below is written so each sprint has a dominant discipline.)*

## 3. Sprint-by-Sprint Plan

### Sprint 0 — Project Setup *(pre-sprint, ~2–3 days)*
- Initialize monorepo or two repos (`frontend/`, `backend/`).
- Provision: Supabase project, Vercel project, Render/Railway service, GitHub Actions CI skeleton.
- Establish coding standards: ESLint/Prettier (frontend), Black/Ruff (backend), pre-commit hooks.
- Create `AML_Project_Docs` equivalent in-repo (`/docs`) linking this PRD/TRD/Schema/Design/Plan for the team.

### Sprint 1 — Foundation: Auth, UI Shell, Database *(Deliverable: "Login system and initial database")*
**Backend**
- Implement `roles`, `users` tables + Alembic migration 001.
- Auth endpoints: register (admin-invite only), login, refresh, logout; JWT issuance; password hashing.
- RBAC middleware skeleton.

**Frontend**
- Next.js project scaffold, design-token setup (Tailwind config from Design Scheme §2), app shell (sidebar/topbar/nav from §3).
- Login screen (§4.1), protected route wrapper, role-aware nav rendering.

**QA**
- Unit tests: password hashing, token issuance/validation, RBAC middleware (deny/allow matrix).
- CI pipeline green (lint, type-check, test, build) on both repos.

**Exit criteria:** A user can log in, see a role-appropriate empty-state dashboard shell, and be blocked from unauthorized routes. Covers AML-FR-01, 02, 03.

---

### Sprint 2 — Customer & Transaction Management *(Deliverable: "Transaction monitoring module")*
**Backend**
- `customers`, `accounts`, `transactions`, `ingestion_batches` tables + migration 002.
- CSV import endpoint with row-level validation (AML-FR-04, 05); ingestion report response shape.
- Transaction list endpoint: search/sort/filter/pagination (AML-FR-06).

**Frontend**
- Transaction Monitor screen (§4.3): table, filters, CSV import flow with progress + error report.
- Customer list + basic profile shell (data only, no risk yet).

**QA**
- Validation unit tests (bad amount, missing field, bad timestamp).
- E2E: upload a sample CSV → verify accepted/rejected counts match fixture.

**Exit criteria:** Analysts/Data Operators can import and browse transactions with working search/filter. Covers AML-FR-04, 05, 06.

---

### Sprint 3 — ML Pre-processing, Training, Evaluation, Inference API *(Deliverable: "Suspicious-transaction prediction")*
**ML**
- Feature engineering pipeline (amount stats, counterparty history, time-of-day, etc.) on chosen public/synthetic dataset (resolve TBD-1).
- Train baseline model (scikit-learn/XGBoost); evaluate with precision, recall, F1, PR-AUC, ROC-AUC, FPR, FNR.
- Serialize model artifact + register in `model_metadata` (migration 003 adds `model_metadata`, `predictions`).

**Backend**
- Inference service: `POST` (internal) prediction on ingestion, `GET /transactions/{id}/prediction`.
- Threshold-based probability→category mapping (AML-FR-08), configurable via `model_metadata`.

**Frontend**
- Risk badge (`RiskBadge`) wired into Transaction Monitor table and detail drawer.

**QA**
- Model eval harness runs in CI (or as a scheduled job) reporting metrics; smoke test on inference endpoint latency (< 2s target).

**Exit criteria:** Every ingested transaction gets a stored risk probability + category + model version. Covers AML-FR-07, 08, 09.

---

### Sprint 4 — Explainability (SHAP) & Dynamic Customer-Risk Profiles *(Deliverable: "Explainable risk-analysis module")*
**ML/Backend**
- SHAP `TreeExplainer` integration; top-N feature extraction; narrative-text generator.
- `explanations` table (migration 004) + `GET /transactions/{id}/explanation`.
- `customer_risk_history` table; risk recompute job triggered on new high-risk transaction / scheduled cadence (AML-FR-18).

**Frontend**
- `ExplanationPanel` component (§5) integrated into transaction/alert detail views.
- Customer Risk Profile screen (§4.6): current badge, history sparkline/line chart.

**QA**
- Snapshot tests on explanation payload shape; regression test that explanations persist immutably once generated (audit requirement, AML-FR-15).

**Exit criteria:** High-risk transactions show a plain-language explanation; customer profiles show current + historical risk. Covers AML-FR-13, 14, 15, 16, 17, 18.

---

### Sprint 5 — Graph Feature Extraction & Network Visualization *(Deliverable: "Graph-based AML analysis")*
**Graph engineering**
- NetworkX graph construction from `transactions` (accounts as nodes, directed weighted edges).
- Compute indicators: degree, velocity, fan-in/fan-out, cycle detection (depth-bounded), neighborhood-risk score.
- `graph_indicators` table (migration 005) + `GET /graph/accounts/{account_id}` filtered-subgraph endpoint.
- Fuse graph neighborhood-risk into `predictions.combined_risk_score`.

**Frontend**
- Network Explorer screen (§4.7): force-directed graph rendering, filter panel, cycle highlighting, node-click side panel.
- Performance guardrails: node/edge caps with a truncation banner.

**QA**
- Unit tests on indicator calculations against small fixture graphs (known cycle, known fan-out) to verify correctness.
- Manual/perf test on graph render with a moderately sized synthetic dataset.

**Exit criteria:** Analysts can visually explore an account's network and see cycle/fan-out indicators tied into the combined risk score. Covers AML-FR-10, 11, 12.

---

### Sprint 6 — Investigation Workflow, Feedback, Dashboard, Reports, Testing & Deployment *(Deliverable: "Complete AML platform")*
**Backend**
- `alerts`, `case_notes`, `analyst_feedback`, `audit_logs` tables + migration 006.
- Alert generation from configurable thresholds (AML-FR-19); assign/comment/update endpoints (AML-FR-20); outcome labeling (AML-FR-21); feedback capture with `reviewed_for_retraining` governance gate (AML-FR-22).
- Dashboard aggregation endpoints (AML-FR-23), date-range report generation + export (AML-FR-24, 25).
- Audit logging wired into all material actions (login, role change, alert outcome, threshold change, export).

**Frontend**
- Alert Queue (§4.4) and Alert Detail/Case Review (§4.5) screens, including the mandatory outcome-confirmation flow.
- Dashboard (§4.2), Reports (§4.8), and Administration screens (§4.9: Users & Roles, Model & Thresholds, Audit Log).

**QA / Release**
- Full regression pass against the traceability matrix (TRD §9) — every AML-FR-01…25 mapped to a passing test.
- End-to-end scenario test: ingest → predict → explain → alert → investigate → outcome → dashboard reflects it.
- Security pass: HTTPS enforced, RBAC matrix re-verified, secrets audited, dependency vulnerability scan.
- Deploy: frontend → Vercel production, backend → Render/Railway production, run production migrations, seed roles + bootstrap admin.
- Final demo + documentation handoff (user guides per SRS §2.6: quick-start, upload-schema guide, analyst guide, admin guide).

**Exit criteria:** Complete platform deployed and demoable end-to-end. Covers AML-FR-19–25 plus final hardening of all prior sprints.

## 4. Cross-Sprint Testing Strategy

| Test level | Tooling (suggested) | When |
|---|---|---|
| Unit | `pytest` (backend), `vitest`/`jest` (frontend) | Every sprint, every PR |
| Integration | `pytest` + test DB (Supabase local/dev), API contract tests | Every sprint for that sprint's new endpoints |
| E2E | Playwright/Cypress | Sprints 2, 4, 5, 6 (key user journeys) |
| Model evaluation | Custom harness (precision/recall/F1/PR-AUC/ROC-AUC/FPR/FNR) | Sprint 3 onward, re-run on every model change |
| Security | Manual checklist + dependency scanner (e.g., `pip-audit`, `npm audit`) | Sprint 6, and spot-checked earlier |
| Accessibility | axe-core automated pass + manual keyboard nav check | Sprint 6 (or incrementally per screen) |

## 5. Risk & Contingency per Sprint

| Sprint | Key risk | Contingency |
|---|---|---|
| 1 | Auth/RBAC misconfiguration blocking later sprints | Freeze RBAC contract early; write the deny/allow matrix test first |
| 2 | Real-world CSV messiness underestimated | Build validation against a deliberately messy fixture file, not just clean data |
| 3 | No suitable labeled/synthetic dataset (TBD-1) | Time-box dataset search to 2 days; fall back to a known public synthetic AML dataset |
| 4 | SHAP compute cost too high for < 2s target | Cache explanations per prediction; consider `TreeExplainer` (fast for tree models) over model-agnostic explainers |
| 5 | Graph rendering slow/unreadable at scale | Depth/node caps, server-side pre-aggregation, truncation UI (already designed in §4.7 of Design Scheme) |
| 6 | Feature creep in investigation workflow | Timebox to the exact AML-FR-19–22 scope; defer extras to a backlog/TBD |

## 6. Milestone Summary Table

| Sprint | Milestone | Primary AML-FRs |
|---|---|---|
| 1 | Login system and initial database | 01, 02, 03 |
| 2 | Transaction monitoring module | 04, 05, 06 |
| 3 | Suspicious-transaction prediction | 07, 08, 09 |
| 4 | Explainable risk-analysis module | 13, 14, 15, 16, 17, 18 |
| 5 | Graph-based AML analysis | 10, 11, 12 |
| 6 | Complete AML platform | 19, 20, 21, 22, 23, 24, 25 |

## 7. Post-v1.0 Backlog (from SRS Appendix C, carried forward)

- **TBD-1:** Finalize public/synthetic AML dataset.
- **TBD-2:** Finalize risk thresholds after validation (currently defaulted in `model_metadata`).
- **TBD-3:** Define data-retention period.
- **TBD-4:** Finalize deployment provider/resource limits beyond prototype scale.
- **TBD-5:** Evaluate a Graph Neural Network to extend/replace the NetworkX baseline.
