# Product Requirements Document (PRD)

**Product:** An Explainable Graph-Enhanced Machine Learning Framework for Adaptive Anti-Money Laundering Detection
**Author:** Ankush Pratham (24BCE1937) — Document generated from SDLC/SRS source
**Version:** 1.0
**Date:** 2 September 2026
**Related documents:** [TRD](./02_TRD.md) · [Backend Schema](./03_Backend_Schema.md) · [Design Scheme](./04_Design_Scheme.md) · [Implementation Plan](./05_Implementation_Plan.md)

---

## 1. Purpose & Vision

Build an intelligent **AML (Anti-Money Laundering) decision-support platform** that fuses transaction-level machine learning, account-network (graph) analysis, and explainable AI (XAI) to help AML analysts detect, understand, and investigate suspicious financial activity faster and with less blind trust in a black-box score.

The platform does **not** make final compliance decisions — it accelerates and de-risks the human analyst's judgment by surfacing *why* a transaction or customer looks risky, not just *that* it does.

## 2. Problem Statement

Traditional rule-based AML systems generate high volumes of false positives, burying real suspicious activity in noise. Analysts spend most of their time triaging alerts they cannot explain or trust. There is no unified view that combines:
- individual transaction risk (ML),
- relational/network risk (who is connected to whom, in what pattern), and
- a human-readable explanation of *why* the system flagged something.

## 3. Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Improve alert prioritization | % of high-risk alerts confirmed suspicious by analysts | ↑ vs. baseline rule engine |
| Reduce avoidable false positives | False-positive rate on labeled/synthetic eval set | Minimized while holding recall |
| Model quality | Precision, Recall, F1, PR-AUC, ROC-AUC | Reported per model version; PR-AUC prioritized (class imbalance) |
| Transparent investigations | % of high-risk alerts with a generated SHAP explanation | 100% |
| Analyst efficiency | Median time-to-triage per alert | ↓ vs. manual review |
| System responsiveness | Single prediction latency | < 2s (normal load) |
| Adoption | Dashboard load time | < 3s (prototype dataset) |

## 4. Non-Goals / Out of Scope

- Not a replacement for statutory regulatory reporting (e.g., SAR/STR filing) or final human compliance sign-off.
- Not a real-time core-banking transaction blocker — predictions are decision-support, not automated blocking.
- No automatic model retraining/redeployment from analyst feedback (feedback is captured and stored for **governed**, human-initiated retraining only).
- No mobile native app in v1.0 (responsive web only).
- Real production AML data is out of scope for the prototype — public/synthetic data is used (see TBD-1).

## 5. Target Users & Personas

| Persona | Role | Core Needs |
|---|---|---|
| **Administrator** | Manages users, roles, system configuration, model metadata, audit access | Control access, configure thresholds, oversee governance |
| **AML Analyst** | Reviews alerts, explanations, customer profiles, transaction networks; records investigation outcomes | Fast triage, trustworthy explanations, low-friction case workflow |
| **Authorized Data Operator** | Imports transaction data, reviews ingestion results | Reliable, validated data ingestion with clear error feedback |

## 6. Product Scope Summary

A self-contained web application (Next.js frontend + FastAPI backend + Supabase/PostgreSQL) that:
- Authenticates users and enforces role-based access control (RBAC).
- Ingests, validates, and monitors transaction data (CSV/API).
- Scores transactions for suspicious-activity probability via an ML model.
- Builds an account-transaction graph and computes network risk indicators (cycles, fan-in/fan-out, velocity).
- Combines ML + graph signals into a unified risk score with a SHAP-based explanation.
- Maintains dynamic, historical customer-risk profiles.
- Generates alerts, supports analyst investigation workflow (assign, comment, resolve, label outcome).
- Provides dashboards, date-range reports, and permitted data export.

## 7. Features / Epics (mapped to SRS functional requirements)

### Epic 1 — Authentication & Authorization *(Priority: High)*
- AML-FR-01: Authenticate registered users.
- AML-FR-02: Enforce role-based access (Administrator / AML Analyst / Authorized Data Operator).
- AML-FR-03: Administrators manage users and roles.

**User story:** *As an Administrator, I can create analyst accounts and assign roles so that access to sensitive investigation data is restricted appropriately.*

### Epic 2 — Transaction Ingestion & Monitoring *(Priority: High)*
- AML-FR-04: Accept CSV or authorized API input.
- AML-FR-05: Validate identifiers, amounts, timestamps, and required fields.
- AML-FR-06: Provide search, sorting, filters, and ingestion error reporting.

**User story:** *As a Data Operator, I can upload a CSV of transactions and immediately see which rows failed validation and why.*

### Epic 3 — ML-Based Risk Detection *(Priority: High)*
- AML-FR-07: Calculate a risk probability per transaction.
- AML-FR-08: Map probability to configurable risk categories (e.g., Low/Medium/High).
- AML-FR-09: Store model version and prediction timestamp.

