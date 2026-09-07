# Backend / Database Schema Document

**Product:** Explainable Graph-Enhanced ML Framework for Adaptive AML Detection
**Database:** Supabase (PostgreSQL 15+)
**Version:** 1.0 | **Date:** 2 September 2026
**Related documents:** [PRD](./01_PRD.md) · [TRD](./02_TRD.md) · [Design Scheme](./04_Design_Scheme.md) · [Implementation Plan](./05_Implementation_Plan.md)

---

## 1. Scope

Per SRS §6.1, the database maintains: **users, customers, accounts, transactions, predictions, graph indicators, alerts, explanations, case notes, feedback, model metadata, and audit logs.** Keys and constraints preserve integrity; indexes support frequent account, date, status, and risk queries.

## 2. Entity-Relationship Overview

```
auth.users (Supabase Auth)
     │
     ▼ (1:1 cascade)
   users ─┬─< audit_logs
          ├─< alerts (assigned_to)
          ├─< case_notes (author)
          └─< analyst_feedback (analyst_id)

   roles ─< users

customers ─< accounts ─< transactions ──< predictions ──< explanations
   │                        │  (origin/dest FK x2)   │
   │                        │                        └─< model_metadata (via model_version)
   ├─< customer_risk_history
   └─< alerts (customer_id, nullable)

accounts ─< graph_indicators

ingestion_batches ─< transactions
transactions ──< alerts (triggering_transaction_id, nullable)
alerts ─< case_notes
alerts ─< analyst_feedback
```

## 3. Table Definitions & Supabase DDL (Copy-Paste Ready)

