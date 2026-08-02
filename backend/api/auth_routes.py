from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone
import os
from google.oauth2 import id_token
from google.auth.transport import requests


from backend.database.models import UserDocument
from backend.repositories.user_repository import UserRepository
from backend.auth.security import verify_password, get_password_hash, create_access_token
from backend.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class GoogleLoginRequest(BaseModel):
    credential: str


class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: str
    email: str
    provider: str
    is_active: bool

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate):
    repo = UserRepository()
    if repo.find_by_email(user.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
        
    new_user = UserDocument(
        email=user.email,
        password_hash=get_password_hash(user.password),
        provider="local",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    user_id = repo.save_user(new_user)
    
    access_token = create_access_token(data={"sub": user_id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    repo = UserRepository()
    user = repo.find_by_email(form_data.username) 
    
    if not user or not user.password_hash or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    repo.update_last_login(str(user.id))
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: UserDocument = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        provider=current_user.provider,
        is_active=current_user.is_active
    )

@router.post("/google", response_model=Token)
def google_login(request: GoogleLoginRequest):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google Client ID not configured"
        )
        
    try:
        # Verify token. This also checks signature and expiration automatically
        idinfo = id_token.verify_oauth2_token(
            request.credential,
            requests.Request(),
            client_id
        )
        
        # Additional mandatory validations
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
            
        if not idinfo.get('email_verified'):
            raise ValueError('Email not verified by Google.')
            
        # Get user info
        google_sub = idinfo['sub']
        email = idinfo['email']
        picture = idinfo.get('picture')
        
        repo = UserRepository()
        
        # 1. Search by google_sub
        user = repo.find_by_google_sub(google_sub)
        
        if not user:
            # 2. Search by email
            user = repo.find_by_email(email)
            if user:
                # 3. Email exists, link account
                repo.link_google_account(str(user.id), google_sub, picture)
                user.google_sub = google_sub
            else:
                # 4. Neither exists, create user
                new_user = UserDocument(
                    email=email,
                    google_sub=google_sub,
                    picture=picture,
                    provider="google",
                    password_hash=None,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                user_id = repo.save_user(new_user)
                user = repo.find_one({"_id": user_id})
                
        repo.update_last_login(str(user.id))
        access_token = create_access_token(data={"sub": str(user.id)})
        return {"access_token": access_token, "token_type": "bearer"}
        
    except ValueError as e:
        # Invalid token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google credential: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

