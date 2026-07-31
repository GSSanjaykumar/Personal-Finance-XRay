"""
Groq Provider
=============
Implements the AIProvider interface for Groq models (e.g. LLaMA 3).
"""

import os
import json
import logging

from backend.services.ai.provider import AIProvider, ProviderError

logger = logging.getLogger(__name__)


class GroqProvider(AIProvider):
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "").strip()
        # Default to a fast Groq model suitable for JSON parsing
        self.model_name = os.getenv("GROQ_MODEL", "llama3-8b-8192").strip()
        self._client = None

    def _get_client(self):
        if not self.api_key:
            raise ProviderError("GROQ_API_KEY is not set in environment.")
        
        if self._client is None:
            try:
                from groq import Groq  # noqa: PLC0415
                self._client = Groq(api_key=self.api_key)
            except Exception as e:
                raise ProviderError(f"Failed to initialize Groq client: {e}") from e
        return self._client

    def _translate_contents(self, system_instruction: str, contents: list[dict]) -> list[dict]:
        """Translates Gemini's content array into Groq/OpenAI message format."""
        messages = []
        
        # Insert system instruction first
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
            
        for turn in contents:
            # Map "model" to "assistant"
            role = turn.get("role", "user")
            if role == "model":
                role = "assistant"
                
            parts = turn.get("parts", [])
            text_content = ""
            if parts:
                text_content = parts[0].get("text", "")
                
            messages.append({"role": role, "content": text_content})
            
        return messages

    def generate(self, system_instruction: str, contents: list[dict]) -> dict:
        client = self._get_client()
        messages = self._translate_contents(system_instruction, contents)

        try:
            response = client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.3
            )
            
            text = response.choices[0].message.content
            return json.loads(text.strip())
        except Exception as e:
            logger.error("GroqProvider failed: %s", e)
            raise ProviderError(f"Groq API or parsing error: {e}") from e
