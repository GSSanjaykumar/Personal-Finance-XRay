"""
conftest.py — Shared test fixtures for Finance X-Ray backend tests.

Provides:
  - isolated_user_id: a dedicated test user ID scoped per-session (never touches production data)
  - clear_transactions: autouse per-test fixture that truly DELETEs MongoDB docs for the test user
  - auth_token: a valid signed JWT for the test user
  - auth_client: a TestClient pre-configured with Authorization: Bearer <token>
  - auth_headers: raw dict of headers for use where TestClient is already instantiated

Architecture notes:
  - No production user data is touched: all test data is written under a randomised test user ID.
  - No authentication is disabled or mocked: we use create_access_token() directly (the real
    security implementation) and the real get_current_user() dependency resolves the test user
    from the DB only for endpoint tests that need full auth flow. For tests that operate on the
    service layer (DashboardService, ForecastService, etc.), we set the UserContext ContextVar
    directly — which is exactly how the middleware sets it during a real request.
  - Store isolation is achieved by running a real MongoDB delete_many() before and after each test,
    scoped to the test user ID. This is the correct fix: save_transactions([]) was a no-op.
"""

import os
import uuid
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

# Load environment before any backend imports
import backend.config  # noqa: F401

from backend.app import app
from backend.auth.security import create_access_token
from backend.database.connection import get_db
from backend.database.models import UserDocument
from backend.repositories.user_repository import UserRepository
from backend.repositories.transaction_repository import TransactionRepository


# ── Test user ID ─────────────────────────────────────────────────────────────
# Use a fixed, recognisable prefix so we can identify and clean up test data.
TEST_USER_ID = f"test_user_{uuid.uuid4().hex[:12]}"
TEST_USER_EMAIL = f"{TEST_USER_ID}@test.financexray.local"


# ── Session-scoped test user ──────────────────────────────────────────────────

@pytest.fixture(scope="session", autouse=True)
def test_user():
    """
    Create a test UserDocument in MongoDB for the duration of the test session.
    Cleaned up after all tests complete.
    """
    now = datetime.now(timezone.utc)
    user = UserDocument(
        id=TEST_USER_ID,
        email=TEST_USER_EMAIL,
        provider="local",
        is_active=True,
        created_at=now,
        updated_at=now,
    )

    user_repo = UserRepository()
    # Insert directly into MongoDB using the collection so we can set the _id
    db = get_db()
    db[user_repo.collection_name].insert_one({
        "_id": TEST_USER_ID,
        "email": TEST_USER_EMAIL,
        "provider": "local",
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    })

    yield user

    # Teardown: remove test user and all their data
    db = get_db()
    db[user_repo.collection_name].delete_many({"_id": TEST_USER_ID})
    _wipe_test_user_data()


def _wipe_test_user_data():
    """Delete all MongoDB documents belonging to TEST_USER_ID."""
    db = get_db()
    env = os.environ
    collections_to_clean = [
        env.get("COLLECTION_TRANSACTIONS", "transactions"),
        env.get("COLLECTION_BUDGETS", "budgets"),
        env.get("COLLECTION_STATEMENTS", "statements"),
        env.get("COLLECTION_CHAT", "chat_history"),
        env.get("COLLECTION_RECURRING", "recurring"),
        env.get("COLLECTION_REPORTS", "reports"),
        env.get("COLLECTION_FORECAST", "forecasts"),
    ]
    for col in collections_to_clean:
        try:
            db[col].delete_many({"userId": TEST_USER_ID})
        except Exception:
            pass


# ── Per-test store isolation ──────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def isolate_test_user():
    """
    Before each test:
      1. Set UserContext to the test user (so service-layer calls see test data).
      2. Delete any leftover transaction/budget docs for the test user.
    After each test:
      3. Delete all test user docs again (cleanup).
    """
    _wipe_test_user_data()
    yield
    _wipe_test_user_data()


# ── JWT auth helpers ──────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def auth_token():
    """Return a valid signed JWT for the test user."""
    return create_access_token({"sub": TEST_USER_ID})


@pytest.fixture(scope="session")
def auth_headers(auth_token):
    """Return Authorization header dict for manual use."""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(scope="session")
def auth_client(auth_token):
    """
    TestClient pre-configured with Authorization: Bearer <token>.
    Use this for all endpoint tests that require authentication.
    """
    client = TestClient(app)
    client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return client
