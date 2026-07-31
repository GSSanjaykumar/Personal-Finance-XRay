from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from backend.auth.security import decode_access_token
from backend.repositories.user_repository import UserRepository
from backend.auth.user_context import UserContext
from backend.database.models import UserDocument

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)) -> UserDocument:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
        
    user_repo = UserRepository()
    user = user_repo.find_one({"_id": user_id})
    if user is None or not user.is_active:
        raise credentials_exception
        
    # Set the current user in the ContextVar for use by generic repositories and services
    UserContext.set_current_user_id(str(user.id))
    
    return user
