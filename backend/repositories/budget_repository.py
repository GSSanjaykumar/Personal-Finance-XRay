import os
from datetime import datetime, timezone
from backend.repositories.base_repository import BaseRepository
from backend.database.models import BudgetDocument

class BudgetRepository(BaseRepository[BudgetDocument]):
    def __init__(self):
        super().__init__(
            collection_name=os.getenv("COLLECTION_BUDGETS", "budgets"),
            model_class=BudgetDocument
        )

    def find_by_user(self, user_id: str) -> dict | None:
        doc = self.find_one({"userId": user_id})
        if doc:
            return doc.budget
        return None

    def update_by_user(self, user_id: str, budget: dict):
        now = datetime.now(timezone.utc)
        self.update(
            {"userId": user_id},
            {
                "$set": {
                    "userId": user_id,
                    "budget": budget,
                    "updatedAt": now
                },
                "$setOnInsert": {
                    "createdAt": now
                }
            },
            upsert=True
        )
