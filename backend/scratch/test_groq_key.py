import httpx
from app.core.config import settings
import sys

try:
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    response = httpx.get("https://api.groq.com/openai/v1/models", headers=headers)
    if response.status_code == 200:
        print("Groq Key: VALID")
    else:
        print(f"Groq Key: INVALID (Status {response.status_code}): {response.text}")
except Exception as e:
    print(f"Groq Key Error: {e}")
