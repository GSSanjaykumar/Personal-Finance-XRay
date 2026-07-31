import pytest
from backend.repositories.statement_repository import StatementRepository
from backend.database.models import StatementDocument
from datetime import datetime, timezone

def test_statement_repository_crud(mock_mongo):
    repo = StatementRepository()
    
    # Test Create
    doc = StatementDocument(
        userId="user123",
        filename="test.pdf",
        bank="Test Bank",
        hash="hash123",
        transactionCount=5,
        statementPeriod="Jan 2023",
        createdAt=datetime.now(timezone.utc)
    )
    
    inserted_id = repo.save_statement(doc)
    assert inserted_id is not None
    
    # Test Read
    retrieved = repo.find_by_hash("hash123")
    assert retrieved is not None
    assert retrieved.userId == "user123"
    
    # Bug Reproduction: Attempt to delete using string ID instead of ObjectId
    # This simulates the critical bug found during code review in service.py
    # Mongomock handles string matching vs ObjectId matching just like real Mongo.
    repo.delete({"_id": inserted_id})
    
    # The document should have been deleted because the _format_query in base_repository correctly casts the string ID to ObjectId
    still_exists = repo.find_one({"hash": "hash123"})
    assert still_exists is None, "Bug fix verified: Rollback using string ID successfully deletes ObjectId document"
