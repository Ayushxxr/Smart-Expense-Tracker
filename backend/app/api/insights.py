from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date
from collections import defaultdict

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.expense import Expense
from app.models.budget import Budget

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("/health")
def get_health_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calculate Financial Health Score (0–100)."""
    today = date.today()
    year, month = today.year, today.month

    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        extract("year", Expense.expense_date) == year,
        extract("month", Expense.expense_date) == month,
    ).all()

    total_spent = sum(e.amount for e in expenses)

    # Budget adherence score (35 pts)
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month_year == f"{year}-{month:02d}"
    ).all()

    budget_score = 25  # default no budgets set
    if budgets:
        by_cat = defaultdict(float)
        for e in expenses:
            by_cat[e.category] += e.amount
        within = sum(1 for b in budgets if by_cat.get(b.category, 0) <= b.limit_amount)
        budget_score = round((within / len(budgets)) * 35)

    # Spending stability score (25 pts)
    if len(expenses) > 3:
        daily = defaultdict(float)
        for e in expenses:
            daily[str(e.expense_date)] += e.amount
        amounts = list(daily.values())
        mean = sum(amounts) / len(amounts)
        variance = sum((x - mean) ** 2 for x in amounts) / len(amounts)
        std = variance ** 0.5
        cv = std / mean if mean > 0 else 1
        stability_score = max(0, round(25 * (1 - min(cv, 1))))
    else:
        stability_score = 15

    # Savings score (40 pts) — uses user's actual income if set
    assumed_income = current_user.monthly_income or 50000
    savings_rate = max(0, (assumed_income - total_spent) / assumed_income)
    if savings_rate >= 0.3:
        savings_score = 40
    elif savings_rate >= 0.15:
        savings_score = 25
    elif savings_rate >= 0.05:
        savings_score = 12
    else:
        savings_score = 3

    total_score = min(100, budget_score + stability_score + savings_score)

    if total_score >= 80:
        grade, label = "A", "Excellent 🟢"
    elif total_score >= 60:
        grade, label = "B", "Good 🟡"
    elif total_score >= 40:
        grade, label = "C", "Fair 🟠"
    else:
        grade, label = "D", "Needs Work 🔴"

    # 50/30/20 Rule Logic
    rule_data = {"needs": 0, "wants": 0, "savings": 0}
    needs_cats = ["Bills & Utilities", "Healthcare", "Education", "Transport"]
    wants_cats = ["Food & Dining", "Shopping", "Entertainment", "Travel", "Other"]
    savings_cats = ["Investments"]

    for e in expenses:
        if e.category in needs_cats:
            rule_data["needs"] += e.amount
        elif e.category in wants_cats:
            rule_data["wants"] += e.amount
        elif e.category in savings_cats:
            rule_data["savings"] += e.amount

    income = current_user.monthly_income or 50000
    rule_data["savings"] += max(0, income - total_spent) # Assume remaining is saved

    rule_percents = {
        "needs": round((rule_data["needs"] / income) * 100, 1),
        "wants": round((rule_data["wants"] / income) * 100, 1),
        "savings": round((rule_data["savings"] / income) * 100, 1),
    }

    return {
        "score": total_score,
        "grade": grade,
        "label": label,
        "breakdown": {
            "savings": savings_score,
            "budget_adherence": budget_score,
            "stability": stability_score,
        },
        "rule_50_30_20": rule_percents,
        "total_spent_this_month": round(total_spent, 2),
        "transaction_count": len(expenses),
        "monthly_income": income
    }


@router.get("/tips")
def get_tips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate smart spending tips based on user data."""
    today = date.today()
    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        extract("year", Expense.expense_date) == today.year,
        extract("month", Expense.expense_date) == today.month,
    ).all()

    by_cat = defaultdict(float)
    for e in expenses:
        by_cat[e.category] += e.amount

    total = sum(by_cat.values()) or 1
    tips = []

    # Food tip
    food_spend = by_cat.get("Food & Dining", 0)
    if food_spend / total > 0.35:
        tips.append({
            "icon": "🍔",
            "title": "High Food Spending",
            "message": f"You've spent ₹{food_spend:.0f} on Food & Dining — {food_spend/total*100:.0f}% of your total. Try cooking at home 2 extra days/week.",
            "type": "warning"
        })

    # Shopping tip
    shopping = by_cat.get("Shopping", 0)
    if shopping / total > 0.25:
        tips.append({
            "icon": "🛍️",
            "title": "Shopping Alert",
            "message": f"Shopping is at ₹{shopping:.0f} this month. Consider a 24-hour rule before impulse buys.",
            "type": "warning"
        })

    # Good savings tip
    if total < 30000:
        tips.append({
            "icon": "💰",
            "title": "Great Savings!",
            "message": f"You're spending ₹{total:.0f} this month. You're on track to save well!",
            "type": "success"
        })

    # Generic tips if not enough data
    if not tips:
        tips = [
            {"icon": "📊", "title": "Set Budgets", "message": "Set monthly budgets per category to track spending limits.", "type": "info"},
            {"icon": "🎯", "title": "50/30/20 Rule", "message": "Try spending 50% on needs, 30% on wants, and saving 20% each month.", "type": "info"},
            {"icon": "📱", "title": "Import Statement", "message": "Import your bank statement to get a full picture instantly.", "type": "info"},
        ]

    return {"tips": tips, "total_spent": round(total, 2)}


@router.get("/anomalies")
def get_anomalies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Detect unusually high transactions using simple z-score method."""
    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id
    ).order_by(Expense.expense_date.desc()).limit(200).all()

    if len(expenses) < 5:
        return {"anomalies": []}

    amounts = [e.amount for e in expenses]
    mean = sum(amounts) / len(amounts)
    std = (sum((x - mean) ** 2 for x in amounts) / len(amounts)) ** 0.5

    anomalies = []
    for e in expenses:
        z = (e.amount - mean) / std if std > 0 else 0
        if z > 2.0:  # more than 2 std devs above mean
            anomalies.append({
                "id": e.id,
                "amount": e.amount,
                "category": e.category,
                "description": e.description,
                "date": str(e.expense_date),
                "z_score": round(z, 2),
                "message": f"This ₹{e.amount:.0f} transaction is unusually high compared to your average (₹{mean:.0f})"
            })

    return {"anomalies": anomalies[:10], "avg_transaction": round(mean, 2)}
