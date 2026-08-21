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
from fastapi import Depends, UploadFile, File
import pdfplumber
import io
import logging

logger = logging.getLogger(__name__)
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


@chat_router.post("/chat/upload-pdf")
async def chat_upload_pdf(file: UploadFile = File(...), current_user = Depends(get_current_user)) -> dict:
    """
    Accepts a PDF file, extracts plain text from it safely, and returns the text
    to be appended to the chat context on the frontend.
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    try:
        content = await file.read()
        
        extracted_text = []
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text.append(text)
        
        full_text = "\n".join(extracted_text)
        
        if not full_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from this PDF. It may be scanned or image-based.")
            
        # Limit to ~15,000 characters to prevent overflowing the AI's context window
        max_chars = 15000
        if len(full_text) > max_chars:
            logger.warning(f"PDF {file.filename} is too large ({len(full_text)} chars), truncating to {max_chars}.")
            full_text = full_text[:max_chars] + "... [Text truncated due to size limits]"
            
        return {"extracted_text": full_text}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing PDF for chat: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")
