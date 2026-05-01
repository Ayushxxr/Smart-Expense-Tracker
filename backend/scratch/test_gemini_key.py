from google import genai
from app.core.config import settings
import sys

try:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    # Just a simple call to see if it works
    print(f"Testing key: {settings.GEMINI_API_KEY[:10]}...")
    for model in client.models.list():
        print(f"Found model: {model.name}")
        break # Just need one to verify
    print("Gemini Key: VALID")
except Exception as e:
    print(f"Gemini Key: INVALID or error: {e}")