> [!TIP]
> **Supabase SQL Editor Ready:** The single SQL script below is fully self-contained, idempotent, and ready to copy-paste directly into your [Supabase SQL Editor](https://supabase.com/dashboard). It creates all required extensions, RBAC seed roles, Supabase Auth user synchronization triggers, tables, performance indexes, and comprehensive Row-Level Security (RLS) policies. Alternatively, you can copy directly from the companion file [`schema.sql`](./schema.sql).

```sql
-- =============================================================================
-- EXPLAINABLE GRAPH-ENHANCED ML FRAMEWORK FOR ADAPTIVE AML DETECTION
-- Supabase Database Schema (PostgreSQL 15+)
-- =============================================================================

-- =============================================================================
-- 0. Extensions & Helper Functions
-- =============================================================================
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- =============================================================================
-- 1. Roles & Application User Profiles (Supabase Auth Integration)
-- =============================================================================
create table if not exists public.roles (
    role_id        smallint primary key,
    role_name      varchar(40) not null unique,   -- 'administrator' | 'aml_analyst' | 'data_operator'
    description    text
);

-- Seed default application roles
insert into public.roles (role_id, role_name, description) values
    (1, 'administrator', 'System Administrator with full access, config, and user management privileges'),
    (2, 'aml_analyst', 'AML Compliance Analyst managing alerts, reviews, and case investigations'),
    (3, 'data_operator', 'Data Operator authorized to upload and ingest transaction batches')
on conflict (role_id) do update set
    role_name = excluded.role_name,
    description = excluded.description;

-- Application users table mapped 1:1 with Supabase Auth (auth.users)
-- Password hashing and credential lifecycle are strictly delegated to Supabase Auth (GoTrue).
create table if not exists public.users (
    user_id         uuid primary key references auth.users(id) on delete cascade,
    email           varchar(160) not null unique,
    full_name       varchar(120),
    role_id         smallint not null references public.roles(role_id) default 2,
    is_active       boolean not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    last_login_at   timestamptz
);

create index if not exists idx_users_role on public.users(role_id);
create index if not exists idx_users_email on public.users(email);

-- Trigger function: automatically creates public.users profile on Supabase Auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.users (user_id, email, full_name, role_id)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        coalesce((new.raw_app_meta_data->>'role_id')::smallint, 2) -- default to aml_analyst (2)
    )
    on conflict (user_id) do update set
        email = excluded.email,
        full_name = coalesce(excluded.full_name, public.users.full_name),
        updated_at = now();
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- Helper function: retrieves role of current authenticated Supabase caller
create or replace function public.current_user_role()
returns varchar(40)
language sql stable security definer
as $$
    select r.role_name
    from public.users u
    join public.roles r on u.role_id = r.role_id
    where u.user_id = auth.uid();
$$;

-- =============================================================================
-- 2. Customers & Accounts (AML-FR-04..06, 16..18)
-- =============================================================================
create table if not exists public.customers (
    customer_id             uuid primary key default gen_random_uuid(),
    external_ref            varchar(80) unique,          -- source-system customer ID (KYC ref)
    full_name               varchar(160) not null,
    date_of_birth           date,
    country                 varchar(80),
    occupation              varchar(120),
    kyc_level               varchar(20),                 -- 'basic' | 'standard' | 'enhanced'
    onboarded_at            timestamptz,
    current_risk_score      numeric(5,4),                -- 0.0000 - 1.0000, denormalized latest value
    current_risk_category   varchar(20),                 -- 'low' | 'medium' | 'high'
    risk_updated_at         timestamptz,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

create index if not exists idx_customers_risk_category on public.customers(current_risk_category);
create index if not exists idx_customers_external_ref on public.customers(external_ref);

create table if not exists public.accounts (
    account_id      uuid primary key default gen_random_uuid(),
    customer_id     uuid not null references public.customers(customer_id) on delete cascade,
    account_number  varchar(64) not null unique,
    account_type    varchar(40),                   -- 'savings' | 'current' | 'business' ...
    currency        varchar(10) not null default 'USD',
    opened_at       timestamptz,
    status          varchar(20) not null default 'active',  -- 'active' | 'dormant' | 'closed'
    created_at      timestamptz not null default now()
);

create index if not exists idx_accounts_customer on public.accounts(customer_id);
create index if not exists idx_accounts_status on public.accounts(status);

-- =============================================================================
-- 3. Ingestion Batches & Transactions (AML-FR-04, 05, 06)
-- =============================================================================
create table if not exists public.ingestion_batches (
    batch_id        uuid primary key default gen_random_uuid(),
    uploaded_by     uuid not null references public.users(user_id),
    source_type     varchar(20) not null,           -- 'csv' | 'api'
    filename        varchar(255),
    total_rows      integer not null default 0,
    accepted_rows   integer not null default 0,
    rejected_rows   integer not null default 0,
    status          varchar(20) not null default 'processing', -- 'processing' | 'completed' | 'failed'
    started_at      timestamptz not null default now(),
    completed_at    timestamptz
);

create index if not exists idx_ingestion_batches_user on public.ingestion_batches(uploaded_by);
create index if not exists idx_ingestion_batches_status on public.ingestion_batches(status);

create table if not exists public.transactions (
    transaction_id          uuid primary key default gen_random_uuid(),
    external_ref            varchar(80),                -- source-system transaction ID (dedup key)
    origin_account_id       uuid not null references public.accounts(account_id),
    destination_account_id  uuid not null references public.accounts(account_id),
    amount                  numeric(18,2) not null check (amount > 0),
    currency                varchar(10) not null default 'USD',
    transaction_type        varchar(40),                -- 'transfer' | 'deposit' | 'withdrawal' | 'wire' ...
    channel                 varchar(40),                -- 'online' | 'branch' | 'atm' | 'api'
    occurred_at             timestamptz not null,
    ingested_at             timestamptz not null default now(),
    ingestion_batch_id      uuid references public.ingestion_batches(batch_id) on delete set null,
    ingestion_status        varchar(20) not null default 'accepted', -- 'accepted' | 'rejected'
    ingestion_error         text,
    created_at              timestamptz not null default now(),
    constraint uq_transactions_external_ref unique (external_ref)
);

create index if not exists idx_txn_origin on public.transactions(origin_account_id);
create index if not exists idx_txn_dest on public.transactions(destination_account_id);
create index if not exists idx_txn_occurred_at on public.transactions(occurred_at);
create index if not exists idx_txn_batch on public.transactions(ingestion_batch_id);

-- =============================================================================
-- 4. Model Metadata & Predictions (AML-FR-07, 08, 09)
-- =============================================================================
create table if not exists public.model_metadata (
    model_version           varchar(40) primary key,      -- e.g. 'xgb_v1.3.0'
    algorithm               varchar(60) not null,         -- 'XGBoost' | 'RandomForest' ...
    trained_at              timestamptz not null,
    training_dataset        varchar(160),
    precision_score         numeric(5,4),
    recall_score            numeric(5,4),
    f1_score                numeric(5,4),
    pr_auc                  numeric(5,4),
    roc_auc                 numeric(5,4),
    false_positive_rate     numeric(5,4),
    false_negative_rate     numeric(5,4),
    threshold_low_max       numeric(5,4) not null default 0.30,  -- upper bound probability for 'low'
    threshold_medium_max    numeric(5,4) not null default 0.70,  -- upper bound for 'medium'; > threshold => 'high'
    is_active               boolean not null default false,
    artifact_path           text not null,                -- storage location of serialized model
    created_by              uuid references public.users(user_id),
    created_at              timestamptz not null default now()
);

create table if not exists public.predictions (
    prediction_id           uuid primary key default gen_random_uuid(),
    transaction_id          uuid not null references public.transactions(transaction_id) on delete cascade,
    model_version           varchar(40) not null references public.model_metadata(model_version),
    risk_probability        numeric(6,5) not null check (risk_probability between 0 and 1),
    risk_category           varchar(20) not null,         -- 'low' | 'medium' | 'high'
    graph_risk_component    numeric(6,5),               -- neighborhood-risk contribution
    combined_risk_score     numeric(6,5),               -- ML + graph fused score
    predicted_at            timestamptz not null default now(),
    constraint uq_prediction_per_txn_model unique (transaction_id, model_version)
);

create index if not exists idx_predictions_txn on public.predictions(transaction_id);
create index if not exists idx_predictions_category on public.predictions(risk_category);
create index if not exists idx_predictions_predicted_at on public.predictions(predicted_at);

-- =============================================================================
-- 5. Graph Indicators (AML-FR-10, 11, 12)
-- =============================================================================
create table if not exists public.graph_indicators (
    indicator_id            uuid primary key default gen_random_uuid(),
    account_id              uuid not null references public.accounts(account_id) on delete cascade,
    computed_at             timestamptz not null default now(),
    window_start            timestamptz,
    window_end              timestamptz,
    in_degree               integer default 0,
    out_degree              integer default 0,
    txn_velocity            numeric(10,4),             -- transactions per hour/day in window
    fan_in_ratio            numeric(6,4),
    fan_out_ratio           numeric(6,4),
    is_in_cycle             boolean default false,
    cycle_length            integer,
    neighborhood_risk_score numeric(6,5),              -- avg/max risk of k-hop neighbors
    graph_snapshot_id       uuid                       -- groups indicators computed in the same run
);

create index if not exists idx_graph_account on public.graph_indicators(account_id);
create index if not exists idx_graph_snapshot on public.graph_indicators(graph_snapshot_id);
create index if not exists idx_graph_cycle on public.graph_indicators(is_in_cycle);

-- =============================================================================
-- 6. Explanations (XAI) (AML-FR-13, 14, 15)
-- =============================================================================
create table if not exists public.explanations (
    explanation_id          uuid primary key default gen_random_uuid(),
    prediction_id           uuid not null references public.predictions(prediction_id) on delete cascade,
    top_features            jsonb not null,              -- [{feature, shap_value, direction}]
    narrative_text          text not null,               -- human-readable generated explanation
    generated_at            timestamptz not null default now(),
    constraint uq_explanation_per_prediction unique (prediction_id)
);

create index if not exists idx_explanations_prediction on public.explanations(prediction_id);
create index if not exists idx_explanations_features_gin on public.explanations using gin (top_features);

-- =============================================================================
-- 7. Customer Risk History (AML-FR-16, 17, 18)
-- =============================================================================
create table if not exists public.customer_risk_history (
    history_id              uuid primary key default gen_random_uuid(),
    customer_id             uuid not null references public.customers(customer_id) on delete cascade,
    risk_score              numeric(5,4) not null,
    risk_category           varchar(20) not null,
    reason                  varchar(120),                -- 'new_high_risk_txn' | 'scheduled_recompute' | 'alert_outcome'
    recorded_at             timestamptz not null default now()
);

create index if not exists idx_risk_history_customer on public.customer_risk_history(customer_id, recorded_at desc);

-- =============================================================================
-- 8. Alerts & Investigation Workflow (AML-FR-19..22)
-- =============================================================================
create table if not exists public.alerts (
    alert_id                  uuid primary key default gen_random_uuid(),
    customer_id               uuid references public.customers(customer_id) on delete set null,
    triggering_transaction_id  uuid references public.transactions(transaction_id) on delete set null,
    prediction_id              uuid references public.predictions(prediction_id) on delete set null,
    risk_category             varchar(20) not null,
    status                    varchar(20) not null default 'open', -- 'open' | 'in_progress' | 'closed'
    assigned_to               uuid references public.users(user_id) on delete set null,
    outcome                   varchar(30),          -- 'confirmed_suspicious' | 'false_positive' | 'further_investigation'
    threshold_config_used     jsonb,                -- snapshot of thresholds at alert creation
    created_at                timestamptz not null default now(),
    closed_at                 timestamptz
);

create index if not exists idx_alerts_status on public.alerts(status);
create index if not exists idx_alerts_assigned on public.alerts(assigned_to);
create index if not exists idx_alerts_customer on public.alerts(customer_id);
create index if not exists idx_alerts_created_at on public.alerts(created_at);

create table if not exists public.case_notes (
    note_id         uuid primary key default gen_random_uuid(),
    alert_id        uuid not null references public.alerts(alert_id) on delete cascade,
    author_id       uuid not null references public.users(user_id),
    note_text       text not null,
    created_at      timestamptz not null default now()
);

create index if not exists idx_case_notes_alert on public.case_notes(alert_id);

create table if not exists public.analyst_feedback (
    feedback_id                 uuid primary key default gen_random_uuid(),
    alert_id                    uuid not null references public.alerts(alert_id) on delete cascade,
    analyst_id                  uuid not null references public.users(user_id),
    outcome_label               varchar(30) not null,          -- mirrors alerts.outcome at time of feedback
    feedback_notes              text,
    explanation_quality_rating  smallint check (explanation_quality_rating between 1 and 5),
    submitted_at                timestamptz not null default now(),
    reviewed_for_retraining     boolean not null default false  -- governance gate; never auto true
);

create index if not exists idx_feedback_alert on public.analyst_feedback(alert_id);
create index if not exists idx_feedback_reviewed on public.analyst_feedback(reviewed_for_retraining);

-- =============================================================================
-- 9. Audit Log (Security §5.3)
-- =============================================================================
create table if not exists public.audit_logs (
    audit_id        uuid primary key default gen_random_uuid(),
    user_id         uuid references public.users(user_id) on delete set null,
    action          varchar(80) not null,             -- 'login' | 'role_change' | 'alert_outcome' | 'export' | 'config_change'
    entity_type     varchar(40),                      -- 'user' | 'alert' | 'transaction' | 'model_metadata' ...
    entity_id       uuid,
    details         jsonb,
    ip_address      inet,
    created_at      timestamptz not null default now()
);

create index if not exists idx_audit_user on public.audit_logs(user_id);
create index if not exists idx_audit_action on public.audit_logs(action);
create index if not exists idx_audit_created_at on public.audit_logs(created_at);

-- =============================================================================
-- 10. Row-Level Security (RLS) Configuration & Policies
-- =============================================================================
-- Enable RLS across all tables
alter table public.roles enable row level security;
alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.accounts enable row level security;
alter table public.ingestion_batches enable row level security;
alter table public.transactions enable row level security;
alter table public.model_metadata enable row level security;
alter table public.predictions enable row level security;
alter table public.graph_indicators enable row level security;
alter table public.explanations enable row level security;
alter table public.customer_risk_history enable row level security;
alter table public.alerts enable row level security;
alter table public.case_notes enable row level security;
alter table public.analyst_feedback enable row level security;
alter table public.audit_logs enable row level security;

-- 10.1 Roles & Users Policies
drop policy if exists "Authenticated users can read roles" on public.roles;
create policy "Authenticated users can read roles"
    on public.roles for select
    to authenticated
    using (true);

drop policy if exists "Users can read own profile or admin can read all" on public.users;
create policy "Users can read own profile or admin can read all"
    on public.users for select
    to authenticated
    using (auth.uid() = user_id or public.current_user_role() = 'administrator');

drop policy if exists "Admins can update users" on public.users;
create policy "Admins can update users"
    on public.users for update
    to authenticated
    using (public.current_user_role() = 'administrator')
    with check (public.current_user_role() = 'administrator');

-- 10.2 Operational AML Data Policies (Read access for all authenticated staff)
drop policy if exists "Authenticated users can view customers" on public.customers;
create policy "Authenticated users can view customers"
    on public.customers for select to authenticated using (true);

drop policy if exists "Authenticated users can view accounts" on public.accounts;
create policy "Authenticated users can view accounts"
    on public.accounts for select to authenticated using (true);

drop policy if exists "Authenticated users can view transactions" on public.transactions;
create policy "Authenticated users can view transactions"
    on public.transactions for select to authenticated using (true);

drop policy if exists "Authenticated users can view ingestion batches" on public.ingestion_batches;
create policy "Authenticated users can view ingestion batches"
    on public.ingestion_batches for select to authenticated using (true);

drop policy if exists "Data operators and admins can create ingestion batches" on public.ingestion_batches;
create policy "Data operators and admins can create ingestion batches"
    on public.ingestion_batches for insert to authenticated
    with check (public.current_user_role() in ('data_operator', 'administrator') and auth.uid() = uploaded_by);

drop policy if exists "Authenticated users can view predictions" on public.predictions;
create policy "Authenticated users can view predictions"
    on public.predictions for select to authenticated using (true);

drop policy if exists "Authenticated users can view explanations" on public.explanations;
create policy "Authenticated users can view explanations"
    on public.explanations for select to authenticated using (true);

drop policy if exists "Authenticated users can view graph indicators" on public.graph_indicators;
create policy "Authenticated users can view graph indicators"
    on public.graph_indicators for select to authenticated using (true);

drop policy if exists "Authenticated users can view customer risk history" on public.customer_risk_history;
create policy "Authenticated users can view customer risk history"
    on public.customer_risk_history for select to authenticated using (true);

drop policy if exists "Authenticated users can view model metadata" on public.model_metadata;
create policy "Authenticated users can view model metadata"
    on public.model_metadata for select to authenticated using (true);

drop policy if exists "Admins can manage model metadata" on public.model_metadata;
create policy "Admins can manage model metadata"
    on public.model_metadata for all to authenticated
    using (public.current_user_role() = 'administrator');

-- 10.3 Alerts & Case Management Policies
drop policy if exists "Authenticated users can view alerts" on public.alerts;
create policy "Authenticated users can view alerts"
    on public.alerts for select to authenticated using (true);

drop policy if exists "Analysts and admins can update alerts" on public.alerts;
create policy "Analysts and admins can update alerts"
    on public.alerts for update to authenticated
    using (public.current_user_role() in ('aml_analyst', 'administrator'))
    with check (public.current_user_role() in ('aml_analyst', 'administrator'));

drop policy if exists "Authenticated users can view case notes" on public.case_notes;
create policy "Authenticated users can view case notes"
    on public.case_notes for select to authenticated using (true);

drop policy if exists "Analysts and admins can add case notes" on public.case_notes;
create policy "Analysts and admins can add case notes"
    on public.case_notes for insert to authenticated
    with check (auth.uid() = author_id and public.current_user_role() in ('aml_analyst', 'administrator'));

drop policy if exists "Authenticated users can view feedback" on public.analyst_feedback;
create policy "Authenticated users can view feedback"
    on public.analyst_feedback for select to authenticated using (true);

drop policy if exists "Analysts can submit feedback" on public.analyst_feedback;
create policy "Analysts can submit feedback"
    on public.analyst_feedback for insert to authenticated
    with check (auth.uid() = analyst_id and public.current_user_role() in ('aml_analyst', 'administrator'));

-- 10.4 Audit Logs Policies
drop policy if exists "Admins can view audit logs" on public.audit_logs;
create policy "Admins can view audit logs"
    on public.audit_logs for select to authenticated
    using (public.current_user_role() = 'administrator');

drop policy if exists "Authenticated users can insert audit logs" on public.audit_logs;
create policy "Authenticated users can insert audit logs"
    on public.audit_logs for insert to authenticated
    with check (auth.uid() = user_id or user_id is null);
```

## 4. Field-Level Notes

- **`users.user_id`** references **`auth.users(id)`** directly with `on delete cascade`. Authentication credentials, passwords, MFA, and JWT session handling are managed exclusively by **Supabase Auth**. No password hashes are stored in the application schema.
- **`predictions.combined_risk_score`** implements the ML+graph fusion described in the TRD (§4.6); the exact weighting formula is versioned in `model_metadata` (or a dedicated `scoring_config` table if weights need independent versioning from the model artifact — recommended as a v1.1 refinement).
- **`model_metadata.threshold_low_max` / `threshold_medium_max`** implement AML-FR-08's "configurable risk categories" — editable only by Administrators, and every change should be captured in `audit_logs`.
- **`explanations.top_features`** stored as `jsonb` for flexible SHAP output shape, e.g.:
  ```json
  [
    {"feature": "amount_zscore", "shap_value": 0.31, "direction": "increases_risk"},
    {"feature": "counterparty_is_new", "shap_value": 0.18, "direction": "increases_risk"},
    {"feature": "account_age_days", "shap_value": -0.09, "direction": "decreases_risk"}
  ]
  ```
- **`alerts.threshold_config_used`** snapshots the thresholds/model version active at alert-creation time — critical for auditability when thresholds change later (AML-FR-19, Business Rule: "Thresholds and model versions shall be controlled and auditable").
- **`analyst_feedback.reviewed_for_retraining`** enforces Business Rule 5 ("Feedback shall not automatically deploy a retrained model") — it defaults `false` and can only be flipped by a governed, manual review process (application-layer, not a DB trigger).
- All `uuid` primary keys use `gen_random_uuid()` (standard built-in native function in PostgreSQL 13+ / Supabase).
- `numeric(p,s)` (not `float`) is used for money and probabilities to avoid floating-point rounding issues in financial/risk calculations.

## 5. Indexing Strategy (per SRS §6.1: "indexes shall support frequent account, date, status, and risk queries")

| Query pattern | Index |
|---|---|
| Transactions by account | `idx_txn_origin`, `idx_txn_dest` |
| Transactions by date range | `idx_txn_occurred_at` |
| Predictions by risk category | `idx_predictions_category` |
| Alerts by status / assignee | `idx_alerts_status`, `idx_alerts_assigned` |
| Customer risk trend lookup | `idx_risk_history_customer (customer_id, recorded_at desc)` |
| Graph lookups by account/snapshot | `idx_graph_account`, `idx_graph_snapshot` |
| Feature search inside explanations | `idx_explanations_features_gin` (GIN on jsonb) |

## 6. Referential Integrity & Cascades

- `accounts.customer_id → customers` and `transactions.*_account_id → accounts`: `on delete cascade` from `customers`→`accounts`, but transactions are **not** cascade-deleted from accounts in production use (financial records should be soft-archived, not hard-deleted). For the prototype, cascade is acceptable; flag as a hardening item before any real-data use.
- `predictions`, `explanations`, `graph_indicators`, `alerts`, `case_notes`, `analyst_feedback` all cascade from their parent (`transactions`/`alerts`) to keep referential integrity simple in the prototype phase.
- `audit_logs.user_id` is a soft reference (`references users` with `on delete set null`) — audit history survives user deactivation/deletion.

## 7. Row-Level Security (Supabase RLS)

Supabase enforces Postgres RLS. All 15 application tables have RLS enabled and secured with declarative policies (included directly in Section 3's DDL script under Part 10):
- **Bypass for Service Role:** The FastAPI backend uses the Supabase service role key, which inherently bypasses RLS for high-throughput batch ingestion and automated ML/graph scoring pipelines.
- **Client & Analyst Access:** Authenticated users (`aml_analyst`, `data_operator`, `administrator`) have read access to operational AML data (`customers`, `accounts`, `transactions`, `predictions`, `explanations`, `graph_indicators`).
- **Workflow Protection:** Case notes and analyst feedback enforce that authors match `auth.uid()`. Alert updates are restricted to analysts and administrators.
- **Administration & Audit:** User management, model metadata changes, and audit log inspection are strictly restricted to the `administrator` role.

## 8. Migration Strategy

- For initial setup, copy and paste the complete DDL script in Section 3 (or [`schema.sql`](./schema.sql)) directly into the **Supabase SQL Editor**.
- For incremental changes, use **Alembic** or **Supabase CLI migrations** (`supabase db diff` / `supabase migration new`) paired with SQLAlchemy models mirroring this DDL.
- Seed data: default `roles` rows (1: administrator, 2: aml_analyst, 3: data_operator) are automatically seeded by the script on initial run.
