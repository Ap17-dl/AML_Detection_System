"""graph_indicators

Mirrors 03_Backend_Schema.md §5: graph_indicators table with all
indexes, constraints, and RLS policies.

Revision ID: 0006
Revises: 0005
Create Date: 2026-09-19
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "graph_indicators",
        sa.Column(
            "indicator_id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "account_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("public.accounts.account_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "computed_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("window_start", sa.DateTime(timezone=True)),
        sa.Column("window_end", sa.DateTime(timezone=True)),
        sa.Column("in_degree", sa.Integer(), server_default="0"),
        sa.Column("out_degree", sa.Integer(), server_default="0"),
        sa.Column("txn_velocity", sa.Numeric(10, 4)),
        sa.Column("fan_in_ratio", sa.Numeric(6, 4)),
        sa.Column("fan_out_ratio", sa.Numeric(6, 4)),
        sa.Column("is_in_cycle", sa.Boolean(), server_default="false"),
        sa.Column("cycle_length", sa.Integer()),
        sa.Column("neighborhood_risk_score", sa.Numeric(6, 5)),
        sa.Column("graph_snapshot_id", postgresql.UUID(as_uuid=True)),
        schema="public",
    )
    op.create_index("idx_graph_account", "graph_indicators", ["account_id"], schema="public")
    op.create_index(
        "idx_graph_snapshot", "graph_indicators", ["graph_snapshot_id"], schema="public"
    )
    op.create_index("idx_graph_cycle", "graph_indicators", ["is_in_cycle"], schema="public")

    # ── Row Level Security ───────────────────────────────────────────────────
    op.execute("ALTER TABLE public.graph_indicators ENABLE ROW LEVEL SECURITY;")
    op.execute("""
        CREATE POLICY graph_indicators_select_staff ON public.graph_indicators
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
    op.execute("""
        CREATE POLICY graph_indicators_service_write ON public.graph_indicators
        FOR ALL
        USING (auth.jwt() ->> 'role' = 'service_role')
        WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
    """)


def downgrade() -> None:
    op.drop_table("graph_indicators", schema="public")
