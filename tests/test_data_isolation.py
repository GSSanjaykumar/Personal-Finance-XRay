import pytest
import uuid
import datetime
import concurrent.futures
from fastapi.testclient import TestClient

from backend.app import app
from backend.database.connection import get_db
from backend.repositories.user_repository import UserRepository
from backend.auth.security import create_access_token

@pytest.fixture
def two_users():
    db = get_db()
    repo = UserRepository()

    uid_a = f"test_iso_a_{uuid.uuid4().hex[:8]}"
    uid_b = f"test_iso_b_{uuid.uuid4().hex[:8]}"

    now = datetime.datetime.now(datetime.timezone.utc)

    db[repo.collection_name].insert_many([
        {
            "_id": uid_a,
            "email": f"{uid_a}@test.com",
            "provider": "local",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "_id": uid_b,
            "email": f"{uid_b}@test.com",
            "provider": "local",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
    ])

    # Give User A 5 transactions
    db.transactions.insert_many([
        {
            "userId": uid_a,
            "statementId": "iso_test",
            "date": now,
            "raw_description": f"Test {i}",
            "normalized_description": f"Test {i}",
            "merchant": "Test",
            "category": "Test",
            "amount": -100.0,
            "transaction_type": "Debit",
            "balance": 1000.0,
            "bank_name": "Test Bank",
            "createdAt": now,
            "updatedAt": now,
        } for i in range(5)
    ])
    # User B gets 0

    token_a = create_access_token({"sub": uid_a})
    token_b = create_access_token({"sub": uid_b})

    yield token_a, token_b, uid_a, uid_b

    # Teardown
    db[repo.collection_name].delete_many({"_id": {"$in": [uid_a, uid_b]}})
    db.transactions.delete_many({"userId": {"$in": [uid_a, uid_b]}})

def test_data_isolation_transactions(two_users):
    """
    Test that alternating requests between two users correctly scopes the data,
    even when processed synchronously in FastAPI's ThreadPool.
    """
    token_a, token_b, uid_a, uid_b = two_users

    client = TestClient(app)

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Make alternating requests
    for i in range(5):
        # Request A
        res_a = client.get("/transactions", headers=headers_a)
        assert res_a.status_code == 200
        data_a = res_a.json()
        assert len(data_a) == 5, f"User A expected 5 transactions, got {len(data_a)} on iteration {i}"

        # Request B
        res_b = client.get("/transactions", headers=headers_b)
        assert res_b.status_code == 200
        data_b = res_b.json()
        assert len(data_b) == 0, f"User B expected 0 transactions, got {len(data_b)} on iteration {i}"
