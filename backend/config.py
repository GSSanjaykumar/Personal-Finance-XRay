"""
Configuration module to load environment variables reliably.
"""

import os
import pathlib
from dotenv import load_dotenv
import backend.logging_config  # Initialize logging first
import logging

logger = logging.getLogger(__name__)

# Resolve the backend directory regardless of current working directory
backend_dir = pathlib.Path(__file__).parent.resolve()
env_path = backend_dir / ".env"

if not env_path.exists():
    raise FileNotFoundError(f"Startup Error: Environment file not found at {env_path}")

# Explicitly load the backend/.env file
load_dotenv(dotenv_path=env_path)
logger.info("Environment loaded")

# ── Configuration Validation ──────────────────────────────────────────────────
REQUIRED_VARS = ["MONGODB_URI", "DATABASE_NAME"]
missing = [var for var in REQUIRED_VARS if not os.getenv(var)]

if missing:
    error_msg = f"Startup Error: Missing required environment variables: {', '.join(missing)}"
    logger.error(error_msg)
    raise RuntimeError(error_msg)

def _mask_key(key: str) -> str:
    if not key or len(key) < 5:
        return "None or too short"
    return key[:4] + "***********"

gemini_key = os.getenv("GEMINI_API_KEY", "")
groq_key = os.getenv("GROQ_API_KEY", "")

if gemini_key:
    logger.info(f"Gemini API key detected ({_mask_key(gemini_key)})")
else:
    logger.warning("Gemini API key NOT detected in environment")

if groq_key:
    logger.info(f"Groq API key detected ({_mask_key(groq_key)})")
else:
    logger.warning("Groq API key NOT detected in environment")

if not gemini_key and not groq_key:
    error_msg = "Startup Error: At least one AI provider API key is required."
    logger.error(error_msg)
    raise RuntimeError(error_msg)
