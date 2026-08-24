from tests.conftest import TEST_USER_ID
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from pymongo.errors import PyMongoError
from backend.app import app

client = TestClient(app)

@patch('backend.database.connection.get_client')
def test_health_endpoint_healthy(mock_get_client):
    mock_get_client.return_value.admin.command.return_value = {"ok": 1}
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

@patch('backend.database.connection.get_client')
def test_health_endpoint_degraded(mock_get_client):
    mock_get_client.return_value.admin.command.side_effect = Exception("DB offline")
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "degraded"

@patch('backend.database.connection.get_client')
def test_ready_endpoint_ready(mock_get_client):
    mock_get_client.return_value.admin.command.return_value = {"ok": 1}
    response = client.get("/ready")
    assert response.status_code == 200

@patch('backend.database.connection.get_client')
def test_ready_endpoint_not_ready(mock_get_client):
    mock_get_client.return_value.admin.command.side_effect = Exception("DB offline")
    response = client.get("/ready")
    assert response.status_code == 503

@patch('backend.routes.get_transactions')
def test_pymongo_error_handler(mock_get_transactions):
    from backend.auth.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: type("FakeUser", (), {"id": "fake_id"})()
    
    # Route /transactions calls get_transactions()
    mock_get_transactions.side_effect = PyMongoError("Database timeout")
    response = client.get("/transactions")
    assert response.status_code == 503
    
    app.dependency_overrides.clear()
    assert "temporarily unavailable" in response.json()["detail"]
