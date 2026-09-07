"""audit logs

Mirrors 03_Backend_Schema.md §3.9 (audit_logs) and §10.4 (its RLS policies). Pulled forward
from its Sprint 6 slot in 05_Implementation_Plan.md because Sprint 1 already performs
audit-worthy actions (user invites, role changes) that must never go unlogged.

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-07
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "audit_logs",
        sa.Column(
            "audit_id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("public.users.user_id", ondelete="SET NULL"),
        ),
        sa.Column("action", sa.String(80), nullable=False),
        sa.Column("entity_type", sa.String(40)),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True)),
        sa.Column("details", postgresql.JSONB),
        sa.Column("ip_address", postgresql.INET),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        schema="public",
    )
    op.create_index("idx_audit_user", "audit_logs", ["user_id"], schema="public")
    op.create_index("idx_audit_action", "audit_logs", ["action"], schema="public")
    op.create_index("idx_audit_created_at", "audit_logs", ["created_at"], schema="public")

    op.execute("alter table public.audit_logs enable row level security")
    op.execute(
        """
        create policy "Admins can view audit logs"
            on public.audit_logs for select to authenticated
            using (public.current_user_role() = 'administrator')
        """
    )
    op.execute(
        """
        create policy "Authenticated users can insert audit logs"
            on public.audit_logs for insert to authenticated
            with check (auth.uid() = user_id or user_id is null)
        """
    )


def downgrade() -> None:
    op.execute(
        'drop policy if exists "Authenticated users can insert audit logs" on public.audit_logs'
    )
    op.execute('drop policy if exists "Admins can view audit logs" on public.audit_logs')
    op.drop_index("idx_audit_created_at", table_name="audit_logs", schema="public")
    op.drop_index("idx_audit_action", table_name="audit_logs", schema="public")
    op.drop_index("idx_audit_user", table_name="audit_logs", schema="public")
    op.drop_table("audit_logs", schema="public")