**User story:** *As an Analyst, I see a clear risk category (not just a raw number) for each transaction, tied to a specific model version.*

### Epic 4 — Graph-Based Analysis *(Priority: High)*
- AML-FR-10: Model accounts as nodes and transactions as directed edges.
- AML-FR-11: Compute degree, velocity, fan-in/fan-out, cycle, and neighborhood-risk indicators.
- AML-FR-12: Display an interactive, filterable network visualization.

**User story:** *As an Analyst, I can visually explore an account's transaction network to spot layering/structuring patterns (cycles, rapid fan-out).*

### Epic 5 — Explainable Risk Analysis *(Priority: High)*
- AML-FR-13: Show factors that increase or decrease risk.
- AML-FR-14: Generate readable (natural-language) explanations for high-risk alerts.
- AML-FR-15: Persist explanations for audit purposes.

**User story:** *As an Analyst, I can read a plain-language reason ("large amount, first transaction with this counterparty, part of a 4-account cycle") instead of trusting an opaque score.*

### Epic 6 — Customer Risk Profiling *(Priority: High)*
- AML-FR-16: Maintain a current customer-risk score.
- AML-FR-17: Display risk history and trend over time.
- AML-FR-18: Recalculate risk after significant activity.

**User story:** *As an Analyst, I can see how a customer's risk has evolved over the last 6 months, not just their current snapshot.*

### Epic 7 — Alert Investigation & Feedback *(Priority: High)*
- AML-FR-19: Create alerts using configurable thresholds.
- AML-FR-20: Analysts can assign, comment on, and update alerts.
- AML-FR-21: Analysts label outcomes: confirmed suspicious / false positive / further investigation.
- AML-FR-22: Feedback stored for governed model improvement (not auto-retraining).

**User story:** *As an Analyst, I can claim an alert, add investigation notes, and close it with a definitive outcome that feeds future model reviews.*

### Epic 8 — Dashboard & Reporting *(Priority: High)*
- AML-FR-23: Dashboard shows volumes, alert counts, risk distribution, trends.
- AML-FR-24: Generate date-range reports.
- AML-FR-25: Authorized users can export permitted data.

**User story:** *As an Administrator, I can generate a monthly report of alert volumes and outcomes for compliance review.*

## 8. Key Non-Functional Requirements (summary — full detail in TRD)

- **Performance:** predictions < 2s; dashboards < 3s; batch ingestion shows progress.
- **Safety:** system never auto-blocks/penalizes a customer from ML output alone; high-risk results require human review; destructive actions require confirmation.
- **Security:** HTTPS everywhere, hashed passwords, secure tokens, least-privilege RBAC, audit logging, common web-vuln mitigation.
- **Quality attributes:** 99% availability during testing; modular/maintainable code; horizontally scalable stateless API; full requirement-to-test traceability.

## 9. Business Rules

1. Only administrators manage roles and configuration.
2. Only authorized analysts view detailed evidence and submit case outcomes.
3. A prediction alone is never a final compliance decision.
4. Risk thresholds and model versions are controlled and auditable (versioned, not silently changed).
5. Analyst feedback is stored but never auto-triggers model redeployment.

## 10. Assumptions & Dependencies

- Input transaction data follows the documented schema (see Backend Schema doc).
- Real labeled AML data is restricted → public/synthetic datasets are used for the prototype.
- Model artifacts and preprocessing pipelines stay version-compatible.
- Hosting/database/library availability (Supabase, Vercel, Render/Railway) is assumed.
- Users have appropriate authorization and domain (AML) knowledge.

## 11. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| No real labeled AML data available | Model quality untestable on realistic distribution | Use published synthetic AML datasets (e.g., IBM AMLSim-style); document limitation |
| Over-trust in ML score by analysts | Wrongful accusation / missed fraud | Mandatory human review, explanation-first UI, safety business rules |
| Class imbalance (suspicious << legit) | Poor recall or high false positives | PR-AUC-focused evaluation, resampling/weighting, threshold tuning |
| Graph computation cost at scale | Slow network views | Cap neighborhood depth, precompute/cache indicators, async jobs for large graphs |
| Scope creep from ML experimentation | Sprint delays | Agile timeboxing (see Implementation Plan), TBD list tracked explicitly |

## 12. Open Items (To Be Determined)

- **TBD-1:** Final public/synthetic AML dataset selection.
- **TBD-2:** Final risk thresholds after validation.
- **TBD-3:** Data-retention period.
- **TBD-4:** Final deployment provider and resource limits.
- **TBD-5:** Whether to add a Graph Neural Network beyond the NetworkX baseline.

## 13. Release Plan Summary

Delivered incrementally across 6 Agile sprints (see [Implementation Plan](./05_Implementation_Plan.md) for detail):
Auth & DB → Transaction Management → ML Prediction → Explainability & Risk Profiling → Graph Analysis → Investigation, Reporting & Deployment.
