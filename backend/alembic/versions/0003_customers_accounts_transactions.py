"""customers, accounts, ingestion_batches, transactions

Mirrors 03_Backend_Schema.md §2-§3 (parts 2, 3, 10.2): customers, accounts, ingestion_batches,
transactions tables with all indexes, constraints, and RLS policies.

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-19
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Customers ──────────────────────────────────────────────────────────────
    op.create_table(
        "customers",
        sa.Column(
            "customer_id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("external_ref", sa.String(80), unique=True),
        sa.Column("full_name", sa.String(160), nullable=False),
        sa.Column("date_of_birth", sa.Date),
        sa.Column("country", sa.String(80)),
        sa.Column("occupation", sa.String(120)),
        sa.Column("kyc_level", sa.String(20)),
        sa.Column("onboarded_at", sa.DateTime(timezone=True)),
        sa.Column("current_risk_score", sa.Numeric(5, 4)),
        sa.Column("current_risk_category", sa.String(20)),
        sa.Column("risk_updated_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        schema="public",
    )
    op.create_index(
        "idx_customers_risk_category", "customers", ["current_risk_category"], schema="public"
    )
    op.create_index("idx_customers_external_ref", "customers", ["external_ref"], schema="public")

    # ── Accounts ───────────────────────────────────────────────────────────────
    op.create_table(
        "accounts",
        sa.Column(
            "account_id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "customer_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("public.customers.customer_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("account_number", sa.String(64), nullable=False, unique=True),
        sa.Column("account_type", sa.String(40)),
        sa.Column("currency", sa.String(10), nullable=False, server_default="USD"),
        sa.Column("opened_at", sa.DateTime(timezone=True)),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        schema="public",
    )
    op.create_index("idx_accounts_customer", "accounts", ["customer_id"], schema="public")
    op.create_index("idx_accounts_status", "accounts", ["status"], schema="public")

    # ── Ingestion Batches ──────────────────────────────────────────────────────
    op.create_table(
        "ingestion_batches",
        sa.Column(
            "batch_id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "uploaded_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("public.users.user_id"),
            nullable=False,
        ),
        sa.Column("source_type", sa.String(20), nullable=False),
        sa.Column("filename", sa.String(255)),
        sa.Column("total_rows", sa.Integer, nullable=False, server_default="0"),
        sa.Column("accepted_rows", sa.Integer, nullable=False, server_default="0"),
        sa.Column("rejected_rows", sa.Integer, nullable=False, server_default="0"),
        sa.Column("status", sa.String(20), nullable=False, server_default="processing"),
        sa.Column(
            "started_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        schema="public",
    )
    op.create_index(
        "idx_ingestion_batches_user", "ingestion_batches", ["uploaded_by"], schema="public"
    )
    op.create_index(
        "idx_ingestion_batches_status", "ingestion_batches", ["status"], schema="public"
    )

    # ── Transactions ───────────────────────────────────────────────────────────
    op.create_table(
        "transactions",
        sa.Column(
            "transaction_id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("external_ref", sa.String(80)),
        sa.Column(
            "origin_account_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("public.accounts.account_id"),
            nullable=False,
        ),
        sa.Column(
            "destination_account_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("public.accounts.account_id"),
            nullable=False,
        ),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("currency", sa.String(10), nullable=False, server_default="USD"),
        sa.Column("transaction_type", sa.String(40)),
        sa.Column("channel", sa.String(40)),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "ingested_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "ingestion_batch_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("public.ingestion_batches.batch_id", ondelete="SET NULL"),
        ),
        sa.Column("ingestion_status", sa.String(20), nullable=False, server_default="accepted"),
        sa.Column("ingestion_error", sa.Text),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.CheckConstraint("amount > 0", name="ck_transactions_amount_positive"),
        sa.UniqueConstraint("external_ref", name="uq_transactions_external_ref"),
        schema="public",
    )
    op.create_index("idx_txn_origin", "transactions", ["origin_account_id"], schema="public")
    op.create_index("idx_txn_dest", "transactions", ["destination_account_id"], schema="public")
    op.create_index("idx_txn_occurred_at", "transactions", ["occurred_at"], schema="public")
    op.create_index("idx_txn_batch", "transactions", ["ingestion_batch_id"], schema="public")

    # ── RLS Policies (§10.2) ───────────────────────────────────────────────────
    for table in ("customers", "accounts", "ingestion_batches", "transactions"):
        op.execute(f"alter table public.{table} enable row level security")

    op.execute(
        """
        create policy "Authenticated users can view customers"
            on public.customers for select to authenticated using (true)
    """
    )
    op.execute(
        """
        create policy "Authenticated users can view accounts"
            on public.accounts for select to authenticated using (true)
    """
    )
    op.execute(
        """
        create policy "Authenticated users can view transactions"
            on public.transactions for select to authenticated using (true)
    """
    )
    op.execute(
        """
        create policy "Authenticated users can view ingestion batches"
            on public.ingestion_batches for select to authenticated using (true)
    """
    )
    op.execute(
        """
        create policy "Data operators and admins can create ingestion batches"
            on public.ingestion_batches for insert to authenticated
            with check (
                public.current_user_role() in ('data_operator', 'administrator')
                and auth.uid() = uploaded_by
            )
    """
    )


def downgrade() -> None:
    # Drop RLS policies
    op.execute(
        'drop policy if exists "Data operators and admins can create ingestion batches" on public.ingestion_batches'
    )
    op.execute(
        'drop policy if exists "Authenticated users can view ingestion batches" on public.ingestion_batches'
    )
    op.execute(
        'drop policy if exists "Authenticated users can view transactions" on public.transactions'
    )
    op.execute('drop policy if exists "Authenticated users can view accounts" on public.accounts')
    op.execute('drop policy if exists "Authenticated users can view customers" on public.customers')

    # Drop indexes and tables in reverse dependency order
    op.drop_index("idx_txn_batch", table_name="transactions", schema="public")
    op.drop_index("idx_txn_occurred_at", table_name="transactions", schema="public")
    op.drop_index("idx_txn_dest", table_name="transactions", schema="public")
    op.drop_index("idx_txn_origin", table_name="transactions", schema="public")
    op.drop_table("transactions", schema="public")

    op.drop_index("idx_ingestion_batches_status", table_name="ingestion_batches", schema="public")
    op.drop_index("idx_ingestion_batches_user", table_name="ingestion_batches", schema="public")
    op.drop_table("ingestion_batches", schema="public")

    op.drop_index("idx_accounts_status", table_name="accounts", schema="public")
    op.drop_index("idx_accounts_customer", table_name="accounts", schema="public")
    op.drop_table("accounts", schema="public")

    op.drop_index("idx_customers_external_ref", table_name="customers", schema="public")
    op.drop_index("idx_customers_risk_category", table_name="customers", schema="public")
    op.drop_table("customers", schema="public")
