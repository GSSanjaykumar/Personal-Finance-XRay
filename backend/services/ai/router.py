"""
AI Router
=========
Orchestrates AI providers. Implements a resilient failover strategy and structured logging.
"""

import os
import time
import logging

from backend.services.ai.provider import ProviderError
from backend.services.ai.gemini_provider import GeminiProvider
from backend.services.ai.groq_provider import GroqProvider
from backend.services.ai.fallback_provider import RuleBasedFallbackProvider

logger = logging.getLogger(__name__)


class AIRouter:
    def __init__(self):
        self.default_provider_name = os.getenv("DEFAULT_PROVIDER", "gemini").strip().lower()
        self.fallback_provider_name = os.getenv("FALLBACK_PROVIDER", "groq").strip().lower()
        
        # Instantiate providers
        self.providers = {
            "gemini": GeminiProvider(),
            "groq": GroqProvider(),
            "rule-based": RuleBasedFallbackProvider()
        }

    def _get_provider(self, name: str):
        provider = self.providers.get(name)
        if not provider:
            logger.warning("Provider '%s' not found. Defaulting to rule-based.", name)
            return self.providers["rule-based"]
        return provider

    def generate(self, system_instruction: str, contents: list[dict]) -> dict:
        """
        Attempts to generate a response from the default provider.
        If it fails, automatically falls back to the secondary provider,
        and finally to the rule-based local fallback.
        Injects provider_metadata into the response.
        """
        start_time = time.time()
        
        # 1. Try Default Provider
        try:
            logger.info("Attempting primary provider: %s", self.default_provider_name)
            provider = self._get_provider(self.default_provider_name)
            result = provider.generate(system_instruction, contents)
            latency = time.time() - start_time
            
            # Inject metadata
            result["provider_metadata"] = {
                "provider_name": self.default_provider_name,
                "model_name": getattr(provider, "model_name", "Unknown Model"),
                "latency_ms": int(latency * 1000),
                "is_fallback": False,
                "fallback_reason": None
            }
            
            logger.info(
                "AI Response | Provider: %s | Model: %s | Latency: %dms | Fallback: False", 
                self.default_provider_name, result["provider_metadata"]["model_name"], int(latency * 1000)
            )
            return result
        except ProviderError as e:
            fallback_reason = str(e)
            logger.error("Primary provider [%s] failed: %s", self.default_provider_name, fallback_reason)
            
        # 2. Try Fallback Provider
        if self.fallback_provider_name and self.fallback_provider_name != self.default_provider_name:
            start_time = time.time()
            try:
                logger.info("Attempting fallback provider: %s", self.fallback_provider_name)
                provider = self._get_provider(self.fallback_provider_name)
                result = provider.generate(system_instruction, contents)
                latency = time.time() - start_time
                
                # Inject metadata
                result["provider_metadata"] = {
                    "provider_name": self.fallback_provider_name,
                    "model_name": getattr(provider, "model_name", "Unknown Model"),
                    "latency_ms": int(latency * 1000),
                    "is_fallback": True,
                    "fallback_reason": fallback_reason
                }
                
                logger.info(
                    "AI Response | Provider: %s | Model: %s | Latency: %dms | Fallback: True | Reason: %s", 
                    self.fallback_provider_name, result["provider_metadata"]["model_name"], int(latency * 1000), fallback_reason
                )
                return result
            except ProviderError as e:
                fallback_reason = str(e)
                logger.error("Fallback provider [%s] failed: %s", self.fallback_provider_name, fallback_reason)
                
        # 3. Last resort: Rule-Based Fallback
        logger.warning("All LLM providers failed. Triggering rule-based fallback.")
        start_time = time.time()
        provider = self.providers["rule-based"]
        result = provider.generate(system_instruction, contents)
        latency = time.time() - start_time
        
        # Inject metadata
        result["provider_metadata"] = {
            "provider_name": "rule-based",
            "model_name": getattr(provider, "model_name", "Offline Analysis"),
            "latency_ms": int(latency * 1000),
            "is_fallback": True,
            "fallback_reason": fallback_reason if 'fallback_reason' in locals() else "All providers unavailable"
        }
        
        logger.info(
            "AI Response | Provider: rule-based | Model: %s | Latency: %dms | Fallback: True | Reason: %s", 
            result["provider_metadata"]["model_name"], int(latency * 1000), result["provider_metadata"]["fallback_reason"]
        )
        return result
