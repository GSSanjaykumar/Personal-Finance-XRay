import os
from typing import Optional
from backend.repositories.base_repository import BaseRepository
from backend.database.models import UserDocument
from datetime import datetime, timezone

class UserRepository(BaseRepository[UserDocument]):
    def __init__(self):
        super().__init__(
            collection_name=os.getenv("COLLECTION_USERS", "users"),
            model_class=UserDocument
        )

    def find_by_email(self, email: str) -> Optional[UserDocument]:
        return self.find_one({"email": email})
        
    def save_user(self, user: UserDocument) -> str:
        return self.create(user)
        
    def update_last_login(self, user_id: str):
        self.update(
            {"_id": user_id},
            {"$set": {"last_login": datetime.now(timezone.utc)}}
        )
        
    def find_by_google_sub(self, google_sub: str) -> Optional[UserDocument]:
        return self.find_one({"google_sub": google_sub})
        
    def link_google_account(self, user_id: str, google_sub: str, picture: Optional[str] = None):
        update_fields = {"google_sub": google_sub}
        if picture:
            update_fields["picture"] = picture
        self.update(
            {"_id": user_id},
            {"$set": update_fields}
        )

