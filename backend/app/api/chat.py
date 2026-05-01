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
import httpx, joblib

router = APIRouter(prefix="/api/chat", tags=["chat"])

# ── AI Brain Loader ──────────────────────────────────────────────────
BRAIN_PATH = os.path.join(os.path.dirname(__file__), '..', 'core', 'ml', 'intent_classifier.joblib')
BRAIN = None
try:
    if os.path.exists(BRAIN_PATH):
        BRAIN = joblib.load(BRAIN_PATH)
        print("[AI BRAIN] Level 3 Intelligence Loaded.")
except Exception as e:
    print(f"[AI BRAIN] Load failed: {e}")


class ChatMessage(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    expense_logged: Optional[dict] = None


# ── Smart Entity Extractor (The NER "Specialist") ──────────────────────
def smart_extract(text: str, predicted_cat: str, today: date):
    """
    Combines ML prediction with precise entity plucking.
    """
    text = text.lower().strip()
    
    # 1. Date Logic
    target_date = today
    if "yesterday" in text: target_date = today - timedelta(days=1)
    
    # 2. Amount Logic
    # Match numbers like 500, 500.50, 1,000
    amount_match = re.search(r'(\d+(?:,\d+)?(?:\.\d+)?)', text)
    if not amount_match: return None
    
    try:
        amount = float(amount_match.group(1).replace(',', ''))
    except:
        return None

    # 3. Merchant / Description Logic
    # Clean up the text to find the 'merchant'
    clean_text = re.sub(r'(\d+(?:,\d+)?(?:\.\d+)?)', '', text) # Remove amount
    clean_text = re.sub(r'\b(yesterday|today|rs|inr|rps|spent|paid|for|on|at|i)\b', '', clean_text)
    merchant = clean_text.strip().title() or predicted_cat

    return amount, predicted_cat, f"{merchant} (ML Log)", target_date


# ── LLM Adapter (Gemini / Groq) ──────────────────────────────────────────
def call_llm(messages: list) -> Optional[str]:
# ... (rest of the LLM code remains the same)
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
   - Note: Map Indian retailers like Dmart, Reliance, Zudio, Decathlon to 'Shopping'.
   - Map services like Swiggy, Zomato, Bigbasket, Blinkit, Zepto to 'Food & Dining'.
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
    # 1. Monthly Total
    m_start = date(today.year, today.month, 1)
    exp_m = db.query(Expense).filter(Expense.user_id == user_id, Expense.expense_date >= m_start).all()
    total_m = sum(e.amount for e in exp_m)
    
    # 2. Weekly Total
    w_start = today - timedelta(days=today.weekday())
    exp_w = db.query(Expense).filter(Expense.user_id == user_id, Expense.expense_date >= w_start).all()
    total_w = sum(e.amount for e in exp_w)

    # 3. Category Breakdown (Top 3)
    cat_data = db.query(Expense.category, func.sum(Expense.amount)).filter(
        Expense.user_id == user_id, Expense.expense_date >= m_start
    ).group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).limit(3).all()
    
    breakdown = ", ".join([f"{c}: ₹{a:,.0f}" for c, a in cat_data])
    
    return f"Month Total: ₹{total_m:,.0f}. Week Total: ₹{total_w:,.0f}. Top Categories: {breakdown}."


def fast_path_log(text: str, today_ref: date, user_categories: list = None):
    user_categories = user_categories or []
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
    
    # 1. Pattern: "coffee 100" (Keyword then Amount)
    match_a = re.search(r'^([a-z\s]+)\s+(\d+(?:\.\d+)?)$', text)
    if match_a:
        keyword, amount = match_a.groups()
        keyword = keyword.strip()
        # [LOCAL DYNAMIC MATCH] Check against user's custom categories (PRIORITY)
        for uc in user_categories:
            if keyword == uc.lower():
                return float(amount), uc, f"{uc} (Fast Log)", target_date

        if keyword in KEYWORD_CATEGORIES:
            return float(amount), KEYWORD_CATEGORIES[keyword], f"{keyword.capitalize()} (Fast Log)", target_date

    # 2. Pattern: "100 food" (Amount then Keyword)
    match_b = re.search(r'^(\d+(?:\.\d+)?)\s+([a-z\s]+)$', text)
    if match_b:
        amount, keyword = match_b.groups()
        keyword = keyword.strip()
        # [LOCAL DYNAMIC MATCH] Check against user's custom categories (PRIORITY)
        for uc in user_categories:
            if keyword == uc.lower():
                return float(amount), uc, f"{uc} (Fast Log)", target_date
            
        if keyword in KEYWORD_CATEGORIES:
            return float(amount), KEYWORD_CATEGORIES[keyword], f"{keyword.capitalize()} (Fast Log)", target_date
            
    return None, None, None, None


