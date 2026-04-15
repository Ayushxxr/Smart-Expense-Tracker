from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime


class ExpenseCreate(BaseModel):
    amount: float
    category: str = "Other"
    description: Optional[str] = None
    expense_date: date

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Amount must be greater than 0")
        return v


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    expense_date: Optional[date] = None


class ExpenseOut(BaseModel):
    id: str
    amount: float
    category: str
    description: Optional[str]
    expense_date: date
    source: str
    is_anomaly: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseListResponse(BaseModel):
    expenses: List[ExpenseOut]
    total: int
    page: int
    per_page: int


class ImportSummary(BaseModel):
    imported: int
    skipped: int
    categories: dict
