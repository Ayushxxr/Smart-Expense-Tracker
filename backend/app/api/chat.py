from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from pydantic import BaseModel
from datetime import date, timedelta
from typing import Optional
import re, json

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.expense import Expense

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessage(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    expense_logged: Optional[dict] = None


# ── Fallback keyword map (used ONLY when Gemini is unavailable) ──────────────
KEYWORD_CATEGORIES = {
    # Food & Dining
    "swiggy": "Food & Dining", "zomato": "Food & Dining", "dominos": "Food & Dining",
    "domino": "Food & Dining", "pizza": "Food & Dining", "restaurant": "Food & Dining",
    "food": "Food & Dining", "chai": "Food & Dining", "coffee": "Food & Dining",
    "lunch": "Food & Dining", "dinner": "Food & Dining", "breakfast": "Food & Dining",
    "snack": "Food & Dining", "groceries": "Food & Dining", "grocery": "Food & Dining",
    "vegetables": "Food & Dining", "barbeque": "Food & Dining", "bbq": "Food & Dining",
    "cafe": "Food & Dining", "dhaba": "Food & Dining", "biryani": "Food & Dining",
    "burger": "Food & Dining", "maggi": "Food & Dining", "eat": "Food & Dining",
    "meal": "Food & Dining", "juice": "Food & Dining", "milk": "Food & Dining",
    "bread": "Food & Dining", "hotel food": "Food & Dining", "tiffin": "Food & Dining",

    # Transport
    "uber": "Transport", "ola": "Transport", "rapido": "Transport",
    "metro": "Transport", "bus": "Transport", "petrol": "Transport", "fuel": "Transport",
    "auto": "Transport", "taxi": "Transport", "rickshaw": "Transport", "cab": "Transport",
    "parking": "Transport", "toll": "Transport", "diesel": "Transport",
    "bike service": "Transport", "car service": "Transport", "train ticket": "Transport",

    # Shopping
    "amazon": "Shopping", "flipkart": "Shopping", "myntra": "Shopping",
    "clothes": "Shopping", "shirt": "Shopping", "shoes": "Shopping", "mall": "Shopping",
    "meesho": "Shopping", "ajio": "Shopping", "nykaa": "Shopping", "decathlon": "Shopping",
    "jeans": "Shopping", "dress": "Shopping", "bag": "Shopping", "watch": "Shopping",
    "mobile": "Shopping", "phone": "Shopping", "laptop": "Shopping", "earphone": "Shopping",
    "big bazaar": "Shopping", "dmart": "Shopping", "reliance": "Shopping",

    # Entertainment
    "netflix": "Entertainment", "spotify": "Entertainment", "movie": "Entertainment",
    "hotstar": "Entertainment", "prime": "Entertainment", "game": "Entertainment",
    "youtube": "Entertainment", "disney": "Entertainment", "zee5": "Entertainment",
    "sonyliv": "Entertainment", "concert": "Entertainment", "event": "Entertainment",
    "cricket": "Entertainment", "pub": "Entertainment", "bar": "Entertainment",
    "outing": "Entertainment", "hangout": "Entertainment",

    # Bills & Utilities
    "electricity": "Bills & Utilities", "internet": "Bills & Utilities",
    "jio": "Bills & Utilities", "airtel": "Bills & Utilities", "recharge": "Bills & Utilities",
    "bsnl": "Bills & Utilities", "vi ": "Bills & Utilities", "vodafone": "Bills & Utilities",
    "water bill": "Bills & Utilities", "gas bill": "Bills & Utilities",
    "broadband": "Bills & Utilities", "dth": "Bills & Utilities", "wifi": "Bills & Utilities",
    "mobile bill": "Bills & Utilities", "postpaid": "Bills & Utilities",

    # Healthcare
    "hospital": "Healthcare", "medicine": "Healthcare", "doctor": "Healthcare",
    "pharmacy": "Healthcare", "medplus": "Healthcare", "apollo": "Healthcare",
    "clinic": "Healthcare", "medical": "Healthcare", "tablet": "Healthcare",
    "health": "Healthcare", "checkup": "Healthcare", "test": "Healthcare",
    "1mg": "Healthcare", "netmeds": "Healthcare", "pharmeasy": "Healthcare",

    # Education
    "school": "Education", "college": "Education", "course": "Education",
    "udemy": "Education", "tuition": "Education", "book": "Education",
    "coursera": "Education", "unacademy": "Education", "byju": "Education",
    "fee": "Education", "fees": "Education", "exam": "Education",
    "study": "Education", "coaching": "Education", "class": "Education",

    # Travel
    "flight": "Travel", "hotel": "Travel", "train": "Travel", "irctc": "Travel",
    "makemytrip": "Travel", "goibibo": "Travel", "oyo": "Travel",
    "trip": "Travel", "tour": "Travel", "holiday": "Travel", "vacation": "Travel",
    "airbnb": "Travel", "hostel": "Travel", "resort": "Travel",

    # Investments
    "mutual fund": "Investments", "sip": "Investments", "zerodha": "Investments",
    "groww": "Investments", "stock": "Investments", "etf": "Investments",
    "invest": "Investments", "investment": "Investments", "nifty": "Investments",
    "sensex": "Investments", "equity": "Investments", "demat": "Investments",
    "shares": "Investments", "share": "Investments", "crypto": "Investments",
    "bitcoin": "Investments", "gold": "Investments", "ppf": "Investments",
    "fd": "Investments", "fixed deposit": "Investments", "rd": "Investments",
    "recurring deposit": "Investments", "lic": "Investments", "insurance": "Investments",
    "upstox": "Investments", "angel": "Investments", "kuvera": "Investments",

    # Rent
    "rent": "Rent", "landlord": "Rent", "pg": "Rent", "paying guest": "Rent",
    "hostel rent": "Rent", "room rent": "Rent", "flat rent": "Rent",
}

VALID_CATEGORIES = [
    "Food & Dining", "Transport", "Shopping", "Entertainment",
    "Bills & Utilities", "Healthcare", "Education", "Travel",
    "Investments", "Rent", "Salary", "Groceries", "Other"
]


# ── Gemini helper (new google-genai SDK) ─────────────────────────────────────
def call_gemini(prompt: str) -> Optional[str]:
    if not settings.GEMINI_API_KEY:
        return None
    try:
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"[Gemini Error] {e}")
        return None


