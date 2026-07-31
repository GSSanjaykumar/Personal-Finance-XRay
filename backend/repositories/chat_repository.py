import os
from backend.repositories.base_repository import BaseRepository
from backend.database.models import ChatDocument

class ChatRepository(BaseRepository[ChatDocument]):
    def __init__(self):
        super().__init__(
            collection_name=os.getenv("COLLECTION_CHAT", "chat_history"),
            model_class=ChatDocument
        )

    def save_chat(self, chat_doc: ChatDocument) -> str:
        return self.create(chat_doc)

    def get_chat_history(self, user_id: str) -> list[ChatDocument]:
        return self.find_many({"userId": user_id}, sort=[("createdAt", 1)])

    def get_last_messages(self, user_id: str, limit: int = 10) -> list[ChatDocument]:
        return self.find_many({"userId": user_id}, sort=[("createdAt", -1)], limit=limit)
        
    def list_sessions(self, user_id: str):
        pass
        
    def delete_chat(self, user_id: str, chat_id: str):
        pass
