import os
from backend.repositories.base_repository import BaseRepository
from backend.database.models import TransactionDocument
from parsers.schema import Transaction

class TransactionRepository(BaseRepository[TransactionDocument]):
    def __init__(self):
        super().__init__(
            collection_name=os.getenv("COLLECTION_TRANSACTIONS", "transactions"),
            model_class=TransactionDocument
        )

    def find_by_user(self, user_id: str) -> list[Transaction]:
        docs = self.find_many({"userId": user_id}, sort=[("date", -1)])
        # Convert documents back to parsers.schema.Transaction to maintain compatibility
        transactions = []
        for doc in docs:
            t = Transaction(
                transaction_id=str(doc.id),
                date=doc.date,
                raw_description=doc.raw_description,
                normalized_description=doc.normalized_description,
                merchant_name=doc.merchant,
                category=doc.category,
                amount=doc.amount,
                transaction_type=doc.transaction_type,
                balance=doc.balance,
                bank_name=doc.bank_name,
                reference_number=doc.reference_number
            )
            transactions.append(t)
        return transactions
