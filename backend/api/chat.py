"""
Chat Route
==========
POST /chat

Thin route layer — all business logic is in chat_service.py.
"""

from typing import Optional, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from backend.services.chat_service import handle_chat
from fastapi import Depends
from backend.auth.dependencies import get_current_user

chat_router = APIRouter(tags=["AI Chat"])


# ── Request / Response models ──────────────────────────────────────────────────

class HistoryEntry(BaseModel):
    role: str        # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[HistoryEntry] = []

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("message cannot be empty")
        return v


class ChatResponse(BaseModel):
    answer: str
    intent: str
    confidence: Optional[float] = None
    reasoning: Optional[list[str]] = None
    recommendations: Optional[list[str]] = None
    follow_up_questions: Optional[list[str]] = None
    widgets: Optional[list[dict[str, Any]]] = None
    provider_metadata: Optional[dict[str, Any]] = None


# ── Route ─────────────────────────────────────────────────────────────────────

@chat_router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, current_user = Depends(get_current_user)) -> ChatResponse:
    """
    Accepts a user message and optional conversation history.
    Returns an AI-generated answer grounded in the user's financial data.
    """
    history_dicts = [h.model_dump() for h in request.history]

    result = handle_chat(
        message=request.message,
        history=history_dicts,
    )

    return ChatResponse(
        answer=result.get("answer", ""),
        intent=result.get("intent", "general"),
        confidence=result.get("confidence"),
        reasoning=result.get("reasoning"),
        recommendations=result.get("recommendations"),
        follow_up_questions=result.get("follow_up_questions"),
        widgets=result.get("widgets"),
        provider_metadata=result.get("provider_metadata")
    )
