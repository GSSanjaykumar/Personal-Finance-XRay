import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from datetime import datetime, timezone
import mongomock

from backend.app import app
from backend.database.models import UserDocument
from backend.repositories.user_repository import UserRepository

client = TestClient(app)

@pytest.fixture(autouse=True)
def mock_env(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test_client_id")

@pytest.fixture
def test_user(mock_mongo):
    repo = UserRepository()
    user = UserDocument(
        email="existing@example.com",
        password_hash="hashed_password",
        provider="local",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    user_id = repo.save_user(user)
    return repo.find_by_email("existing@example.com")


@patch("backend.api.auth_routes.id_token.verify_oauth2_token")
def test_google_login_new_user(mock_verify, mock_mongo):
    # Mock Google verification
    mock_verify.return_value = {
        "iss": "accounts.google.com",
        "email_verified": True,
        "sub": "google_sub_123",
        "email": "new@example.com",
        "picture": "http://example.com/pic.jpg"
    }

    response = client.post("/api/auth/google", json={"credential": "dummy_token"})
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

    # Verify user was created correctly
    repo = UserRepository()
    user = repo.find_by_google_sub("google_sub_123")
    assert user is not None
    assert user.email == "new@example.com"
    assert user.provider == "google"
    assert user.password_hash is None


@patch("backend.api.auth_routes.id_token.verify_oauth2_token")
def test_google_login_existing_google_user(mock_verify, mock_mongo, test_user):
    # First create a user with google_sub
    repo = UserRepository()
    user = UserDocument(
        email="googleuser@example.com",
        google_sub="existing_google_sub",
        provider="google",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    repo.save_user(user)

    mock_verify.return_value = {
        "iss": "accounts.google.com",
        "email_verified": True,
        "sub": "existing_google_sub",
        "email": "googleuser@example.com"
    }

    response = client.post("/api/auth/google", json={"credential": "dummy_token"})
    assert response.status_code == 200
    assert "access_token" in response.json()

    # Verify no duplicates
    users = list(repo._get_collection().find({"google_sub": "existing_google_sub"}))
    assert len(users) == 1


@patch("backend.api.auth_routes.id_token.verify_oauth2_token")
def test_google_login_link_existing_email_user(mock_verify, mock_mongo, test_user):
    mock_verify.return_value = {
        "iss": "accounts.google.com",
        "email_verified": True,
        "sub": "new_google_sub_for_existing",
        "email": "existing@example.com",
        "picture": "http://example.com/pic2.jpg"
    }

    response = client.post("/api/auth/google", json={"credential": "dummy_token"})
    assert response.status_code == 200

    # Verify account was linked
    repo = UserRepository()
    linked_user = repo.find_by_email("existing@example.com")
    assert linked_user.google_sub == "new_google_sub_for_existing"
    assert linked_user.provider == "local"  # Preserved local provider
    assert linked_user.password_hash == "hashed_password"  # Preserved password


@patch("backend.api.auth_routes.id_token.verify_oauth2_token")
def test_google_login_invalid_issuer(mock_verify, mock_mongo):
    mock_verify.return_value = {
        "iss": "invalid_issuer.com",
        "email_verified": True,
        "sub": "google_sub_123",
        "email": "new@example.com"
    }

    response = client.post("/api/auth/google", json={"credential": "dummy_token"})
    assert response.status_code == 401
    assert "Invalid Google credential" in response.json()["detail"]


@patch("backend.api.auth_routes.id_token.verify_oauth2_token")
def test_google_login_unverified_email(mock_verify, mock_mongo):
    mock_verify.return_value = {
        "iss": "accounts.google.com",
        "email_verified": False,
        "sub": "google_sub_123",
        "email": "new@example.com"
    }

    response = client.post("/api/auth/google", json={"credential": "dummy_token"})
    assert response.status_code == 401


@patch("backend.api.auth_routes.id_token.verify_oauth2_token")
def test_google_login_value_error(mock_verify, mock_mongo):
    mock_verify.side_effect = ValueError("Token expired")
    
    response = client.post("/api/auth/google", json={"credential": "dummy_token"})
    assert response.status_code == 401
    assert "Token expired" in response.json()["detail"]
