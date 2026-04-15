from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional, List
from datetime import date, datetime
import io

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseOut, ExpenseListResponse, ImportSummary

router = APIRouter(prefix="/api/expenses", tags=["expenses"])

KEYWORD_CATEGORIES = {
    "swiggy": "Food & Dining", "zomato": "Food & Dining", "dominos": "Food & Dining",
    "mcdonald": "Food & Dining", "pizza": "Food & Dining", "restaurant": "Food & Dining",
    "cafe": "Food & Dining", "food": "Food & Dining",
    "uber": "Transport", "ola": "Transport", "rapido": "Transport",
    "metro": "Transport", "bus": "Transport", "petrol": "Transport", "fuel": "Transport",
    "amazon": "Shopping", "flipkart": "Shopping", "myntra": "Shopping",
    "ajio": "Shopping", "nykaa": "Shopping", "meesho": "Shopping",
    "netflix": "Entertainment", "spotify": "Entertainment", "youtube": "Entertainment",
    "hotstar": "Entertainment", "prime": "Entertainment", "bookmyshow": "Entertainment",
    "electricity": "Bills & Utilities", "water": "Bills & Utilities", "internet": "Bills & Utilities",
    "jio": "Bills & Utilities", "airtel": "Bills & Utilities", "gas": "Bills & Utilities",
    "hospital": "Healthcare", "pharmacy": "Healthcare", "medicine": "Healthcare",
    "doctor": "Healthcare", "clinic": "Healthcare", "medplus": "Healthcare",
    "school": "Education", "college": "Education", "course": "Education",
    "udemy": "Education", "byju": "Education", "tuition": "Education",
    "flight": "Travel", "hotel": "Travel", "irctc": "Travel", "train": "Travel",
    "makemytrip": "Travel", "goibibo": "Travel",
    "mutual fund": "Investments", "sip": "Investments", "zerodha": "Investments",
    "groww": "Investments", "stock": "Investments",
}


def auto_categorize(description: str) -> str:
    if not description:
        return "Other"
    desc_lower = description.lower()
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
        category = auto_categorize(data.description)

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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    if category:
        query = query.filter(Expense.category == category)
    if month:
        year, m = month.split("-")
        query = query.filter(
            extract("year", Expense.expense_date) == int(year),
            extract("month", Expense.expense_date) == int(m)
        )
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


@router.post("/parse", response_model=ImportSummary)
async def parse_bank_statement(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Import expenses from a bank statement PDF or CSV file."""
    content = await file.read()
    transactions = []

    if file.filename.endswith(".csv"):
        import pandas as pd
        df = pd.read_csv(io.BytesIO(content))
        # Normalize common column names from various banks
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
        for _, row in df.iterrows():
            try:
                amount = None
                for col in ["debit", "withdrawal", "dr", "amount"]:
                    if col in df.columns:
                        val = str(row.get(col, "")).replace(",", "").strip()
                        if val and val not in ["", "nan", "0", "0.0"]:
                            amount = float(val)
                            break
                if not amount or amount <= 0:
                    continue
                description = str(row.get("description", row.get("narration", row.get("particulars", "Import"))))
                txn_date = None
                for col in ["date", "txn_date", "transaction_date", "value_date"]:
                    if col in df.columns:
                        try:
                            txn_date = pd.to_datetime(str(row[col])).date()
                            break
                        except Exception:
                            continue
                if not txn_date:
                    txn_date = date.today()
                transactions.append({"amount": amount, "description": description, "date": txn_date})
            except Exception:
                continue

    elif file.filename.endswith(".pdf"):
        import pdfplumber
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if not row:
                            continue
                        row_text = " ".join(str(c) for c in row if c)
                        # Attempt to find amount and date from row text
                        import re
                        amounts = re.findall(r'[\d,]+\.\d{2}', row_text)
                        dates = re.findall(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', row_text)
                        if amounts and len(row_text) > 10:
                            try:
                                amount = float(amounts[-1].replace(",", ""))
                                txn_date = datetime.strptime(dates[0], "%d/%m/%Y").date() if dates else date.today()
                                transactions.append({"amount": amount, "description": row_text[:200], "date": txn_date})
                            except Exception:
                                continue
    else:
        raise HTTPException(status_code=400, detail="Only CSV and PDF files are supported")

    # Bulk insert with auto-categorization
    category_counts = {}
    imported = 0
    for txn in transactions:
        category = auto_categorize(txn["description"])
        expense = Expense(
            user_id=current_user.id,
            amount=txn["amount"],
            category=category,
            description=txn["description"][:500],
            expense_date=txn["date"],
            source="bank_import"
        )
        db.add(expense)
        category_counts[category] = category_counts.get(category, 0) + 1
        imported += 1

    db.commit()
    return ImportSummary(imported=imported, skipped=len(transactions) - imported, categories=category_counts)


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
