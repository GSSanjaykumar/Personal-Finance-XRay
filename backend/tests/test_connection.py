import pytest
import os
from unittest.mock import patch
from backend.database.connection import MongoDBConnection, get_db
from pymongo.errors import PyMongoError

def test_singleton_behavior(mock_mongo):
    MongoDBConnection._instance = None
    conn1 = MongoDBConnection()
    conn2 = MongoDBConnection()
    assert conn1 is conn2
    
def test_database_selection(mock_mongo):
    MongoDBConnection._instance = None
    os.environ['DATABASE_NAME'] = "custom_db_name"
    db = get_db()
    assert db.name == "custom_db_name"

@patch('backend.database.connection.MongoClient')
def test_atlas_connection_failure(mock_mongo_client):
    mock_mongo_client.side_effect = PyMongoError("Atlas timeout")
    MongoDBConnection._instance = None
    with pytest.raises(PyMongoError):
        MongoDBConnection()