# ── Gemini-powered full chat handler ─────────────────────────────────────────
def parse_with_gemini(user_message: str, spending_context: str, today: date) -> dict:
    """
    Ask Gemini to:
      1. Classify intent: add_expense | query | general
      2. If add_expense: extract amount, category, date, description
      3. If query: answer from spending_context
    Returns a dict with parsed fields.
    """
    yesterday = (today - timedelta(days=1)).isoformat()
    last_week = (today - timedelta(days=7)).isoformat()

    prompt = f"""You are an AI expense tracking assistant. Today's date is {today.isoformat()}.

The user said: "{user_message}"

User's financial context (current month):
{spending_context}

Your job:
1. Determine the INTENT:
   - "add_expense" if the user is logging money they spent/paid/bought/ordered/dropped/gave/wasted/used/recharged/transferred/debited/invested etc.
   - "query" if the user is asking about their spending, totals, categories, or insights.
   - "general" for greetings, help requests, or unrelated messages.

2. If intent is "add_expense", extract:
   - amount: the numeric value in rupees (required, just the number)
   - category: pick the BEST match from [{', '.join(VALID_CATEGORIES)}]
   - expense_date: in YYYY-MM-DD format. "yesterday"={yesterday}, "last week"={last_week}, otherwise={today.isoformat()}
   - description: a short clean label (e.g. "Zomato dinner", "Rapido cab", "Big Bazaar groceries")

3. Write a friendly, concise reply in Indian English using the ₹ symbol.

Respond in this EXACT JSON format with NO extra text or markdown:
{{"intent": "add_expense", "amount": 500, "category": "Food & Dining", "expense_date": "{today.isoformat()}", "description": "Zomato order", "reply": "✅ Logged ₹500 under Food & Dining for today!"}}"""

    raw = call_gemini(prompt)
    if not raw:
        return None

    # Strip markdown code fences if Gemini wraps response
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE).strip()
    raw = re.sub(r"\s*```$", "", raw).strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Try to find JSON object anywhere in the text
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except Exception:
                pass
    return None


