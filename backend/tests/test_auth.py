import pytest
from fastapi.testclient import TestClient
from datetime import timedelta
import os

from backend.app import app
from backend.auth.security import create_access_token

client = TestClient(app)

def test_register_and_login(mock_mongo):
    # Test registration
    response = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "securepassword123"
    })
    assert response.status_code == 201
    assert "access_token" in response.json()
    
    # Test duplicate email registration
    response = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "anotherpassword"
    })
    assert response.status_code == 409
    
    # Test login
    response = client.post("/api/auth/login", data={
        "username": "test@example.com",
        "password": "securepassword123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
    
    token = response.json()["access_token"]
    
    # Test /auth/me
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"

def test_unauthorized_access(mock_mongo):
    # Try accessing protected route without token
    response = client.get("/dashboard")
    assert response.status_code == 401

def test_invalid_jwt(mock_mongo):
    response = client.get("/dashboard", headers={"Authorization": "Bearer invalid.token.here"})
    assert response.status_code == 401
    
def test_expired_jwt(mock_mongo):
    # Generate an expired token
    expired_token = create_access_token(data={"sub": "some_user_id"}, expires_delta=timedelta(seconds=-10))
    response = client.get("/dashboard", headers={"Authorization": f"Bearer {expired_token}"})
    assert response.status_code == 401
