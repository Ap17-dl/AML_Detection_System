"""model_metadata and predictions

Mirrors 03_Backend_Schema.md §4: model_metadata and predictions tables with all
indexes, constraints, and RLS policies.

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-19
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Model Metadata ────────────────────────────────────────────────────────
    op.create_table(
        "model_metadata",
        sa.Column("model_version", sa.String(40), primary_key=True),
        sa.Column("algorithm", sa.String(60), nullable=False),
        sa.Column("trained_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("training_dataset", sa.String(160)),
        sa.Column("precision_score", sa.Numeric(5, 4)),
        sa.Column("recall_score", sa.Numeric(5, 4)),
        sa.Column("f1_score", sa.Numeric(5, 4)),
        sa.Column("pr_auc", sa.Numeric(5, 4)),
        sa.Column("roc_auc", sa.Numeric(5, 4)),
        sa.Column("false_positive_rate", sa.Numeric(5, 4)),
        sa.Column("false_negative_rate", sa.Numeric(5, 4)),
        sa.Column("threshold_low_max", sa.Numeric(5, 4), nullable=False, server_default="0.30"),
        sa.Column("threshold_medium_max", sa.Numeric(5, 4), nullable=False, server_default="0.70"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("artifact_path", sa.Text(), nullable=False),
        sa.Column(
            "created_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("public.users.user_id", ondelete="SET NULL"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        schema="public",
    )
    op.create_index("idx_model_metadata_active", "model_metadata", ["is_active"], schema="public")

    # ── Predictions ───────────────────────────────────────────────────────────
    op.create_table(
        "predictions",
        sa.Column(
            "prediction_id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "transaction_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("public.transactions.transaction_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "model_version",
            sa.String(40),
            sa.ForeignKey("public.model_metadata.model_version"),
            nullable=False,
        ),
        sa.Column("risk_probability", sa.Numeric(6, 5), nullable=False),
        sa.Column("risk_category", sa.String(20), nullable=False),
        sa.Column("graph_risk_component", sa.Numeric(6, 5)),
        sa.Column("combined_risk_score", sa.Numeric(6, 5)),
        sa.Column(
            "predicted_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint(
            "risk_probability >= 0 AND risk_probability <= 1",
            name="chk_predictions_probability_range",
        ),
        sa.CheckConstraint(
            "risk_category IN ('low', 'medium', 'high')",
            name="chk_predictions_risk_category",
        ),
        sa.UniqueConstraint("transaction_id", "model_version", name="uq_prediction_per_txn_model"),
        schema="public",
    )
    op.create_index("idx_predictions_txn", "predictions", ["transaction_id"], schema="public")
    op.create_index("idx_predictions_category", "predictions", ["risk_category"], schema="public")
    op.create_index(
        "idx_predictions_predicted_at", "predictions", ["predicted_at"], schema="public"
    )

    # ── Row Level Security ───────────────────────────────────────────────────
    for table in ("model_metadata", "predictions"):
        op.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;")
        op.execute(
            f"""
            CREATE POLICY {table}_select_staff ON public.{table}
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.users u
                    JOIN public.roles r ON u.role_id = r.role_id
                    WHERE u.user_id = auth.uid()
                      AND u.is_active = true
                      AND r.role_name IN ('administrator', 'aml_analyst', 'data_operator')
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
    op.drop_table("predictions", schema="public")
    op.drop_table("model_metadata", schema="public")
