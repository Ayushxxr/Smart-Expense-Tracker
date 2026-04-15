from pydantic import BaseModel
from typing import Optional


class BudgetCreate(BaseModel):
    category: str
    limit_amount: float
    month_year: str  # "YYYY-MM"


class BudgetOut(BaseModel):
    id: str
    category: str
    limit_amount: float
    month_year: str
    spent_amount: float = 0.0
    percentage: float = 0.0
    status: str = "ok"  # ok | warning | exceeded

    class Config:
        from_attributes = True