# ── Fallback regex parser (offline / no Gemini key) ──────────────────────────
def parse_expense_fallback(text: str):
    text_lower = text.lower()
    amount_match = re.search(r'(?:₹|rs\.?|inr\s*)?\s*(\d+(?:\.\d{1,2})?)', text, re.IGNORECASE)
    amount = float(amount_match.group(1)) if amount_match else None

    txn_date = date.today()
    if "yesterday" in text_lower:
        txn_date = date.today() - timedelta(days=1)
    elif "last week" in text_lower:
        txn_date = date.today() - timedelta(days=7)

    category = "Other"
    for keyword, cat in KEYWORD_CATEGORIES.items():
        if keyword in text_lower:
            category = cat
            break

    return amount, category, txn_date


def is_add_intent_fallback(text: str) -> bool:
    add_keywords = [
        "spent", "paid", "bought", "spend", "purchased", "ordered",
        "got", "took", "gave", "dropped", "used", "wasted", "charged",
        "debited", "transferred", "sent", "invested", "subscribed", "recharged",
        "deposit", "withdraw", "billed", "rented", "booked", "hired",
        "fees", "fee", "rent", "insurance", "sip", "etf", "invest",
    ]
    return any(kw in text.lower() for kw in add_keywords)


def is_query_intent_fallback(text: str) -> bool:
    query_keywords = [
        "how much", "total", "spent on", "show", "what", "my",
        "tell me", "summary", "this month", "last month", "breakdown"
    ]
    return any(kw in text.lower() for kw in query_keywords)


# ── Build spending context string for Gemini ──────────────────────────────────
def build_spending_context(db: Session, user_id, today: date) -> str:
    expenses = db.query(Expense).filter(
        Expense.user_id == user_id,
        extract("year", Expense.expense_date) == today.year,
        extract("month", Expense.expense_date) == today.month,
    ).all()

    if not expenses:
        return "No expenses recorded this month yet."

    total = sum(e.amount for e in expenses)
    by_cat = {}
    for e in expenses:
        by_cat[e.category] = by_cat.get(e.category, 0) + e.amount

    top = max(by_cat, key=by_cat.get)
    breakdown = ", ".join(
        f"{cat}: ₹{amt:.0f}"
        for cat, amt in sorted(by_cat.items(), key=lambda x: -x[1])
    )
    return (
        f"Total spent this month: ₹{total:.0f} across {len(expenses)} transactions. "
        f"Top category: {top} (₹{by_cat[top]:.0f}). "
        f"Breakdown: {breakdown}."
    )


