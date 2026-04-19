from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from pydantic import BaseModel
from datetime import date, timedelta
from typing import Optional
import re, json, os, textwrap
from dotenv import load_dotenv

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.expense import Expense, CATEGORIES as VALID_CATEGORIES
from app.core.keywords import KEYWORD_CATEGORIES
import httpx

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessage(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    expense_logged: Optional[dict] = None


# ── LLM Adapter (Gemini / Groq) ──────────────────────────────────────────
def call_llm(messages: list) -> Optional[str]:
    active_provider = os.getenv("LLM_PROVIDER") or settings.LLM_PROVIDER
    groq_key = os.getenv("GROQ_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")

    if active_provider == "groq" and groq_key:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": messages,
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }
        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"[Groq API Error] {e}")
    
    if gemini_key:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
        gemini_payload = {
            "contents": [{"parts": [{"text": m["content"]} for m in messages]}],
            "generationConfig": {"response_mime_type": "application/json", "temperature": 0.1}
        }
        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.post(url, json=gemini_payload)
                response.raise_for_status()
                res_data = response.json()
                if "candidates" in res_data and res_data["candidates"]:
                    return res_data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            if hasattr(e, 'response') and e.response is not None:
                print(f"[Gemini API Error] {e.response.status_code}: {e.response.text}")
            else:
                print(f"[Gemini API Error] {e}")
    return None


def parse_with_llm(user_message: str, spending_context: str, today: date) -> dict:
    prompt = f"""You are 'Elite Assistant', a premium fintech AI Finance Manager.
Today is {today.strftime("%A, %B %d, %Y")}.

REAL-TIME USER DATA:
{spending_context}

YOUR CORE ABILITIES:
1. LOG EXPENSES: Detect transaction intent and extract (amount, category, date, description).
2. ANSWER QUERIES: Use the DATA CONTEXT to answer questions about spending or comparisons.

INSTRUCTIONS:
- Return JSON with 'intent', 'reply', and optionally 'amount', 'category', 'expense_date', 'description'.
"""
    messages = [{"role": "user", "content": prompt + f"\nUser Input: {user_message}"}]
    raw = call_llm(messages)
    if not raw: return {"intent": "general", "reply": "AI is momentarily offline. Using local logic..."}
    try:
        return json.loads(raw)
    except:
        return {"intent": "general", "reply": "Error parsing AI response."}


def build_spending_context(db: Session, user_id, today: date) -> str:
    month_start = date(today.year, today.month, 1)
    expenses_month = db.query(Expense).filter(Expense.user_id == user_id, Expense.expense_date >= month_start).all()
    total = sum(e.amount for e in expenses_month)
    return f"Total spent this month: ₹{total:.0f}."


def fast_path_log(text: str, today_ref: date):
    text = text.lower().strip()
    target_date = today_ref
    date_prefix_match = re.search(r'^(yesterday|today)\s+', text)
    if date_prefix_match:
        if date_prefix_match.group(1) == "yesterday": target_date = today_ref - timedelta(days=1)
        text = re.sub(r'^(yesterday|today)\s+', '', text).strip()

    text = re.sub(r'^(i\s+)?(have\s+)?(spent|logged|log|please log)\s+', '', text)
    text = re.sub(r'(\d+)(rps|rs|inr)\b', r'\1', text) 
    text = re.sub(r'\b(rs|inr|rps)\s+', '', text)
    text = re.sub(r'\s+(on|for|at|in|a|an)\s+', ' ', text)
    
    match_a = re.search(r'^([a-z\s]+)\s+(\d+(?:\.\d+)?)$', text)
    if match_a:
        keyword, amount = match_a.groups()
        keyword = keyword.strip()
        if keyword in KEYWORD_CATEGORIES:
            return float(amount), KEYWORD_CATEGORIES[keyword], f"{keyword.capitalize()} (Fast Log)", target_date

    match_b = re.search(r'^(\d+(?:\.\d+)?)\s+([a-z\s]+)$', text)
    if match_b:
        amount, keyword = match_b.groups()
        keyword = keyword.strip()
        if keyword in KEYWORD_CATEGORIES:
            return float(amount), KEYWORD_CATEGORIES[keyword], f"{keyword.capitalize()} (Fast Log)", target_date
    return None, None, None, None


