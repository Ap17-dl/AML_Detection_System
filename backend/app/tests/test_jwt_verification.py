"""Unit tests for Supabase JWT verification (TRD §4.1, §6.3) — no live Supabase project needed,
tokens are self-signed with a test secret standing in for SUPABASE_JWT_SECRET.
"""

import time

import jwt
import pytest

from app.core.config import get_settings
from app.core.errors import ApiError
from app.core.security import decode_supabase_jwt

TEST_SECRET = "unit-test-supabase-jwt-secret"


@pytest.fixture(autouse=True)
def _configure_jwt_secret(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def _make_token(secret: str, *, audience: str = "authenticated", expires_in: int = 3600) -> str:
    payload = {
        "sub": "11111111-1111-1111-1111-111111111111",
        "aud": audience,
        "role": "authenticated",
        "exp": int(time.time()) + expires_in,
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def test_valid_token_is_accepted():
    claims = decode_supabase_jwt(_make_token(TEST_SECRET))
    assert claims["sub"] == "11111111-1111-1111-1111-111111111111"
    assert claims["aud"] == "authenticated"


def test_expired_token_is_rejected():
    token = _make_token(TEST_SECRET, expires_in=-60)
    with pytest.raises(ApiError) as exc_info:
        decode_supabase_jwt(token)
    assert exc_info.value.status_code == 401


def test_bad_signature_is_rejected():
    token = _make_token("a-completely-different-secret")
    with pytest.raises(ApiError) as exc_info:
        decode_supabase_jwt(token)
    assert exc_info.value.status_code == 401


def test_wrong_audience_is_rejected():
    token = _make_token(TEST_SECRET, audience="not-authenticated")
    with pytest.raises(ApiError) as exc_info:
        decode_supabase_jwt(token)
    assert exc_info.value.status_code == 401
