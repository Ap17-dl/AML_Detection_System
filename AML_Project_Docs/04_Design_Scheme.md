# Design Scheme (UI/UX Design System)

**Product:** Explainable Graph-Enhanced ML Framework for Adaptive AML Detection
**Version:** 1.0 | **Date:** 2 September 2026
**Related documents:** [PRD](./01_PRD.md) · [TRD](./02_TRD.md) · [Backend Schema](./03_Backend_Schema.md) · [Implementation Plan](./05_Implementation_Plan.md)

---

## 1. Design Principles

1. **Explain before you alarm.** Every risk indicator is paired with a plain-language reason — never a bare number or unexplained red flag (per AML-FR-13/14 and Safety Requirement: no auto-accusation from ML output alone).
2. **Human-in-the-loop, always visible.** The UI constantly signals "this is decision support" — confirmation dialogs on destructive/high-stakes actions, explicit outcome-labeling controls, no auto-resolving alerts.
3. **Trust through consistency.** One risk-color vocabulary, one typography scale, one interaction pattern for tables/filters across every module.
4. **Progressive disclosure.** Dashboard → alert list → alert detail → full explanation/graph. Analysts should never need to context-switch to piece together a case.
5. **Accessible by default.** Risk is never color-only — always paired with a text label/icon (per SRS §3.1: "Risk shall use text labels in addition to visual indicators").

## 2. Design Tokens

### 2.1 Color System

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-bg` | `#F7F8FA` | `#0F1115` | App background |
| `--color-surface` | `#FFFFFF` | `#1A1D23` | Cards, panels |
| `--color-border` | `#E2E5EA` | `#2A2E37` | Dividers, table borders |
| `--color-text-primary` | `#14161A` | `#EDEFF2` | Body text |
| `--color-text-secondary` | `#5B6270` | `#9BA1AC` | Captions, meta |
| `--color-accent` | `#2E5AAC` | `#5B86D9` | Primary actions, links |
| `--risk-low` | `#1E8E5A` | `#3FBE86` | Low risk badge/label |
| `--risk-medium` | `#B8791A` | `#E0A93C` | Medium risk badge/label |
| `--risk-high` | `#C23B3B` | `#E5615F` | High risk badge/label |
| `--status-open` | `#5B6270` | `#9BA1AC` | Alert: open |
| `--status-in-progress` | `#2E5AAC` | `#5B86D9` | Alert: in progress |
| `--status-closed` | `#1E8E5A` | `#3FBE86` | Alert: closed |

> Risk colors are chosen for AA contrast against both light/dark surfaces and are never the *only* signal — each risk badge renders as `● High` / `● Medium` / `● Low` (icon/dot + word), never a bare color chip.

### 2.2 Typography

| Token | Font | Size / Weight | Usage |
|---|---|---|---|
| `--font-family` | Inter (fallback: system-ui, sans-serif) | — | All UI text |
| `--font-family-mono` | JetBrains Mono (fallback: monospace) | — | Account IDs, transaction hashes, code |
| `text-display` | Inter | 28px / 700 | Page titles |
| `text-h2` | Inter | 20px / 600 | Section headers |
| `text-h3` | Inter | 16px / 600 | Card/table headers |
| `text-body` | Inter | 14px / 400 | Default body |
| `text-caption` | Inter | 12px / 400 | Meta, timestamps |
| `text-label` | Inter | 12px / 600, uppercase, tracked | Badges, field labels |

### 2.3 Spacing & Layout

- 8px base spacing scale: `4, 8, 12, 16, 24, 32, 48, 64`.
- 12-column responsive grid; content max-width `1440px` centered; sidebar `256px` fixed (collapsible to icon-rail at `72px` on tablet).
- Breakpoints: `sm 640px`, `md 768px`, `lg 1024px`, `xl 1280px`, `2xl 1536px`.

### 2.4 Elevation & Radius

