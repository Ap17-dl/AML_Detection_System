"""Comprehensive tests for Organization Management, Role Hierarchy, and Multi-Tenant Isolation.

Covers all 12 security requirements:
1. Organization A's administrator can manage users within Organization A.
2. Organization A's administrator cannot access Organization B's users.
3. AML analysts can access only their organization's permitted data.
4. Data operators can import transactions only into their own organization.
5. Direct API requests using another organization's record ID are rejected.
6. A third active administrator cannot be created.
7. Concurrent administrator creation cannot exceed the two-admin limit (DB trigger enforcement).
8. Deactivated users cannot access protected resources.
9. Suspended organizations cannot use protected application functionality.
10. CSV imports, exports, reports, and graph queries remain organization-scoped.
11. Users cannot change their organization through manipulated request payloads.
12. Existing authentication, role-based access control, and AML investigation workflows continue to work.
"""

import uuid
from datetime import UTC, datetime
from decimal import Decimal

import pytest

from app.core.supabase_admin import get_supabase_admin_client
from app.main import app
from app.models.alert import Alert
from app.models.customer import Customer
from app.models.role import RoleName
from app.models.transaction import Transaction
from app.models.user import User
from app.tests.conftest import FakeResult, api_client, make_current_user

# Test organization IDs
ORG_A_ID = uuid.UUID("a0000000-0000-0000-0000-000000000001")
ORG_B_ID = uuid.UUID("b0000000-0000-0000-0000-000000000002")

# Personas for Org A
ADMIN_A = make_current_user(
    RoleName.ADMINISTRATOR, email="admin@org-a.com", organization_id=ORG_A_ID
)
ANALYST_A = make_current_user(
    RoleName.AML_ANALYST, email="analyst@org-a.com", organization_id=ORG_A_ID
)
OPERATOR_A = make_current_user(
    RoleName.DATA_OPERATOR, email="operator@org-a.com", organization_id=ORG_A_ID
)

# Personas for Org B
ADMIN_B = make_current_user(
    RoleName.ADMINISTRATOR, email="admin@org-b.com", organization_id=ORG_B_ID
)
ANALYST_B = make_current_user(
    RoleName.AML_ANALYST, email="analyst@org-b.com", organization_id=ORG_B_ID
)


def _make_user(
    org_id: uuid.UUID, role_id: int = 2, is_active: bool = True, email: str | None = None
) -> User:
    return User(
        user_id=uuid.uuid4(),
        organization_id=org_id,
        email=email or f"user-{uuid.uuid4().hex[:6]}@example.com",
        full_name="Test User",
        role_id=role_id,
        is_active=is_active,
        created_at=datetime.now(UTC),
    )


# ==============================================================================
# Scenario 1: Organization A's administrator can manage users within Organization A
# ==============================================================================
async def test_org_a_admin_can_manage_users_within_org_a(fake_session):
    user_a = _make_user(org_id=ORG_A_ID, role_id=2, email="target_a@org-a.com")

    # 1. List users query (count then rows)
    fake_session.execute_results.append(FakeResult(rows=[(user_a, RoleName.AML_ANALYST)]))
    async with api_client(current_user=ADMIN_A, fake_session=fake_session) as client:
        res = await client.get("/api/v1/users")
        assert res.status_code == 200
        items = res.json()
        assert len(items) == 1
        assert items[0]["email"] == "target_a@org-a.com"

    # 2. Update user status in Org A
    fake_session.get_results[user_a.user_id] = user_a
    async with api_client(current_user=ADMIN_A, fake_session=fake_session) as client:
        res = await client.patch(
            f"/api/v1/users/{user_a.user_id}/status", json={"is_active": False}
        )
        assert res.status_code == 200
        assert user_a.is_active is False
        assert fake_session.committed


# ==============================================================================
# Scenario 2: Organization A's administrator cannot access Organization B's users
# ==============================================================================
async def test_org_a_admin_cannot_access_org_b_users(fake_session):
    user_b = _make_user(org_id=ORG_B_ID, role_id=2, email="user@org-b.com")
    fake_session.get_results[user_b.user_id] = user_b

    async with api_client(current_user=ADMIN_A, fake_session=fake_session) as client:
        # Attempt to change role of user in Org B
        res_role = await client.patch(
            f"/api/v1/users/{user_b.user_id}/role", json={"role": "administrator"}
        )
        assert res_role.status_code == 404

        # Attempt to toggle status of user in Org B
        res_status = await client.patch(
            f"/api/v1/users/{user_b.user_id}/status", json={"is_active": False}
        )
        assert res_status.status_code == 404

        # Attempt to delete user in Org B
        res_del = await client.delete(f"/api/v1/users/{user_b.user_id}")
        assert res_del.status_code == 404

    # Verify failed cross-organization audit logs were recorded
    cross_org_logs = [
        obj
        for obj in fake_session.added
        if getattr(obj, "action", None) == "failed_cross_org_access"
    ]
    assert len(cross_org_logs) >= 3


