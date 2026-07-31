"""
Prompt Builder
==============
Assembles the complete prompt payload for the Gemini API.

Structure
---------
1. System instruction — persona, rules, tone, safety constraints, JSON schema
2. Financial context block — from financial_context.py
3. Conversation history — last N turns (multi-turn coherence)
4. Current user question
"""

from __future__ import annotations
import json

# Maximum number of prior conversation turns to include
_MAX_HISTORY_TURNS = 6

SYSTEM_INSTRUCTION = """You are Finance X-Ray Copilot — an intelligent, empathetic personal finance advisor embedded in the Personal Finance X-Ray application.

Your role:
- Answer questions ONLY about the user's personal finances.
- Provide actionable, specific, number-backed advice.
- Be friendly and encouraging, never judgmental.

STRICT RULES you must follow:
1. NEVER invent or hallucinate numbers. Only use figures present in the [FINANCIAL CONTEXT] section.
2. For any prediction or future projection, always hedge: use phrases like "Based on your current trend...", "It appears...", "If this pattern continues...", "Roughly estimated..."
3. Do NOT give investment advice, tax advice, or legal advice.
4. If a question is completely unrelated to finance, politely redirect.
5. Format text using Markdown: use **bold** for key numbers.
6. Keep responses concise — maximum 300 words.
7. Always use the ₹ symbol for Indian Rupees.
8. ALWAYS explain WHY you are making a recommendation (Explainable AI).
9. Output MUST be in strictly valid JSON format matching the schema provided below. Do not add markdown code blocks (```json) around the output, just raw JSON.

JSON SCHEMA REQUIREMENT:
You must return a JSON object with the following fields:
{
  "answer": "A concise text response containing a Summary, Key Findings, and Warnings (if any). Use markdown.",
  "reasoning": [
    "A string explaining your logic",
    "Another point of reasoning"
  ],
  "recommendations": [
    "Actionable tip 1 (e.g. 'Reduce food spend by 20% to save ₹2,000')",
    "Actionable tip 2"
  ],
  "follow_up_questions": [
    "Question 1 (e.g. 'Can I improve my savings?')",
    "Question 2",
    "Question 3"
  ],
  "widgets": [
    {
      "type": "budget_progress", 
      "data": {"category": "Food", "spent": 10000, "budget": 12000}
    },
    {
      "type": "category_breakdown",
      "data": {"categories": [{"name": "Food", "amount": 10000}, {"name": "Travel", "amount": 5000}]}
    },
    {
      "type": "recurring",
      "data": {"subscriptions": [{"name": "Netflix", "amount": 499}]}
    }
  ]
}

WIDGET INSTRUCTIONS:
- If the user asks about budget, include a "budget_progress" widget.
- If the user asks about categories, include a "category_breakdown" widget.
- If the user asks about subscriptions, include a "recurring" widget.
- If no widget is relevant, return an empty array for "widgets".
"""


def build_prompt(
    user_message: str,
    context_text: str,
    history: list[dict] | None = None,
) -> tuple[str, list[dict]]:
    """
    Returns a ``(system_instruction, contents)`` tuple ready for the
    Gemini ``generate_content`` call.
    """
    history = history or []

    # ── Trim history to last N turns ─────────────────────────────────────────
    trimmed_history = history[-_MAX_HISTORY_TURNS:]

    # ── Build the context-injected user message ───────────────────────────────
    context_message = (
        f"[FINANCIAL CONTEXT — use ONLY these numbers]\n"
        f"{context_text}\n"
        f"[END CONTEXT]\n\n"
        f"User question: {user_message}"
    )

    # ── Assemble Gemini contents array ────────────────────────────────────────
    contents: list[dict] = []

    for turn in trimmed_history:
        role = turn.get("role", "user")
        # Map frontend "assistant" → Gemini "model"
        if role == "assistant":
            role = "model"
        
        # In history, since we expect structured JSON responses from the assistant,
        # we only feed the 'answer' field back to the LLM to keep the prompt clean.
        content = turn.get("content", "")
        # If it's a string, it might be the old format or a serialized JSON. We will just pass the string.
        
        contents.append({"role": role, "parts": [{"text": content}]})

    # Append current question (always last, always "user")
    contents.append({"role": "user", "parts": [{"text": context_message}]})

    return SYSTEM_INSTRUCTION, contents
