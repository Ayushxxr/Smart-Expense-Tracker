from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.expense import Expense
from app.models.budget import Budget
from app.schemas.budget import BudgetCreate, BudgetOut

router = APIRouter(prefix="/api/budgets", tags=["budgets"])


def _get_spent(db, user_id, category, month_year):
    # month_year is "YYYY-MM"
    year, month = map(int, month_year.split("-"))
    return db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == user_id,
        Expense.category == category,
        extract("year", Expense.expense_date) == year,
        extract("month", Expense.expense_date) == month
    ).scalar() or 0.0


@router.get("")
def list_budgets(
    month_year: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    my = month_year or f"{today.year}-{today.month:02d}"
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id, Budget.month_year == my).all()

    result = []
    for b in budgets:
        spent = _get_spent(db, current_user.id, b.category, my)
        pct = round(spent / b.limit_amount * 100, 1) if b.limit_amount > 0 else 0
        status = "exceeded" if pct >= 100 else "warning" if pct >= 70 else "ok"
        result.append({
            "id": b.id,
            "category": b.category,
            "limit_amount": b.limit_amount,
            "spent_amount": round(spent, 2),
            "month_year": b.month_year,
            "percentage": pct,
            "status": status,
        })
    return result


@router.post("")
def create_budget(
    data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category == data.category,
        Budget.month_year == data.month_year
    ).first()
    if existing:
        existing.limit_amount = data.limit_amount
        db.commit()
        db.refresh(existing)
        budget = existing
    else:
        budget = Budget(
            user_id=current_user.id,
            category=data.category,
            limit_amount=data.limit_amount,
            month_year=data.month_year
        )
        db.add(budget)
        db.commit()
        db.refresh(budget)

    spent = _get_spent(db, current_user.id, data.category, data.month_year)
    pct = round(spent / budget.limit_amount * 100, 1) if budget.limit_amount > 0 else 0
    return {"id": budget.id, "category": budget.category, "limit_amount": budget.limit_amount,
            "spent_amount": round(spent, 2), "month_year": budget.month_year, "percentage": pct,
            "status": "exceeded" if pct >= 100 else "warning" if pct >= 70 else "ok"}


@router.delete("/{budget_id}")
def delete_budget(
    budget_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()
    return {"message": "Deleted"}
