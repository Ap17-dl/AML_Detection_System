"""alerts, case_notes, and analyst_feedback

Mirrors 03_Backend_Schema.md §8: alerts, case_notes, and analyst_feedback
tables with all indexes, constraints, and RLS policies.

Revision ID: 0007
Revises: 0006
Create Date: 2026-09-19
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Alerts ───────────────────────────────────────────────────────────────
    op.create_table(
        "alerts",
        sa.Column(
            "alert_id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "customer_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("public.customers.customer_id", ondelete="SET NULL"),
        ),
        sa.Column(
            "triggering_transaction_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("public.transactions.transaction_id", ondelete="SET NULL"),
        ),
        sa.Column(
            "prediction_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("public.predictions.prediction_id", ondelete="SET NULL"),
        ),
        sa.Column("risk_category", sa.String(20), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="open"),
        sa.Column(
            "assigned_to",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("public.users.user_id", ondelete="SET NULL"),
        ),
        sa.Column("outcome", sa.String(30)),
        sa.Column("threshold_config_used", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("closed_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("status IN ('open', 'in_progress', 'closed')", name="chk_alerts_status"),
        sa.CheckConstraint(
            "outcome IS NULL OR outcome IN ('confirmed_suspicious', 'false_positive', 'further_investigation')",
            name="chk_alerts_outcome",
        ),
        schema="public",
    )
    op.create_index("idx_alerts_status", "alerts", ["status"], schema="public")
    op.create_index("idx_alerts_assigned", "alerts", ["assigned_to"], schema="public")
    op.create_index("idx_alerts_customer", "alerts", ["customer_id"], schema="public")
    op.create_index("idx_alerts_created_at", "alerts", ["created_at"], schema="public")

    # ── Case Notes ───────────────────────────────────────────────────────────
    op.create_table(
        "case_notes",
        sa.Column(
            "note_id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "alert_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("public.alerts.alert_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "author_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("public.users.user_id"),
            nullable=False,
        ),
        sa.Column("note_text", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        schema="public",
    )
    op.create_index("idx_case_notes_alert", "case_notes", ["alert_id"], schema="public")

    # ── Analyst Feedback ─────────────────────────────────────────────────────
    op.create_table(
        "analyst_feedback",
        sa.Column(
            "feedback_id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "alert_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("public.alerts.alert_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "analyst_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("public.users.user_id"),
            nullable=False,
        ),
        sa.Column("outcome_label", sa.String(30), nullable=False),
        sa.Column("feedback_notes", sa.Text()),
        sa.Column("explanation_quality_rating", sa.SmallInteger()),
        sa.Column(
            "submitted_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("reviewed_for_retraining", sa.Boolean(), nullable=False, server_default="false"),
        sa.CheckConstraint(
            "explanation_quality_rating IS NULL OR (explanation_quality_rating >= 1 AND explanation_quality_rating <= 5)",
            name="chk_feedback_quality_rating",
        ),
        schema="public",
    )
    op.create_index("idx_feedback_alert", "analyst_feedback", ["alert_id"], schema="public")
    op.create_index(
        "idx_feedback_reviewed", "analyst_feedback", ["reviewed_for_retraining"], schema="public"
    )

    # ── Row Level Security ───────────────────────────────────────────────────
    for table in ("alerts", "case_notes", "analyst_feedback"):
        op.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;")
        op.execute(
            f"""
            CREATE POLICY {table}_staff_all ON public.{table}
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.users u
                    JOIN public.roles r ON u.role_id = r.role_id
                    WHERE u.user_id = auth.uid()
                      AND u.is_active = true
                      AND r.role_name IN ('administrator', 'aml_analyst')
                )
            );
        """
        )
        op.execute(
            f"""
            CREATE POLICY {table}_service_write ON public.{table}
            FOR ALL
            USING (auth.jwt() ->> 'role' = 'service_role')
            WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
        """
        )


def downgrade() -> None:
    op.drop_table("analyst_feedback", schema="public")
    op.drop_table("case_notes", schema="public")
    op.drop_table("alerts", schema="public")