def fast_path_query(text: str, db: Session, user_id: int, today: date, predicted_cat: str = None, user_categories: list = None) -> Optional[str]:
    text = text.lower().strip()
    cat = predicted_cat
    valid_list = user_categories or []
    
    # 1. Fuzzy Timeframe Detection
    is_prev = re.search(r'\b(prev|last)\b', text) or "prevo" in text
    # ... (rest of detection remains same)
    has_week = "week" in text
    has_month = "month" in text
    has_today = "today" in text
    has_yesterday = "yesterday" in text
    has_overall = re.search(r'\b(overall|all time|alltime|since start|lifetime)\b', text)
    
    start_date = None
    end_date = None
    label = ""

    # Check for specific month names (e.g., "in January")
    month_names = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    found_month = None
    for i, m in enumerate(month_names):
        if m in text:
            found_month = i + 1
            break

    if has_overall:
        start_date = date(2000, 1, 1) # Effectively all time
        label = "overall"
    elif found_month:
        start_date = date(today.year if found_month <= today.month else today.year - 1, found_month, 1)
        next_month = start_date.month + 1
        next_year = start_date.year
        if next_month > 12:
            next_month = 1
            next_year += 1
        end_date = date(next_year, next_month, 1)
        label = f"in **{start_date.strftime('%B')}**"
    elif has_today:
        start_date = today
        label = "today"
    elif has_yesterday:
# ... (rest of timeframes remains)
        start_date = today - timedelta(days=1)
        label = "yesterday"
    elif has_week:
        # Start of current week (Monday)
        w_start = today - timedelta(days=today.weekday())
        if is_prev:
            start_date = w_start - timedelta(days=7)
            end_date = w_start
            label = "last week"
        else:
            start_date = w_start
            label = "this week"
    elif has_month:
        m_start = date(today.year, today.month, 1)
        if is_prev:
            last_m_end = m_start - timedelta(days=1)
            start_date = date(last_m_end.year, last_m_end.month, 1)
            end_date = m_start
            label = f"in **{start_date.strftime('%B')}**"
        else:
            start_date = m_start
            label = f"in **{today.strftime('%B')}**"

    # CONFIDENCE CHECK: If no timeframe detected, pass to Groq
    if not start_date:
        return None

    # 2. Handle Queries
    # Check if a category keyword is actually in the text
    cat_mentioned = False
    if cat:
        # Check against the User's Dynamic Category names
        if any(c.lower() in text for c in valid_list):
            cat_mentioned = True
        else:
            # Fallback to hardcoded keywords for the predicted category
            for k, c in KEYWORD_CATEGORIES.items():
                if c == cat and k in text:
                    cat_mentioned = True
                    break

    if cat and cat_mentioned and re.search(r'\b(spent|how much|total|spet|cost)\b', text):
        query = db.query(func.sum(Expense.amount)).filter(Expense.user_id == user_id, Expense.category == cat)
        if end_date:
            query = query.filter(Expense.expense_date >= start_date, Expense.expense_date < end_date)
        elif has_today or has_yesterday:
            query = query.filter(Expense.expense_date == start_date)
        else:
            query = query.filter(Expense.expense_date >= start_date)
            
        total = query.scalar() or 0
        return f"⚡ **{cat}**: You spent ₹{total:,.0f} **{label}**."

    # General Total (Fallback if no specific category mentioned)
    if re.search(r'\b(total|spent|spet|how much|expense)\b', text):
        query = db.query(func.sum(Expense.amount)).filter(Expense.user_id == user_id)
        if end_date:
            query = query.filter(Expense.expense_date >= start_date, Expense.expense_date < end_date)
        elif has_today or has_yesterday:
            query = query.filter(Expense.expense_date == start_date)
        else:
            query = query.filter(Expense.expense_date >= start_date)
            
        total = query.scalar() or 0
        return f"⚡ **Total**: ₹{total:,.0f} spent **{label}**."

    return None

    # 5. Handle Budget Inquiries (Instant Budget Shield)
    if re.search(r'\b(budget|limit|remaining|left|overspent)\b', text):
        cat = get_cat(text)
        from app.models.budget import Budget
        if cat:
            budget = db.query(Budget).filter(Budget.user_id == user_id, Budget.category == cat).first()
            if budget:
                m_start = date(today.year, today.month, 1)
                spent = db.query(func.sum(Expense.amount)).filter(Expense.user_id == user_id, Expense.category == cat, Expense.expense_date >= m_start).scalar() or 0
                remaining = (budget.amount or 0) - spent
                status = "✅ Within limit" if remaining >= 0 else "🚨 Overspent!"
                return f"🛡️ **Budget ({cat})**: ₹{remaining:,.0f} remaining. {status}."
        return "🛡️ **Budget Tip**: Ask about a specific category, like 'How much food budget is left?'"

    # 6. Handle Comparison Queries (NEW: Comparison Engine)
    if re.search(r'\b(compare|more than|less than|higher|lower|previous)\b', text):
        cat = get_cat(text)
        # Compare current vs previous
        current_start = start_date
        prev_start = current_start - (today - current_start + timedelta(days=1))
        
        q_curr = db.query(func.sum(Expense.amount)).filter(Expense.user_id == user_id, Expense.expense_date >= current_start)
        q_prev = db.query(func.sum(Expense.amount)).filter(Expense.user_id == user_id, Expense.expense_date >= prev_start, Expense.expense_date < current_start)
        
        if cat:
            q_curr = q_curr.filter(Expense.category == cat)
            q_prev = q_prev.filter(Expense.category == cat)
            
        curr_total = q_curr.scalar() or 0
        prev_total = q_prev.scalar() or 0
        
        diff = curr_total - prev_total
        percent = (diff / prev_total * 100) if prev_total > 0 else 0
        trend = "📈 UP" if diff > 0 else "📉 DOWN"
        
        label_cat = f"on **{cat}**" if cat else "in total"
        return f"📊 **Comparison**: You've spent ₹{abs(diff):,.0f} {trend} ({abs(percent):.1f}%) {label_cat} compared to the previous period."

    return None

    return None


