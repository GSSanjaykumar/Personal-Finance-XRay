import os
import pytest
import mongomock
from unittest.mock import patch
from backend.database.connection import MongoDBConnection

@pytest.fixture(autouse=True)
def setup_env(monkeypatch):
    monkeypatch.setenv('MONGODB_URI', "mongodb://localhost:27017")
    monkeypatch.setenv('DATABASE_NAME', "test_db")
    monkeypatch.setenv('GEMINI_API_KEY', "dummy")
    yield
    MongoDBConnection._instance = None

@pytest.fixture
def mock_mongo():
    client = mongomock.MongoClient()
    with patch('backend.database.connection.MongoClient', return_value=client):
        # We also need to patch the ping command to not fail on mongomock if it's not fully supported
        with patch.object(client, 'admin'):
            yield client
