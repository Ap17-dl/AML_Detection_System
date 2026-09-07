from app.core.security import get_current_user
from app.main import app
from app.models.role import RoleName
from app.tests.conftest import api_client, make_current_user


async def test_me_returns_the_authenticated_users_profile(fake_session):
    user = make_current_user(RoleName.AML_ANALYST, email="analyst@example.com")

    async with api_client(current_user=user, fake_session=fake_session) as client:
        response = await client.get("/api/v1/auth/me")

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "analyst@example.com"
    assert body["role"] == "aml_analyst"
    assert body["user_id"] == str(user.user_id)


async def test_me_requires_a_bearer_token(fake_session):
    app.dependency_overrides.pop(get_current_user, None)
    async with api_client(current_user=None, fake_session=fake_session) as client:
        response = await client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "missing_token"