class ChatResponse(BaseModel):
    reply: str
    expense_logged: Optional[dict] = None
    preview_expense: Optional[dict] = None


@router.post("", response_model=ChatResponse)
def chat(
    payload: ChatMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    msg = payload.message.strip()
    today = date.today()
    load_dotenv()

    # ── [OFFLINE LAYER] FETCH DYNAMIC CATEGORIES ──
    from app.models.category import Category
    user_cats = db.query(Category).filter(Category.user_id == current_user.id).all()
    user_cat_names = [c.name for c in user_cats]

    # ── [GREEDY OFFLINE MATCH] ──
    # If natural language is used but contains a custom category name and an amount, catch it here.
    amount_match = re.search(r'(\d+(?:\.\d+)?)', msg)
    if amount_match:
        amount_val = float(amount_match.group(1).replace(',', ''))
        for uc in user_cat_names:
            # We check if the custom category name is a standalone word in the message
            if re.search(rf'\b{re.escape(uc)}\b', msg, re.IGNORECASE):
                return ChatResponse(
                    reply=f"I've recognized your custom category **{uc}**! Log ₹{amount_val:,.0f}?",
                    preview_expense={
                        "amount": int(amount_val), 
                        "category": uc, 
                        "date": str(today), 
                        "description": msg
                    }
                )

    # ── PATH 1: Fast-Path (Extraction only, no save - OFFLINE)
    fast_amount, fast_cat, fast_desc, fast_date = fast_path_log(msg, today, user_categories=user_cat_names)
    if fast_amount:
        return ChatResponse(
            reply=f"I've prepared this expense for you. Does it look correct?",
            preview_expense={
                "amount": int(fast_amount), 
                "category": fast_cat, 
                "date": str(fast_date), 
                "description": fast_desc
            }
        )
    
    # ── PATH 2: Machine Learning Path (Extraction only, no save)
    pred_cat = None
    if BRAIN:
        try:
            pred_cat = BRAIN.predict([msg])[0]
            ml_amount, ml_cat, ml_desc, ml_date = smart_extract(msg, pred_cat, today)
            
            if ml_amount:
                return ChatResponse(
                    reply=f"Recognized a new expense! Ready to log?",
                    preview_expense={
                        "amount": int(ml_amount), 
                        "category": ml_cat, 
                        "date": str(ml_date),
                        "description": ml_desc
                    }
                )
        except Exception as e:
            print(f"[AI Brain Failure] {e}")

    # ── PATH 3: Fast-Query (Instant Analytics)
    fast_reply = fast_path_query(msg, db, current_user.id, today, predicted_cat=pred_cat, user_categories=user_cat_names)
    if fast_reply: return ChatResponse(reply=fast_reply)

    # ── PATH 4: AI Path (Dynamic Fallback)
    try:
        context = build_spending_context(db, current_user.id, today)
        parsed = parse_with_llm(msg, context, today)
        if parsed:
            intent = parsed.get("intent", "general")
            if intent == "add_expense" and parsed.get("amount"):
                amount = float(parsed.get("amount"))
                category = parsed.get("category") or "Other"
                description = parsed.get("description") or msg
                expense_date = parsed.get("expense_date") or str(today)
                return ChatResponse(
                    reply=parsed.get("reply", "I've extracted the details for you."),
                    preview_expense={
                        "amount": int(amount), 
                        "category": category, 
                        "description": description,
                        "date": expense_date
                    }
                )
            return ChatResponse(reply=parsed.get("reply", "How can I help?"))
    except Exception as e:
        print(f"[Chat AI Failure] {e}")

    return ChatResponse(reply="I didn't understand. Try **'spent 500 on food'**.")
