"""Shared test doubles: fake DB session + an httpx client wired to override auth/db deps.

No live Postgres/Supabase project is required to run these tests — the FakeSession stands in
for AsyncSession, scripted per test with the exact rows the endpoint under test will fetch.
"""

import os
import uuid
from contextlib import asynccontextmanager

# Test-only defaults so importing the app never requires a live Supabase project or database —
# every test either doesn't touch these dependencies or overrides them (see FakeSession, api_client
# below). Must be set before `app.db.session` is imported anywhere in the chain.
os.environ.setdefault(
    "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"
)
os.environ.setdefault("SUPABASE_URL", "http://localhost:54321")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-only-secret")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-only-service-role-key")

import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.core.security import CurrentUser, get_current_user  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.role import RoleName  # noqa: E402


def make_current_user(role_name: str, *, email: str | None = None) -> CurrentUser:
    return CurrentUser(
        user_id=uuid.uuid4(),
        email=email or f"{role_name}@example.com",
        role_name=role_name,
        full_name=None,
        is_active=True,
    )


ADMIN = make_current_user(RoleName.ADMINISTRATOR)
ANALYST = make_current_user(RoleName.AML_ANALYST)
OPERATOR = make_current_user(RoleName.DATA_OPERATOR)


class FakeResult:
    """Mimics the slice of sqlalchemy's Result object the app actually calls."""

    def __init__(self, rows: list | None = None, scalar=None):
        self._rows = rows or []
        self._scalar = scalar

    def all(self):
        return self._rows

    def first(self):
        return self._rows[0] if self._rows else None

    def scalar_one_or_none(self):
        return self._scalar


class FakeSession:
    """Scripted stand-in for AsyncSession: queue up results before each call under test."""

    def __init__(self):
        self.execute_results: list[FakeResult] = []
        self.get_results: dict = {}
        self.added: list = []
        self.committed = False

    async def execute(self, _stmt) -> FakeResult:
        return self.execute_results.pop(0)

    async def get(self, _model, obj_id):
        return self.get_results.get(obj_id)

    def add(self, obj) -> None:
        self.added.append(obj)

    async def commit(self) -> None:
        self.committed = True

    async def refresh(self, _obj) -> None:
        pass


@pytest.fixture
def fake_session() -> FakeSession:
    return FakeSession()


@asynccontextmanager
async def api_client(*, current_user: CurrentUser | None, fake_session: FakeSession):
    """An AsyncClient hitting the real FastAPI app with auth/db dependencies overridden."""
    if current_user is not None:
        app.dependency_overrides[get_current_user] = lambda: current_user

    async def _get_db_override():
        yield fake_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            yield client
    finally:
        app.dependency_overrides.clear()
