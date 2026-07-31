import pytest
from backend.repositories.statement_repository import StatementRepository
from backend.database.models import StatementDocument
from datetime import datetime, timezone

def test_repository_update_delete(mock_mongo):
    repo = StatementRepository()
    
    doc = StatementDocument(
        userId="update_test_user",
        filename="update.pdf",
        bank="Update Bank",
        hash="update_hash",
        transactionCount=1,
        statementPeriod="Feb 2023",
        createdAt=datetime.now(timezone.utc)
    )
    inserted_id = repo.save_statement(doc)
    
    # Test Update using string ID
    repo.update({"_id": inserted_id}, {"$set": {"transactionCount": 10}})
    
    updated = repo.find_one({"_id": inserted_id})
    assert updated is not None
    assert updated.transactionCount == 10
    
    # Test Delete using string ID (verifies the rollback bug fix)
    repo.delete({"_id": inserted_id})
    
    deleted = repo.find_one({"_id": inserted_id})
    assert deleted is None, "Bug fix verified: Rollback using string ID successfully deletes ObjectId document"

def test_invalid_objectid(mock_mongo):
    repo = StatementRepository()
    # Querying with an invalid ObjectId string should not crash, it should just return None
    result = repo.find_one({"_id": "invalid_object_id_string"})
    assert result is None
