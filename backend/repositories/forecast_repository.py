import os
from backend.repositories.base_repository import BaseRepository
from backend.database.models import ForecastDocument

class ForecastRepository(BaseRepository[ForecastDocument]):
    def __init__(self):
        super().__init__(
            collection_name=os.getenv("COLLECTION_FORECAST", "forecasts"),
            model_class=ForecastDocument
        )

    def find_by_user(self, user_id: str):
        pass
