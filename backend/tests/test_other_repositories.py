import pytest
from backend.repositories.transaction_repository import TransactionRepository
from backend.repositories.budget_repository import BudgetRepository
from backend.repositories.chat_repository import ChatRepository
from backend.database.models import TransactionDocument, BudgetDocument, ChatDocument
from datetime import datetime, timezone

def test_transaction_repository_crud(mock_mongo):
    repo = TransactionRepository()
    
    doc = TransactionDocument(
        userId="user_txn",
        statementId="stmt_1",
        date=datetime.now(timezone.utc),
        raw_description="raw",
        normalized_description="norm",
        merchant="merch",
        category="cat",
        amount=10.0,
        transaction_type="Debit",
        bank_name="Bank",
        createdAt=datetime.now(timezone.utc),
        updatedAt=datetime.now(timezone.utc)
    )
    repo.bulk_insert([doc])
    
    txns = repo.find_by_user("user_txn")
    assert len(txns) == 1
    assert txns[0].merchant_name == "merch"
    assert txns[0].amount == 10.0

def test_budget_repository_crud(mock_mongo):
    repo = BudgetRepository()
    
    # Test update/upsert
    repo.update_by_user("user_budget", {"Food": 500.0, "Rent": 1000.0})
    
    # Test read
    budget = repo.find_by_user("user_budget")
    assert budget is not None
    assert budget["Food"] == 500.0
    
    # Test update existing
    repo.update_by_user("user_budget", {"Food": 600.0})
    budget2 = repo.find_by_user("user_budget")
    assert budget2["Food"] == 600.0
    assert "Rent" not in budget2 # Depending on how it's updated, $set sets the whole dict

def test_chat_repository_crud(mock_mongo):
    repo = ChatRepository()
    
    doc = ChatDocument(
        userId="user_chat",
        question="How much did I spend?",
        answer="You spent 50.",
        provider="Gemini",
        model="gemini-pro",
        latency=0.5,
        intent="query",
        confidence=0.9,
        createdAt=datetime.now(timezone.utc)
    )
    
    inserted_id = repo.save_chat(doc)
    assert inserted_id is not None
    
    history = repo.get_chat_history("user_chat")
    assert len(history) == 1
    assert history[0].question == "How much did I spend?"
    
    last = repo.get_last_messages("user_chat", limit=1)
    assert len(last) == 1
