"""explanations and customer_risk_history

Mirrors 03_Backend_Schema.md §6 and §7: explanations and customer_risk_history
tables with all indexes, constraints, and RLS policies.

Revision ID: 0005
Revises: 0004
Create Date: 2026-09-19
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Explanations ─────────────────────────────────────────────────────────
    op.create_table(
        "explanations",
        sa.Column(
            "explanation_id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "prediction_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("public.predictions.prediction_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("top_features", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("narrative_text", sa.Text(), nullable=False),
        sa.Column(
            "generated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("prediction_id", name="uq_explanation_per_prediction"),
        schema="public",
    )
    op.create_index(
        "idx_explanations_prediction", "explanations", ["prediction_id"], schema="public"
    )

    # ── Customer Risk History ────────────────────────────────────────────────
    op.create_table(
        "customer_risk_history",
        sa.Column(
            "history_id",
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
        sa.Column("risk_score", sa.Numeric(5, 4), nullable=False),
        sa.Column("risk_category", sa.String(20), nullable=False),
        sa.Column("reason", sa.String(120)),
        sa.Column(
            "recorded_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        schema="public",
    )
    op.create_index(
        "idx_risk_history_customer",
        "customer_risk_history",
        ["customer_id", sa.text("recorded_at desc")],
        schema="public",
    )

    # ── Row Level Security ───────────────────────────────────────────────────
    for table in ("explanations", "customer_risk_history"):
        op.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;")
        op.execute(f"""
            CREATE POLICY {table}_select_staff ON public.{table}
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.users u
                    JOIN public.roles r ON u.role_id = r.role_id
                    WHERE u.user_id = auth.uid()
                      AND u.is_active = true
                      AND r.role_name IN ('administrator', 'aml_analyst')
                )
            );
        """)
        op.execute(f"""
            CREATE POLICY {table}_service_write ON public.{table}
            FOR ALL
            USING (auth.jwt() ->> 'role' = 'service_role')
            WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
        """)


def downgrade() -> None:
    op.drop_table("customer_risk_history", schema="public")
    op.drop_table("explanations", schema="public")
