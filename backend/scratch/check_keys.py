import os
from dotenv import load_dotenv

load_dotenv()
print(f"GROQ_API_KEY present: {'Yes' if os.environ.get('GROQ_API_KEY') else 'No'}")
print(f"GEMINI_API_KEY present: {'Yes' if os.environ.get('GEMINI_API_KEY') else 'No'}")
