"""
AI Provider Interface
=====================
Defines the base interface that all AI providers (Gemini, Groq, etc.) must implement.
"""

from abc import ABC, abstractmethod


class ProviderError(Exception):
    """Raised when an AI provider fails (timeout, rate limit, parse error, etc.)"""
    pass


class AIProvider(ABC):
    @abstractmethod
    def generate(self, system_instruction: str, contents: list[dict]) -> dict:
        """
        Generates a structured JSON response from the LLM.

        Parameters
        ----------
        system_instruction : str
            The system prompt defining the persona and rules.
        contents : list[dict]
            The conversation history + current prompt, formatted as:
            [{"role": "user"|"model", "parts": [{"text": "..."}]}]

        Returns
        -------
        dict
            The structured JSON response parsed into a Python dictionary.

        Raises
        ------
        ProviderError
            If the API call fails or the output cannot be parsed as JSON.
        """
        pass
