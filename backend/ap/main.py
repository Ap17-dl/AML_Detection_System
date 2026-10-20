"""Alias module for app.main so both `uvicorn app.main:app` and `uvicorn ap.main:app` work."""

from app.main import app, create_app

__all__ = ["app", "create_app"]
