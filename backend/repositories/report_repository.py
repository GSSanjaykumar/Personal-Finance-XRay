import os
from backend.repositories.base_repository import BaseRepository
from backend.database.models import ReportDocument

class ReportRepository(BaseRepository[ReportDocument]):
    def __init__(self):
        super().__init__(
            collection_name=os.getenv("COLLECTION_REPORTS", "reports"),
            model_class=ReportDocument
        )

    def find_by_user(self, user_id: str):
        pass