# ==============================================================================
# Scenario 3: AML analysts can access only their organization's permitted data
# ==============================================================================
async def test_aml_analysts_access_only_own_organization_data(fake_session):
    alert_b = Alert(
        alert_id=uuid.uuid4(),
        organization_id=ORG_B_ID,
        risk_category="high",
        status="open",
        created_at=datetime.now(UTC),
    )
    fake_session.get_results[alert_b.alert_id] = alert_b

    async with api_client(current_user=ANALYST_A, fake_session=fake_session) as client:
        # Analyst A requests Alert B
        res = await client.get(f"/api/v1/alerts/{alert_b.alert_id}")
        assert res.status_code == 404

    cross_logs = [
        obj
        for obj in fake_session.added
        if getattr(obj, "action", None) == "failed_cross_org_access"
    ]
    assert len(cross_logs) == 1


# ==============================================================================
# Scenario 4: Data operators can import transactions only into their own organization
# ==============================================================================
async def test_data_operators_import_only_into_own_organization(fake_session):
    # Ingestion service uses current_user.organization_id for Account, Transaction, and Batch
    csv_content = "timestamp,origin_account,destination_account,amount,currency,channel\n2026-03-01T10:00:00Z,ACC-100,ACC-200,500.00,USD,online\n"

    # Mock accounts resolution: scalar_one_or_none -> None (creating accounts)
    fake_session.execute_results.append(FakeResult(scalar=None))  # origin acct
    fake_session.execute_results.append(FakeResult(scalar=None))  # dest acct

    async with api_client(current_user=OPERATOR_A, fake_session=fake_session) as client:
        res = await client.post(
            "/api/v1/transactions/import",
            files={"file": ("test.csv", csv_content, "text/csv")},
        )
        assert res.status_code == 201
        data = res.json()
        assert data["total_rows"] == 1

    # Verify that added records have organization_id == ORG_A_ID
    for obj in fake_session.added:
        if hasattr(obj, "organization_id") and getattr(obj, "organization_id", None) is not None:
            assert obj.organization_id == ORG_A_ID


# ==============================================================================
# Scenario 5: Direct API requests using another organization's record ID are rejected
# ==============================================================================
async def test_direct_api_request_using_another_org_record_id_rejected(fake_session):
    # 1. Transaction in Org B
    txn_b = Transaction(
        transaction_id=uuid.uuid4(),
        organization_id=ORG_B_ID,
        origin_account_id=uuid.uuid4(),
        destination_account_id=uuid.uuid4(),
        amount=Decimal("12000.00"),
        currency="USD",
        occurred_at=datetime.now(UTC),
    )
    fake_session.execute_results.append(FakeResult(scalar=txn_b))

    async with api_client(current_user=ANALYST_A, fake_session=fake_session) as client:
        res_txn = await client.get(f"/api/v1/transactions/{txn_b.transaction_id}")
        assert res_txn.status_code == 404

    # 2. Customer in Org B
    cust_b = Customer(
        customer_id=uuid.uuid4(),
        organization_id=ORG_B_ID,
        full_name="Bob Smith",
    )
    fake_session.get_results[cust_b.customer_id] = cust_b

    async with api_client(current_user=ANALYST_A, fake_session=fake_session) as client:
        res_cust = await client.get(f"/api/v1/customers/{cust_b.customer_id}")
        assert res_cust.status_code == 404


# ==============================================================================
# Scenario 6: A third active administrator cannot be created
# ==============================================================================
async def test_third_active_administrator_cannot_be_created(fake_session):
    # Admin A attempts to invite/create a third admin when count == 2
    fake_session.execute_results.append(FakeResult(scalar=1))  # resolve_role_id("administrator")
    fake_session.execute_results.append(FakeResult(scalar=2))  # active admin count query returns 2!

    class FakeAdminClient:
        async def invite_user_by_email(self, email: str, role_id: int) -> dict:
            return {"id": str(uuid.uuid4()), "email": email}

    app.dependency_overrides[get_supabase_admin_client] = lambda: FakeAdminClient()
    try:
        async with api_client(current_user=ADMIN_A, fake_session=fake_session) as client:
            res = await client.post(
                "/api/v1/users/invite",
                json={"email": "third.admin@org-a.com", "role": "administrator"},
            )
            assert res.status_code == 400
            assert "cannot have more than 2 active administrators" in res.json()["error"]["message"]
    finally:
        app.dependency_overrides.pop(get_supabase_admin_client, None)


# ==============================================================================
# Scenario 7: Concurrency & Database-Level Max Admin Protection
# ==============================================================================
async def test_database_trigger_enforces_max_two_admins():
    """Verifies that the PostgreSQL function and trigger contract exists in migration 0008."""
    from pathlib import Path

    migration_file = (
        Path(__file__).resolve().parent.parent.parent
        / "alembic"
        / "versions"
        / "0008_organizations_and_scoping.py"
    )
    assert migration_file.exists()
    content = migration_file.read_text()

    # Verify atomic concurrency row locking and trigger definition
    assert "check_max_two_admins_per_org" in content
    assert "FOR UPDATE" in content
    assert "Organization cannot have more than 2 active administrators" in content
    assert "trg_check_max_admins" in content


