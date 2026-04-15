from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from datetime import date
import re

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.expense import Expense
from app.core.config import settings

router = APIRouter(prefix="/api/ocr", tags=["ocr"])

KEYWORD_CATEGORIES = {
    "swiggy": "Food & Dining", "zomato": "Food & Dining", "food": "Food & Dining",
    "restaurant": "Food & Dining", "cafe": "Food & Dining", "pizza": "Food & Dining",
    "uber": "Transport", "ola": "Transport", "petrol": "Transport",
    "amazon": "Shopping", "flipkart": "Shopping",
    "netflix": "Entertainment", "spotify": "Entertainment",
    "electricity": "Bills & Utilities", "internet": "Bills & Utilities",
    "hospital": "Healthcare", "medicine": "Healthcare", "pharmacy": "Healthcare",
    "school": "Education", "college": "Education",
    "flight": "Travel", "hotel": "Travel", "train": "Travel",
    "mutual fund": "Investments", "sip": "Investments",
}


def auto_categorize(text: str) -> str:
    t = text.lower()
    for k, v in KEYWORD_CATEGORIES.items():
        if k in t:
            return v
    return "Other"


@router.post("/scan")
async def scan_receipt(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a receipt image (JPG/PNG) — OCR extracts text,
    Gemini parses amount + merchant + category.
    Returns a prefilled expense dict for user to confirm.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file (JPG or PNG)")

    content = await file.read()

    # Use Gemini Vision for industrial-grade receipt parsing
    if settings.GEMINI_API_KEY:
        try:
            from google import genai
            from google.genai import types
            import json

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            
            prompt = """Extract details from this retail receipt and return ONLY valid JSON.
            Rules:
            1. 'amount' must be a number (the final total sum).
            2. 'merchant' should be the store or brand name.
            3. 'category' must be one of: [Food & Dining, Transport, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Travel, Investments, Rent, Other].
            4. 'date' should be in YYYY-MM-DD format.
            
            JSON format:
            {"amount": 123.45, "merchant": "Name", "category": "Category", "date": "YYYY-MM-DD"}"""

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    types.Part.from_bytes(data=content, mime_type=file.content_type),
                    prompt
                ]
            )

            match = re.search(r'\{.*?\}', response.text, re.DOTALL)
            if match:
                data = json.loads(match.group())
                
                # Normalize category
                cat = data.get("category", "Other")
                if "food" in cat.lower(): cat = "Food & Dining"
                elif "bill" in cat.lower() or "util" in cat.lower(): cat = "Bills & Utilities"

                prefill = {
                    "amount": data.get("amount"),
                    "description": data.get("merchant", "Receipt scan"),
                    "category": cat,
                    "expense_date": data.get("date") or str(date.today()),
                }
                return {"ocr_text": f"AI Scan: {prefill['description']}", "prefill": prefill}

        except Exception as e:
            print(f"[OCR Gemini Vision Error] {e}")

    # Fallback / Default return if AI fails
    return {
        "ocr_text": "Manual Entry Needed", 
        "prefill": {
            "amount": None,
            "description": "Receipt scan",
            "category": "Other",
            "expense_date": str(date.today()),
        }
    }
