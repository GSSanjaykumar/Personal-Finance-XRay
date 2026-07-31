"""
Gemini Provider
===============
Implements the AIProvider interface for Google's Gemini models using the modern google-genai SDK.
"""

import os
import json
import logging
from typing import Optional

from backend.services.ai.provider import AIProvider, ProviderError

logger = logging.getLogger(__name__)


class GeminiProvider(AIProvider):
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite").strip()
        self._client = None
        
        # Health check to ensure SDK can load and authenticate if key is present
        if self.api_key:
            try:
                self._get_client()
                logger.info("GeminiProvider initialized with model: %s", self.model_name)
            except Exception as e:
                logger.error("Failed GeminiProvider initialization: %s", e)

    def _get_client(self):
        if not self.api_key:
            raise ProviderError("GEMINI_API_KEY is not set in environment.")

        if self._client is None:
            try:
                from google import genai  # noqa: PLC0415
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                raise ProviderError(f"Failed to initialize modern Gemini Client: {e}") from e
        return self._client

    def generate(self, system_instruction: str, contents: list[dict]) -> dict:
        client = self._get_client()
        
        try:
            from google.genai import types  # noqa: PLC0415
            
            # The modern google-genai SDK accepts standard dicts matching the Content schema.
            # We enforce JSON structure via GenerateContentConfig.
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                temperature=0.3
            )
            
            response = client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=config
            )
            
            text = response.text.strip()
            
            # Clean up markdown block if present (sometimes models wrap JSON despite mime_type)
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
                
            return json.loads(text.strip())
            
        except Exception as e:
            logger.error("GeminiProvider failed: %s", e)
            # Catch all exceptions (HTTP errors, quota, 404, etc.) and wrap as ProviderError
            # so the AIRouter can seamlessly trigger failovers to Groq or the local fallback.
            raise ProviderError(f"Gemini API or parsing error: {e}") from e
