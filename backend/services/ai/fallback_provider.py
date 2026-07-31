"""
Fallback Provider
=================
Implements the AIProvider interface for a local rule-based fallback.
Used as a last resort if all LLM providers fail.
"""

import re
from backend.services.ai.provider import AIProvider

class RuleBasedFallbackProvider(AIProvider):
    def __init__(self):
        self.model_name = "Offline Analysis"

    def generate(self, system_instruction: str, contents: list[dict]) -> dict:
        """
        Extracts context from the contents array and generates a structured
        rule-based response.
        """
        # 1. Extract context and user message from the last turn
        last_user_msg = ""
        context_text = ""
        
        if contents:
            last_turn = contents[-1]
            if last_turn.get("role") == "user" and last_turn.get("parts"):
                full_text = last_turn["parts"][0].get("text", "")
                
                # Extract context block
                context_match = re.search(r"\[FINANCIAL CONTEXT.*?\]\n(.*?)\[END CONTEXT\]", full_text, re.DOTALL)
                if context_match:
                    context_text = context_match.group(1).strip()
                    
                # Extract user question
                q_match = re.search(r"User question:\s*(.*)", full_text, re.DOTALL)
                if q_match:
                    last_user_msg = q_match.group(1).strip()
                else:
                    last_user_msg = full_text

        # 2. Build the fallback answer
        intro = "*(AI service unavailable — showing data-driven summary)*\n\n"
        
        lines = [ln for ln in context_text.splitlines() if ln.strip() and not ln.startswith("──") and not ln.startswith("[")]
        relevant_lines = lines[:15]
        body = "\n".join(f"- {ln}" for ln in relevant_lines if ln.strip())
        
        answer_text = f"{intro}{body}"

        return {
            "answer": answer_text,
            "reasoning": [
                "Generated via rule-based engine.",
                "Live AI features are currently disabled or unreachable."
            ],
            "recommendations": [
                "Review your budget limits and recent transactions.",
                "Upload your latest bank statement for the most accurate analysis."
            ],
            "follow_up_questions": [
                "Show my budget status",
                "How healthy are my finances?",
                "Show my subscriptions"
            ],
            "widgets": []
        }
