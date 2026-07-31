import os
from backend.repositories.base_repository import BaseRepository
from backend.database.models import StatementDocument

class StatementRepository(BaseRepository[StatementDocument]):
    def __init__(self):
        super().__init__(
            collection_name=os.getenv("COLLECTION_STATEMENTS", "statements"),
            model_class=StatementDocument
        )

    def find_by_hash(self, file_hash: str) -> StatementDocument | None:
        return self.find_one({"hash": file_hash})

    def save_statement(self, statement: StatementDocument) -> str:
        return self.create(statement)

    def find_by_user(self, user_id: str) -> list[StatementDocument]:
        return self.find_many({"userId": user_id}, sort=[("createdAt", -1)])
