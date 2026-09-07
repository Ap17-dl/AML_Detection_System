"""roles and users

Mirrors 03_Backend_Schema.md §3 (parts 0, 1, 10.1): extensions, public.roles (seeded),
public.users (1:1 with Supabase auth.users), the handle_new_user() signup trigger,
current_user_role() helper, and RLS policies scoped to these two tables.

Revision ID: 0001
Revises:
Create Date: 2026-09-07
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('create extension if not exists "uuid-ossp"')
    op.execute("create extension if not exists pgcrypto")

    op.create_table(
        "roles",
        sa.Column("role_id", sa.SmallInteger, primary_key=True),
        sa.Column("role_name", sa.String(40), nullable=False, unique=True),
        sa.Column("description", sa.Text),
        schema="public",
    )
    op.execute(
        """
        insert into public.roles (role_id, role_name, description) values
            (1, 'administrator', 'System Administrator with full access, config, and user management privileges'),
            (2, 'aml_analyst', 'AML Compliance Analyst managing alerts, reviews, and case investigations'),
            (3, 'data_operator', 'Data Operator authorized to upload and ingest transaction batches')
        on conflict (role_id) do update set
            role_name = excluded.role_name,
            description = excluded.description
        """
    )

    op.create_table(
        "users",
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("auth.users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("email", sa.String(160), nullable=False, unique=True),
        sa.Column("full_name", sa.String(120)),
        sa.Column(
            "role_id",
            sa.SmallInteger,
            sa.ForeignKey("public.roles.role_id"),
            nullable=False,
            server_default="2",
        ),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column("last_login_at", sa.DateTime(timezone=True)),
        schema="public",
    )
    op.create_index("idx_users_role", "users", ["role_id"], schema="public")
    op.create_index("idx_users_email", "users", ["email"], schema="public")

    op.execute(
        """
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
                coalesce((new.raw_app_meta_data->>'role_id')::smallint, 2)
            )
            on conflict (user_id) do update set
                email = excluded.email,
                full_name = coalesce(excluded.full_name, public.users.full_name),
                updated_at = now();
            return new;
        end;
        $$;
        """
    )
    op.execute("drop trigger if exists on_auth_user_created on auth.users")
    op.execute(
        """
        create trigger on_auth_user_created
            after insert on auth.users
            for each row execute function public.handle_new_user()
        """
    )

    op.execute(
        """
        create or replace function public.current_user_role()
        returns varchar(40)
        language sql stable security definer
        as $$
            select r.role_name
            from public.users u
            join public.roles r on u.role_id = r.role_id
            where u.user_id = auth.uid();
        $$;
        """
    )

    op.execute("alter table public.roles enable row level security")
    op.execute("alter table public.users enable row level security")

    op.execute(
        """
        create policy "Authenticated users can read roles"
            on public.roles for select
            to authenticated
            using (true)
        """
    )
    op.execute(
        """
        create policy "Users can read own profile or admin can read all"
            on public.users for select
            to authenticated
            using (auth.uid() = user_id or public.current_user_role() = 'administrator')
        """
    )
    op.execute(
        """
        create policy "Admins can update users"
            on public.users for update
            to authenticated
            using (public.current_user_role() = 'administrator')
            with check (public.current_user_role() = 'administrator')
        """
    )


def downgrade() -> None:
    op.execute('drop policy if exists "Admins can update users" on public.users')
    op.execute(
        'drop policy if exists "Users can read own profile or admin can read all" on public.users'
    )
    op.execute('drop policy if exists "Authenticated users can read roles" on public.roles')

    op.execute("drop function if exists public.current_user_role()")
    op.execute("drop trigger if exists on_auth_user_created on auth.users")
    op.execute("drop function if exists public.handle_new_user()")

    op.drop_index("idx_users_email", table_name="users", schema="public")
    op.drop_index("idx_users_role", table_name="users", schema="public")
    op.drop_table("users", schema="public")
    op.drop_table("roles", schema="public")
