from backend.repositories.transaction_repository import TransactionRepository
from backend.database.models import TransactionDocument
from parsers.schema import Transaction
from datetime import datetime, timezone

_repo = TransactionRepository()

def save_transactions(user_id: str, transactions: list[Transaction], statement_id: str = "default"):
    """
    Adapter method to save transactions. 
    Requires statement_id which was added during the migration.
    """
    now = datetime.now(timezone.utc)
    
    docs = []
    for t in transactions:
        docs.append(TransactionDocument(
            userId=user_id,
            statementId=statement_id,
            date=t.date,
            raw_description=t.raw_description,
            normalized_description=t.normalized_description,
            merchant=t.merchant_name,
            category=t.category,
            amount=t.amount,
            transaction_type=t.transaction_type,
            balance=t.balance,
            bank_name=t.bank_name,
            reference_number=t.reference_number,
            createdAt=now,
            updatedAt=now
        ))
        
    _repo.bulk_insert(docs)

def get_transactions(user_id: str) -> list[Transaction]:
    """
    Adapter method to retrieve transactions for the specific user.
    """
    return _repo.find_by_user(user_id)