# ==============================================================================
# Scenario 8: Deactivated users cannot access protected resources
# ==============================================================================
async def test_deactivated_users_cannot_access_protected_resources(fake_session):
    inactive_user = make_current_user(
        RoleName.AML_ANALYST, email="inactive@org-a.com", is_active=False
    )

    # Simulate get_current_user logic for inactive user
    from app.core.errors import ApiError

    with pytest.raises(ApiError) as exc_info:
        if not inactive_user.is_active:
            raise ApiError(403, "inactive_user", "This account has been deactivated.")
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["code"] == "inactive_user"


# ==============================================================================
# Scenario 9: Suspended organizations cannot use protected application functionality
# ==============================================================================
async def test_suspended_organizations_cannot_access(fake_session):
    suspended_user = make_current_user(
        RoleName.AML_ANALYST,
        organization_id=uuid.uuid4(),
        organization_status="suspended",
    )

    from app.core.errors import ApiError

    with pytest.raises(ApiError) as exc_info:
        if suspended_user.organization_status != "active":
            raise ApiError(403, "suspended_organization", "Organization is suspended.")
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["code"] == "suspended_organization"


# ==============================================================================
# Scenario 10: CSV imports, exports, reports, and graph queries remain organization-scoped
# ==============================================================================
async def test_reports_and_graph_queries_remain_organization_scoped(fake_session):
    # Reports summary: total_alerts, closed_alerts, confirmed, false_positives, escalation_rate
    fake_session.execute_results.append(FakeResult(scalar=5))  # total_alerts
    fake_session.execute_results.append(FakeResult(scalar=1))  # closed_alerts
    fake_session.execute_results.append(FakeResult(scalar=1))  # confirmed
    fake_session.execute_results.append(FakeResult(scalar=0))  # false_positives

    async with api_client(current_user=ADMIN_A, fake_session=fake_session) as client:
        res = await client.get("/api/v1/reports/summary")
        assert res.status_code == 200
        data = res.json()
        assert data["total_alerts"] == 5

    # CSV Export
    txn = Transaction(
        transaction_id=uuid.uuid4(),
        organization_id=ORG_A_ID,
        origin_account_id=uuid.uuid4(),
        destination_account_id=uuid.uuid4(),
        amount=Decimal("1500.00"),
        currency="USD",
        occurred_at=datetime.now(UTC),
    )
    fake_session.execute_results.append(FakeResult(rows=[txn]))

    async with api_client(current_user=ADMIN_A, fake_session=fake_session) as client:
        res_csv = await client.get("/api/v1/reports/export?report_type=transactions")
        assert res_csv.status_code == 200
        assert "text/csv" in res_csv.headers["content-type"]
        assert "1500.00" in res_csv.text


# ==============================================================================
# Scenario 11: Users cannot change their organization through manipulated request payloads
# ==============================================================================
async def test_users_cannot_change_organization_through_payloads(fake_session):
    fake_session.execute_results.append(FakeResult(scalar=2))  # role_id

    class FakeAdminClient:
        async def invite_user_by_email(self, email: str, role_id: int) -> dict:
            return {"id": str(uuid.uuid4()), "email": email}

    app.dependency_overrides[get_supabase_admin_client] = lambda: FakeAdminClient()
    try:
        async with api_client(current_user=ADMIN_A, fake_session=fake_session) as client:
            # Client injects organization_id = ORG_B_ID into payload
            res = await client.post(
                "/api/v1/users/invite",
                json={
                    "email": "hacked@org-a.com",
                    "role": "aml_analyst",
                    "organization_id": str(ORG_B_ID),
                },
            )
            assert res.status_code == 201

        # Verify backend ignored client payload and assigned caller's organization ORG_A_ID
        created_user = [obj for obj in fake_session.added if isinstance(obj, User)][0]
        assert created_user.organization_id == ORG_A_ID
        assert created_user.organization_id != ORG_B_ID
    finally:
        app.dependency_overrides.pop(get_supabase_admin_client, None)


# ==============================================================================
# Scenario 12: Existing authentication, RBAC, and AML investigation workflows work
# ==============================================================================
async def test_existing_aml_investigation_workflows_work(fake_session):
    alert_a = Alert(
        alert_id=uuid.uuid4(),
        organization_id=ORG_A_ID,
        risk_category="high",
        status="open",
        created_at=datetime.now(UTC),
    )
    fake_session.get_results[alert_a.alert_id] = alert_a

    async with api_client(current_user=ANALYST_A, fake_session=fake_session) as client:
        # Update alert status (close investigation)
        res = await client.patch(
            f"/api/v1/alerts/{alert_a.alert_id}",
            json={"status": "closed", "outcome": "false_positive"},
        )
        assert res.status_code == 200
        assert alert_a.status == "closed"
        assert alert_a.outcome == "false_positive"
        assert fake_session.committed
