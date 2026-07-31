from google import genai
from dotenv import load_dotenv
from pathlib import Path
import os

# Load backend/.env correctly
load_dotenv(Path(__file__).parent / ".env")

print("API Key:", os.getenv("GEMINI_API_KEY")[:10] + "...")

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

print("\nAvailable models:\n")

for model in client.models.list():
    print(model.name)