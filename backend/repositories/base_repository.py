import os
from typing import TypeVar, Generic, List, Optional
from pydantic import BaseModel
from pymongo.collection import Collection
from bson.objectid import ObjectId
from backend.database.connection import get_db

T = TypeVar('T', bound=BaseModel)

class BaseRepository(Generic[T]):
    """
    Abstract Base Repository providing generic CRUD operations.
    """
    def __init__(self, collection_name: str, model_class: type[T]):
        self.collection_name = collection_name
        self.model_class = model_class

    def _get_collection(self) -> Collection:
        db = get_db()
        if db is None:
            raise RuntimeError("Database connection not available")
        return db[self.collection_name]

    def create(self, document: T) -> str:
        data = document.model_dump(by_alias=True, exclude={"id"}, exclude_none=True)
        result = self._get_collection().insert_one(data)
        return str(result.inserted_id)

    def _format_query(self, query: dict) -> dict:
        formatted = query.copy()
        if "_id" in formatted and isinstance(formatted["_id"], str):
            try:
                formatted["_id"] = ObjectId(formatted["_id"])
            except Exception:
                pass
        return formatted

    def find_one(self, query: dict) -> Optional[T]:
        doc = self._get_collection().find_one(self._format_query(query))
        if doc:
            doc["_id"] = str(doc["_id"])
            return self.model_class(**doc)
        return None

    def find_many(self, query: dict, sort=None, limit=0) -> List[T]:
        cursor = self._get_collection().find(self._format_query(query))
        if sort:
            cursor = cursor.sort(sort)
        if limit:
            cursor = cursor.limit(limit)
            
        results = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(self.model_class(**doc))
        return results

    def bulk_insert(self, documents: List[T]):
        if not documents:
            return
        data = [doc.model_dump(by_alias=True, exclude={"id"}, exclude_none=True) for doc in documents]
        self._get_collection().insert_many(data)

    def update(self, query: dict, update_data: dict, upsert: bool = False):
        return self._get_collection().update_one(self._format_query(query), update_data, upsert=upsert)

    def delete(self, query: dict):
        return self._get_collection().delete_many(self._format_query(query))

    def aggregate(self, pipeline: list):
        return list(self._get_collection().aggregate(pipeline))
