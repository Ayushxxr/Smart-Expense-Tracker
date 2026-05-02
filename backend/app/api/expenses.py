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
        query = query.filter(func.to_char(Expense.expense_date, 'YYYY-MM') == month)
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