- Radius: `6px` (inputs/buttons), `10px` (cards), `12px` (modals).
- Elevation: `shadow-sm` for cards, `shadow-md` for popovers/dropdowns, `shadow-lg` for modals.

## 3. Information Architecture / Navigation

```
Sidebar (persistent):
 ├─ Dashboard
 ├─ Transactions          (monitor, search, import)
 ├─ Alerts                (queue → detail)
 ├─ Customers             (list → risk profile)
 ├─ Network Explorer       (graph visualization)
 ├─ Reports
 └─ Administration          (Admin-only: Users & Roles, Model & Thresholds, Audit Log)

Topbar: global search, environment/model-version badge, user menu (role shown), notifications
```

Role-based visibility:
- **Administrator:** all nav items, incl. Administration.
- **AML Analyst:** Dashboard, Transactions (read), Alerts (full), Customers, Network Explorer, Reports.
- **Authorized Data Operator:** Dashboard (limited), Transactions (import + read), no Alerts/Customers detail access.

## 4. Core Screens

### 4.1 Login
- Centered card, email + password, "Forgot password" link, error state below field (not a generic toast).
- No role selector — role is resolved server-side after auth.

### 4.2 Dashboard (AML-FR-23)
- KPI row (4 stat tiles): Total transactions (period), Open alerts, High-risk rate, Avg. time-to-triage.
- Risk distribution chart (donut or stacked bar: Low/Medium/High counts).
- Trend chart (line): alert volume over time, with risk-band overlay.
- Recent high-risk alerts table (top 5, "View all →" link to Alerts).

### 4.3 Transaction Monitor (AML-FR-04–06)
- Toolbar: search box, date-range filter, risk-category filter, channel filter, "Import CSV" button (Data Operator/Admin only).
- Data table columns: Timestamp, Origin Account, Destination Account, Amount, Type, Risk Category (badge), Model Version.
- Row click → Transaction Detail drawer: raw fields + linked prediction + "View explanation" + "View network" quick actions.
- CSV Import flow: drag-and-drop → upload progress bar → ingestion report (accepted/rejected counts, expandable per-row error list) — directly satisfies AML-FR-06's "ingestion errors" requirement.

### 4.4 Alert Queue (AML-FR-19–20)
- Kanban-style or table view (toggle), grouped/filterable by status (Open/In Progress/Closed) and risk category.
- Columns: Alert ID, Customer, Risk Category, Created At, Assigned To, Status.
- Bulk-assign action (Admin) and "Claim" self-assign action (Analyst).

### 4.5 Alert Detail / Case Review (AML-FR-20–22)
Two-column layout:
- **Left (evidence):** transaction summary, risk score + category, **Explanation panel** (SHAP factors as a horizontal bar chart of ± contributions + narrative sentence), mini network graph preview, customer risk-history sparkline.
- **Right (workflow):** status control, assignment control, case-notes thread (chronological, author + timestamp), outcome selector (`Confirmed Suspicious` / `False Positive` / `Further Investigation` — radio-style, requires explicit confirm), feedback rating for explanation quality (1–5).
- Closing an alert without an outcome is disabled (safety requirement enforcement in the UI layer).

### 4.6 Customer Risk Profile (AML-FR-16–18)
- Header: customer name, KYC level, current risk badge, "last recalculated" timestamp.
- Risk history line chart (score over time) with alert markers plotted on the timeline.
- Linked accounts list (table) and recent transactions (paginated).
- Linked alerts (past/open) list.

### 4.7 Network Explorer (AML-FR-10–12)
- Full-canvas interactive graph (force-directed layout): nodes = accounts (size = degree, color = risk category), edges = transactions (thickness = amount, arrow = direction).
- Left filter panel: date range, min amount, show cycles only, depth (1–3 hops from a focal account).
- Node click → side panel with account summary + "Open customer profile" / "View transactions" links.
- Cycle highlighting: detected cycles rendered with a distinct dashed/animated stroke + legend entry.
- Empty/loading/large-graph states explicitly designed (e.g., "Graph truncated to 200 nodes — narrow your filter" banner) to keep performance predictable.

