"""organizations and strict organization scoping

Revision ID: 0008
Revises: 0007
Create Date: 2026-10-24
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None

DEFAULT_ORG_ID = "a0000000-0000-0000-0000-000000000001"
DEFAULT_ORG_NAME = "Apex Global Bank"
DEFAULT_ORG_SLUG = "apex-global-bank"


def upgrade() -> None:
    # ── 1. Create organizations table ─────────────────────────────────────────
    op.create_table(
        "organizations",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(120), unique=True, nullable=False),
        sa.Column("slug", sa.String(120), unique=True, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint(
            "status IN ('active', 'suspended', 'inactive')",
            name="ck_organizations_status",
        ),
        schema="public",
    )
    op.create_index("idx_organizations_slug", "organizations", ["slug"], schema="public")
    op.create_index("idx_organizations_status", "organizations", ["status"], schema="public")

    # ── 2. Seed default organization for existing data preservation ───────────
    op.execute(
        f"""
        INSERT INTO public.organizations (id, name, slug, status)
        VALUES ('{DEFAULT_ORG_ID}', '{DEFAULT_ORG_NAME}', '{DEFAULT_ORG_SLUG}', 'active')
        ON CONFLICT (id) DO NOTHING;
    """
    )

    # ── 3. Add organization_id to all organization-owned entities ─────────────
    scoped_tables = [
        ("users", "RESTRICT", True),
        ("customers", "CASCADE", True),
        ("accounts", "CASCADE", True),
        ("transactions", "CASCADE", True),
        ("ingestion_batches", "CASCADE", True),
        ("alerts", "CASCADE", True),
        ("predictions", "CASCADE", True),
        ("graph_indicators", "CASCADE", True),
        ("audit_logs", "SET NULL", False),
    ]

    for table, ondelete, not_null in scoped_tables:
        op.add_column(
            table,
            sa.Column(
                "organization_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("public.organizations.id", ondelete=ondelete),
                nullable=True,
            ),
            schema="public",
        )
        # Migrate existing data to default organization
        op.execute(
            f"""
            UPDATE public.{table}
            SET organization_id = '{DEFAULT_ORG_ID}'
            WHERE organization_id IS NULL;
        """
        )
        if not_null:
            op.alter_column(table, "organization_id", nullable=False, schema="public")

        op.create_index(f"idx_{table}_organization_id", table, ["organization_id"], schema="public")

    # ── 4. Atomic Database Trigger for Two-Admin Limit ─────────────────────────
    op.execute(
        """
        CREATE OR REPLACE FUNCTION check_max_two_admins_per_org()
        RETURNS TRIGGER AS $$
        DECLARE
            admin_count INT;
        BEGIN
            IF NEW.is_active = true AND NEW.role_id = 1 THEN
                -- Serialize concurrent checks for the organization
                PERFORM 1 FROM public.organizations WHERE id = NEW.organization_id FOR UPDATE;

                SELECT COUNT(*) INTO admin_count
                FROM public.users
                WHERE organization_id = NEW.organization_id
                  AND role_id = 1
                  AND is_active = true
                  AND user_id != NEW.user_id;

                IF admin_count >= 2 THEN
                    RAISE EXCEPTION 'Organization cannot have more than 2 active administrators.';
                END IF;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute("DROP TRIGGER IF EXISTS trg_check_max_admins ON public.users;")
    op.execute(
        """
        CREATE TRIGGER trg_check_max_admins
        BEFORE INSERT OR UPDATE OF role_id, is_active, organization_id
        ON public.users
        FOR EACH ROW
        EXECUTE FUNCTION check_max_two_admins_per_org();
        """
    )

    # ── 5. RLS Policies on organizations table ────────────────────────────────
    op.execute("ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
        CREATE POLICY organizations_user_read ON public.organizations
        FOR SELECT
        USING (
            id IN (SELECT organization_id FROM public.users WHERE user_id = auth.uid())
            OR auth.jwt() ->> 'role' = 'service_role'
        );
    """
    )
    op.execute(
        """
        CREATE POLICY organizations_admin_update ON public.organizations
        FOR UPDATE
        USING (
            id IN (
                SELECT u.organization_id FROM public.users u
                JOIN public.roles r ON u.role_id = r.role_id
                WHERE u.user_id = auth.uid()
                  AND u.is_active = true
                  AND r.role_name = 'administrator'
            )
        );
    """
    )
    op.execute(
        """
        CREATE POLICY organizations_service_all ON public.organizations
        FOR ALL
        USING (auth.jwt() ->> 'role' = 'service_role')
        WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
    """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_check_max_admins ON public.users;")
    op.execute("DROP FUNCTION IF EXISTS check_max_two_admins_per_org();")

    scoped_tables = [
        "audit_logs",
        "graph_indicators",
        "predictions",
        "alerts",
        "ingestion_batches",
        "transactions",
        "accounts",
        "customers",
        "users",
    ]
    for table in scoped_tables:
        op.drop_index(f"idx_{table}_organization_id", table_name=table, schema="public")
        op.drop_column(table, "organization_id", schema="public")

    op.drop_table("organizations", schema="public")
