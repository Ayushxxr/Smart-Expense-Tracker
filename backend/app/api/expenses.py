from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional, List
from datetime import date, datetime
import io
import pandas as pd

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseOut, ExpenseListResponse

router = APIRouter(prefix="/api/expenses", tags=["expenses"])

from app.core.keywords import KEYWORD_CATEGORIES


def auto_categorize(description: str, user_id: str, db: Session) -> str:
    if not description:
        return "Other"
    desc_lower = description.lower()
    
    # 1. Check Custom User Categories (PRIORITY: USER CHOICE FIRST)
    from app.models.category import Category
    user_cats = db.query(Category).filter(Category.user_id == user_id).all()
    for cat in user_cats:
        if cat.name.lower() in desc_lower:
            return cat.name

    # 2. Check Global Keywords (FALLBACK: SYSTEM DEFAULTS)
    for keyword, category in KEYWORD_CATEGORIES.items():
        if keyword in desc_lower:
            return category
            
    return "Other"


@router.post("", response_model=ExpenseOut)
def create_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    category = data.category
    if category == "Other" and data.description:
        category = auto_categorize(data.description, current_user.id, db)

    expense = Expense(
        user_id=current_user.id,
        amount=data.amount,
        category=category,
        description=data.description,
        expense_date=data.expense_date,
        source="manual"
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)

    # ── Real-Time Notification & Budget Alert Engine ──
    try:
        # 1. Budget & Overspending Alerts
        from app.models.budget import Budget
        my = f"{expense.expense_date.year}-{expense.expense_date.month:02d}"
        budget = db.query(Budget).filter(
            Budget.user_id == current_user.id,
            Budget.category == expense.category,
            Budget.month_year == my
        ).first()
        
        if budget:
            from app.api.budgets import _get_spent
            spent = _get_spent(db, current_user.id, expense.category, my)
            limit = budget.limit_amount
            if limit > 0:
                pct = (spent / limit) * 100
                if pct >= 100:
                    expense.budget_alert = f"LIMIT_EXCEEDED|You have spent ₹{spent:,.2f} of ₹{limit:,.2f} limit on {expense.category}!"
                elif pct >= 80:
                    expense.budget_alert = f"THRESHOLD_80|You have used {pct:.1f}% (₹{spent:,.2f} of ₹{limit:,.2f}) of your {expense.category} budget!"

        # 2. Unusual Activity Anomaly Alerts (z-score method)
        if not expense.budget_alert or "THRESHOLD_80" in expense.budget_alert:
            recent_expenses = db.query(Expense).filter(
                Expense.user_id == current_user.id
            ).order_by(Expense.expense_date.desc()).limit(100).all()
            
            if len(recent_expenses) >= 5:
                amounts = [e.amount for e in recent_expenses]
                mean = sum(amounts) / len(amounts)
                std = (sum((x - mean) ** 2 for x in amounts) / len(amounts)) ** 0.5
                
                z = (expense.amount - mean) / std if std > 0 else 0
                if z > 2.0:
                    expense.budget_alert = f"UNUSUAL_ACTIVITY|Unusual activity: This ₹{expense.amount:,.2f} transaction is unusually high compared to your average (₹{mean:,.2f})!"
    except Exception as e:
        print(f"[REAL-TIME ALERT ENGINE ERROR] {e}")

    return expense


@router.get("", response_model=ExpenseListResponse)
def list_expenses(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    month: Optional[str] = None,  # "YYYY-MM"
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    if category:
        query = query.filter(Expense.category == category)
    if month:
        year, m = map(int, month.split("-"))
        query = query.filter(
            extract("year", Expense.expense_date) == year,
            extract("month", Expense.expense_date) == m
        )
    if start_date:
        query = query.filter(Expense.expense_date >= start_date)
    if end_date:
        query = query.filter(Expense.expense_date <= end_date)
    total = query.count()
    # Sort by date descending, then by creation time descending (newest first)
    expenses = query.order_by(Expense.expense_date.desc(), Expense.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return ExpenseListResponse(expenses=expenses, total=total, page=page, per_page=per_page)


@router.put("/{expense_id}", response_model=ExpenseOut)
def update_expense(
    expense_id: str,
    data: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == current_user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/clear")
def clear_all_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete all transactions and budgets for the logged in user."""
    from app.models.budget import Budget
    db.query(Expense).filter(Expense.user_id == current_user.id).delete()
    db.query(Budget).filter(Budget.user_id == current_user.id).delete()
    db.commit()
    return {"message": "All expense history and budgets cleared successfully"}


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == current_user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return {"message": "Deleted successfully"}


@router.get("/export")
def export_expenses_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export all expenses as downloadable CSV."""
    from fastapi.responses import StreamingResponse
    import csv

    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id
    ).order_by(Expense.expense_date.desc()).all()

    def generate():
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Date", "Description", "Category", "Amount (₹)", "Source"])
        for e in expenses:
            writer.writerow([
                str(e.expense_date),
                e.description or "",
                e.category,
                e.amount,
                e.source
            ])
        yield output.getvalue()

    return StreamingResponse(
        generate(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=expenses.csv"}
    )
