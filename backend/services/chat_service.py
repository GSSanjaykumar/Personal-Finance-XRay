"""
Chat Service
============
Orchestrates the full AI Financial Copilot pipeline:

  User message
      ↓
  IntentClassifier.classify()        → intent, confidence, entities
      ↓
  financial_context.build_context()  → formatted context block
      ↓
  prompt_builder.build_prompt()      → (system_instruction, contents)
      ↓
  AIRouter.generate()                → Structured JSON Response
      ↓
  {"answer": str, "intent": str, "confidence": float, "reasoning": list, ...}
"""

from __future__ import annotations

import logging

from backend.services.intent_classifier import classify
from backend.services.financial_context import build_context
from backend.services.prompt_builder import build_prompt
from backend.services.ai.router import AIRouter
from backend.repositories.chat_repository import ChatRepository
from backend.auth.user_context import UserContext

logger = logging.getLogger(__name__)

# ── Lazy Router initialisation ────────────────────────────────────────────────
_router = None

def _get_router():
    global _router
    if _router is None:
        _router = AIRouter()
    return _router


# ── Public API ────────────────────────────────────────────────────────────────

def handle_chat(
    message: str,
    history: list[dict] | None = None,
) -> dict:
    """
    Main entry point for the chat service. Returns a structured JSON dict.
    """
    history = history or []

    # ── 1. Classify intent & extract entities ─────────────────────────────────
    classification = classify(message)
    intent = classification["intent"]
    confidence = classification["confidence"]
    entities = classification["entities"]
    
    logger.debug("Classified intent: %s (confidence: %.2f) Entities: %s", intent, confidence, entities)

    # ── 2. Build financial context ────────────────────────────────────────────
    context_text = build_context(intent, entities)

    # ── 3. Build prompt ───────────────────────────────────────────────────────
    system_instruction, contents = build_prompt(message, context_text, history)

    # ── 4. Call AI Router ─────────────────────────────────────────────────────
    router = _get_router()
    response_dict = router.generate(system_instruction, contents)

    # Ensure intent and confidence from the classifier are included in the final response
    response_dict["intent"] = intent
    response_dict["confidence"] = confidence
    
    # ── 5. Save to MongoDB ────────────────────────────────────────────────────
    try:
        chat_repo = ChatRepository()
        provider_metadata = response_dict.get("provider_metadata", {})
        latency = provider_metadata.get("latency_ms", 0.0)
        provider = provider_metadata.get("provider", "unknown")
        model = provider_metadata.get("model", "unknown")
        
        chat_repo.save_chat(
            user_id=UserContext.get_current_user_id(),
            question=message,
            answer=response_dict.get("answer", ""),
            provider=provider,
            model=model,
            latency=latency,
            intent=intent,
            confidence=confidence
        )
    except Exception as e:
        logger.error(f"Failed to save chat history: {e}")

    return response_dict