# ── Main chat endpoint ────────────────────────────────────────────────────────
@router.post("", response_model=ChatResponse)
def chat(
    payload: ChatMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    msg = payload.message.strip()
    today = date.today()
    
    # ── Try Gemini-powered parsing first ──────────────────────────────────────
    if settings.GEMINI_API_KEY:
        # Build initial context for Gemini's intelligence
        pre_save_context = build_spending_context(db, current_user.id, today)
        parsed = parse_with_gemini(msg, pre_save_context, today)

        if parsed:
            intent = parsed.get("intent", "general")

            # --- Gemini: Add Expense ---
            if intent == "add_expense":
                amount = parsed.get("amount")
                category = parsed.get("category") or "Other"
                description = parsed.get("description") or msg[:200]
                expense_date_str = parsed.get("expense_date")
                reply = parsed.get("reply", f"✅ Logged ₹{amount} under {category}.")

                # Validate category (match singular/plural/case)
                category_match = next((c for c in VALID_CATEGORIES if c.lower() in category.lower() or category.lower() in c.lower()), "Other")
                category = category_match

                # Parse date safely
                try:
                    expense_date = date.fromisoformat(expense_date_str) if expense_date_str else today
                except (ValueError, TypeError):
                    expense_date = today

                if amount and float(amount) > 0:
                    expense = Expense(
                        user_id=current_user.id,
                        amount=float(amount),
                        category=category,
                        description=description,
                        expense_date=expense_date,
                        source="ai_chat"
                    )
                    db.add(expense)
                    db.commit()
                    db.refresh(expense)
                    
                    # Get FRESH context after save so the reply is accurate
                    fresh_context = build_spending_context(db, current_user.id, today)
                    reply = parsed.get("reply", f"✅ Logged ₹{amount} under **{category}**.")
                    
                    # If this is a log, tell them their new total
                    try:
                        total_now = sum(e.amount for e in db.query(Expense).filter(
                            Expense.user_id == current_user.id,
                            extract("month", Expense.expense_date) == today.month,
                            extract("year", Expense.expense_date) == today.year
                        ).all())
                        if "month" not in reply.lower():
                            reply += f" Your total for this month is now ₹{total_now:,.0f}."
                    except: pass

                    return ChatResponse(
                        reply=reply,
                        expense_logged={
                            "amount": float(amount),
                            "category": category,
                            "date": str(expense_date),
                            "description": description,
                        }
                    )
                else:
                    return ChatResponse(
                        reply="I understood you spent something, but couldn't find the amount. Try: 'spent ₹500 on food'"
                    )

            # --- Gemini: Query ---
            elif intent == "query":
                # Get fresh context for the query answer
                fresh_context = build_spending_context(db, current_user.id, today)
                # Re-parse or just use the fresh context
                return ChatResponse(
                    reply=parsed.get("reply", "📊 Here's your spending summary:\n\n" + fresh_context)
                )

            # --- Gemini: General ---
            else:
                return ChatResponse(reply=parsed.get(
                    "reply",
                    "I can help you:\n"
                    "• **Log expenses** — 'spent 300 on Zomato' or 'dropped 500 at mall'\n"
                    "• **Check spending** — 'how much did I spend this month?'\n"
                    "• **Category totals** — 'how much on food last week?'"
                ))

    # ── Fallback: keyword-based (no Gemini key or Gemini parse failed) ────────
    if is_add_intent_fallback(msg):
        amount, category, txn_date = parse_expense_fallback(msg)
        if amount and amount > 0:
            expense = Expense(
                user_id=current_user.id,
                amount=amount,
                category=category,
                description=msg[:200],
                expense_date=txn_date,
                source="ai_chat"
            )
            db.add(expense)
            db.commit()
            db.refresh(expense)
            
            # Post-save calculation for fallback
            total_now = sum(e.amount for e in db.query(Expense).filter(
                Expense.user_id == current_user.id,
                extract("month", Expense.expense_date) == today.month,
                extract("year", Expense.expense_date) == today.year
            ).all())
            
            date_str = "today" if txn_date == today else str(txn_date)
            return ChatResponse(
                reply=f"✅ Logged ₹{amount:.0f} under **{category}** for {date_str}. Your total for this month is now ₹{total_now:,.0f}.",
                expense_logged={"amount": amount, "category": category, "date": str(txn_date)}
            )
        else:
            return ChatResponse(
                reply="I understood you spent something, but couldn't find the amount. Try: 'spent 500 on food'"
            )

    if is_query_intent_fallback(msg):
        fresh_context = build_spending_context(db, current_user.id, today)
        return ChatResponse(reply="📊 " + fresh_context)

    return ChatResponse(reply=(
        "I can help you:\n"
        "• **Log expenses** — 'spent 300 on Zomato' or 'dropped 500 at Big Bazaar'\n"
        "• **Check spending** — 'how much did I spend this month?'\n"
        "• **Category totals** — 'how much on food last week?'"
    ))