def fast_path_query(text: str, db: Session, user_id: int, today: date) -> Optional[str]:
    text = text.lower().strip()
    def get_cat(q):
        for c in VALID_CATEGORIES:
            if c.lower() in q: return c
        for k, c in KEYWORD_CATEGORIES.items():
            if k in q: return c
        return None

    # 1. TIME-BASED TOTALS
    if re.search(r'\b(total spent|how much spent|total expense)\b', text):
        month_start = date(today.year, today.month, 1)
        total = db.query(func.sum(Expense.amount)).filter(Expense.user_id == user_id, Expense.expense_date >= month_start).scalar() or 0
        return f"⚡ **Month Total**: ₹{total:,.0f} spent so far in **{today.strftime('%B')}**."

    if re.search(r'\b(spent today|today\'?s? total)\b', text):
        total = db.query(func.sum(Expense.amount)).filter(Expense.user_id == user_id, Expense.expense_date == today).scalar() or 0
        return f"⚡ **Today's Spend**: You've spent ₹{total:,.0f} today."

    if re.search(r'\b(spent yesterday|yesterday\'?s? total)\b', text):
        yest = today - timedelta(days=1)
        total = db.query(func.sum(Expense.amount)).filter(Expense.user_id == user_id, Expense.expense_date == yest).scalar() or 0
        return f"⚡ **Yesterday's Spend**: ₹{total:,.0f} logged for yesterday."

    if "on " in text and ("spent" in text or "how much" in text):
        cat = get_cat(text)
        if cat:
            m_start = date(today.year, today.month, 1)
            total = db.query(func.sum(Expense.amount)).filter(Expense.user_id == user_id, Expense.category == cat, Expense.expense_date >= m_start).scalar() or 0
            return f"⚡ **{cat}**: Monthly total is ₹{total:,.0f}."
            
    if "breakdown" in text:
        summary = build_spending_context(db, user_id, today)
        return f"⚡ **Fast Breakdown**:\n{summary}"

    return None


@router.post("", response_model=ChatResponse)
def chat(
    payload: ChatMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    msg = payload.message.strip()
    today = date.today()
    load_dotenv()

    # ── PATH 1: Fast-Path (Instant Logging)
    fast_amount, fast_cat, fast_desc, fast_date = fast_path_log(msg, today)
    if fast_amount:
        expense = Expense(user_id=current_user.id, amount=fast_amount, category=fast_cat, description=fast_desc, expense_date=fast_date, source="ai_chat")
        db.add(expense)
        db.commit()
        db.refresh(expense)
        return ChatResponse(reply=f"⚡ **Fast Logged**: ₹{fast_amount:,.0f} for **{fast_cat}**.", expense_logged={"amount": fast_amount, "category": fast_cat, "date": str(fast_date), "description": fast_desc})

    # ── PATH 2: Fast-Query (Instant Analytics)
    fast_reply = fast_path_query(msg, db, current_user.id, today)
    if fast_reply: return ChatResponse(reply=fast_reply)

    # ── PATH 3: AI Path (Dynamic Fallback)
    try:
        context = build_spending_context(db, current_user.id, today)
        parsed = parse_with_llm(msg, context, today)
        if parsed:
            intent = parsed.get("intent", "general")
            if intent == "add_expense" and parsed.get("amount"):
                # Handle logging
                amount = float(parsed.get("amount"))
                category = parsed.get("category") or "Other"
                description = parsed.get("description") or msg
                expense = Expense(user_id=current_user.id, amount=amount, category=category, description=description, expense_date=today, source="ai_chat")
                db.add(expense)
                db.commit()
                return ChatResponse(reply=parsed.get("reply", "✅ Logged."), expense_logged={"amount": amount, "category": category})
            return ChatResponse(reply=parsed.get("reply", "How can I help?"))
    except Exception as e:
        print(f"[Chat AI Failure] {e}")

    return ChatResponse(reply="I'm here to help! Try 'coffee 150' or ask 'how much did I spend?'")
