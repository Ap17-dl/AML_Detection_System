"""Integration-style tests for the admin user/role endpoints (AML-FR-03).

Each action exercises both the allow path (Administrator) and the deny path (a non-admin role),
matching the RBAC deny/allow matrix requirement for Sprint 1.
"""

import uuid
from datetime import UTC, datetime

from app.core.supabase_admin import get_supabase_admin_client
from app.main import app
from app.models.role import RoleName
from app.models.user import User
from app.tests.conftest import ADMIN, ANALYST, FakeResult, api_client


def _make_user(**overrides) -> User:
    defaults = dict(
        user_id=uuid.uuid4(),
        email="user@example.com",
        full_name="Test User",
        role_id=2,
        is_active=True,
        created_at=datetime.now(UTC),
        last_login_at=None,
    )
    defaults.update(overrides)
    return User(**defaults)


async def test_list_users_allows_administrator(fake_session):
    row = _make_user(email="analyst@example.com")
    fake_session.execute_results.append(FakeResult(rows=[(row, RoleName.AML_ANALYST)]))

    async with api_client(current_user=ADMIN, fake_session=fake_session) as client:
        response = await client.get("/api/v1/users")

    assert response.status_code == 200
    [body] = response.json()
    assert body["email"] == "analyst@example.com"
    assert body["role"] == "aml_analyst"


async def test_list_users_denies_non_administrator(fake_session):
    async with api_client(current_user=ANALYST, fake_session=fake_session) as client:
        response = await client.get("/api/v1/users")

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"


async def test_invite_user_allows_administrator(fake_session):
    fake_session.execute_results.append(FakeResult(scalar=3))  # resolve_role_id("data_operator")

    class FakeAdminClient:
        async def invite_user_by_email(self, email: str, role_id: int) -> dict:
            assert role_id == 3
            return {"id": str(uuid.uuid4()), "email": email}

    app.dependency_overrides[get_supabase_admin_client] = lambda: FakeAdminClient()
    try:
        async with api_client(current_user=ADMIN, fake_session=fake_session) as client:
            response = await client.post(
                "/api/v1/users/invite",
                json={"email": "new.operator@example.com", "role": "data_operator"},
            )
    finally:
        app.dependency_overrides.pop(get_supabase_admin_client, None)

    assert response.status_code == 201
    assert response.json() == {"invited_email": "new.operator@example.com", "role": "data_operator"}
    assert fake_session.committed
    assert len(fake_session.added) == 1  # the audit_logs row


async def test_invite_user_denies_non_administrator(fake_session):
    async with api_client(current_user=ANALYST, fake_session=fake_session) as client:
        response = await client.post(
            "/api/v1/users/invite", json={"email": "x@example.com", "role": "aml_analyst"}
        )

    assert response.status_code == 403


async def test_update_user_role_allows_administrator(fake_session):
    target = _make_user(email="operator@example.com", role_id=3)
    fake_session.get_results[target.user_id] = target
    fake_session.execute_results.append(FakeResult(scalar=1))  # resolve_role_id("administrator")

    async with api_client(current_user=ADMIN, fake_session=fake_session) as client:
        response = await client.patch(
            f"/api/v1/users/{target.user_id}/role", json={"role": "administrator"}
        )

    assert response.status_code == 200
    assert response.json()["role"] == "administrator"
    assert target.role_id == 1
    assert fake_session.committed


async def test_update_user_role_denies_non_administrator(fake_session):
    async with api_client(current_user=ANALYST, fake_session=fake_session) as client:
        response = await client.patch(
            f"/api/v1/users/{uuid.uuid4()}/role", json={"role": "administrator"}
        )

    assert response.status_code == 403


async def test_update_user_role_404_for_unknown_user(fake_session):
    async with api_client(current_user=ADMIN, fake_session=fake_session) as client:
        response = await client.patch(
            f"/api/v1/users/{uuid.uuid4()}/role", json={"role": "administrator"}
        )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "user_not_found"