### 4.8 Reports (AML-FR-24–25)
- Date-range picker + report type selector (Alert Summary, Risk Distribution, Model Performance).
- Preview table + "Export CSV / PDF" (role-gated per Business Rule: only authorized roles export).

### 4.9 Administration (Admin-only)
- **Users & Roles:** table + invite/edit modal, role dropdown, active/deactivate toggle.
- **Model & Thresholds:** active model version, precision/recall/F1/PR-AUC/ROC-AUC/FPR/FNR readout, threshold sliders (Low/Medium/High boundaries) with a confirm-and-audit-logged save action.
- **Audit Log:** filterable table (user, action type, date range, entity).

## 5. Key Components (shared library)

| Component | Notes |
|---|---|
| `RiskBadge` | Dot + text label (`● High`), never color-only; consistent across all screens |
| `DataTable` | Search, sort, paginate, column filters — shared by Transactions/Alerts/Customers/Audit Log |
| `ExplanationPanel` | SHAP bar chart + narrative text + "why am I seeing this" tooltip |
| `NetworkGraph` | Wraps a graph-rendering lib (e.g., `react-force-graph` or `vis-network`); accepts nodes/edges/indicators payload from `/api/v1/graph/...` |
| `ConfirmDialog` | Required wrapper for all destructive/high-stakes actions (delete, close-without-review, threshold change) |
| `TrendChart` / `DistributionChart` | Shared charting primitives (e.g., built on `recharts`) for Dashboard, Customer Profile, Reports |
| `StatusPill` | Alert status (Open/In Progress/Closed) |
| `Toast/InlineError` | Errors shown inline near the triggering control, not just as transient toasts (usability requirement: understandable, non-lossy feedback) |

## 6. Interaction & Usability Rules

- Every table supports keyboard-accessible sort/filter and has an empty state with guidance text.
- Any action that changes a compliance-relevant record (alert outcome, threshold, role) requires a confirm step and is optimistically **not** applied until the API responds 200 — no silent local-only state.
- Loading states use skeleton placeholders (not spinners) for tables/charts to reduce perceived latency ahead of the 2–3s performance targets.
- Explanations always render before/above raw model scores in the visual hierarchy, reinforcing "explain before you alarm."

## 7. Accessibility & Responsiveness

- WCAG 2.1 AA target: color contrast ≥ 4.5:1 for text, ≥ 3:1 for graphical objects (badges, chart lines).
- All interactive elements reachable via keyboard (tab order matches visual order); focus rings visible.
- Charts/graphs include a text-equivalent summary (e.g., "3 of 12 accounts flagged high risk") for screen readers.
- Responsive behavior: sidebar collapses to icon-rail ≤ `lg`; Network Explorer becomes full-screen modal on mobile widths; tables switch to stacked-card layout ≤ `md`.

## 8. Theming

- Light and dark themes both defined via the token table in §2.1; theme toggle in the topbar user menu; preference persisted client-side.
- Print/export (Reports, PDF) always renders in a light, high-contrast "print" theme regardless of active app theme.

## 9. Wireframe Reference Map

| Screen | Primary AML-FRs covered |
|---|---|
| Login | AML-FR-01 |
| Dashboard | AML-FR-23 |
| Transaction Monitor | AML-FR-04, 05, 06 |
| Alert Queue | AML-FR-19, 20 |
| Alert Detail | AML-FR-13, 14, 20, 21, 22 |
| Customer Risk Profile | AML-FR-16, 17, 18 |
| Network Explorer | AML-FR-10, 11, 12 |
| Reports | AML-FR-24, 25 |
| Administration | AML-FR-02, 03, 08 (threshold config) |
