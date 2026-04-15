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

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_summary(
    month: str = None,  # "YYYY-MM" or "all"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    
    if month and month != "all":
        year, m = map(int, month.split("-"))
        query = query.filter(
            extract("year", Expense.expense_date) == year,
            extract("month", Expense.expense_date) == m
        )
    
    expenses = query.all()
    total_spent = sum(e.amount for e in expenses)
    by_category = defaultdict(float)
    for e in expenses:
        by_category[e.category] += e.amount

    # Previous month comparison (skip if "all")
    prev_expenses = 0
    change_pct = 0
    if month != "all":
        today = date.today()
        if month:
            year, m = map(int, month.split("-"))
        else:
            year, m = today.year, today.month
            
        prev_m, prev_y = (m - 1, year) if m > 1 else (12, year - 1)
        prev_expenses = db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == current_user.id,
            extract("year", Expense.expense_date) == prev_y,
            extract("month", Expense.expense_date) == prev_m
        ).scalar() or 0
        change_pct = round(((total_spent - prev_expenses) / prev_expenses * 100) if prev_expenses > 0 else 0, 1)

    return {
        "month": month or "current",
        "total_spent": round(total_spent, 2),
        "transaction_count": len(expenses),
        "previous_month_spent": round(prev_expenses, 2),
        "change_percentage": change_pct,
        "by_category": dict(by_category),
        "top_category": max(by_category, key=by_category.get) if by_category else None,
    }


@router.get("/trend")
def get_trend(
    month: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    
    if month == "all":
        # Group by month for All Time view
        expenses = query.order_by(Expense.expense_date).all()
        monthly = defaultdict(float)
        for e in expenses:
            month_key = e.expense_date.strftime("%Y-%m")
            monthly[month_key] += e.amount
        return {"trend": [{"date": k, "amount": round(v, 2)} for k, v in sorted(monthly.items())]}
    
    # Group by day for single month view
    today = date.today()
    if month:
        year, m = map(int, month.split("-"))
    else:
        year, m = today.year, today.month

    expenses = query.filter(
        extract("year", Expense.expense_date) == year,
        extract("month", Expense.expense_date) == m
    ).order_by(Expense.expense_date).all()

    daily = defaultdict(float)
    for e in expenses:
        daily[str(e.expense_date)] += e.amount

    return {"trend": [{"date": k, "amount": round(v, 2)} for k, v in sorted(daily.items())]}


@router.get("/breakdown")
def get_breakdown(
    month: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    
    if month and month != "all":
        year, m = map(int, month.split("-"))
        query = query.filter(
            extract("year", Expense.expense_date) == year,
            extract("month", Expense.expense_date) == m
        )
    
    expenses = query.all()
    total = sum(e.amount for e in expenses) or 1
    by_cat = defaultdict(float)
    for e in expenses:
        by_cat[e.category] += e.amount

    breakdown = [
        {"category": k, "amount": round(v, 2), "percentage": round(v / total * 100, 1)}
        for k, v in sorted(by_cat.items(), key=lambda x: -x[1])
    ]
    return {"breakdown": breakdown}
