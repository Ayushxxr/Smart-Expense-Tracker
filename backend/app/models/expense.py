import uuid
from sqlalchemy import Column, String, Float, Date, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.sql import func
from app.core.database import Base

CATEGORIES = [
    "Food & Dining",
    "Transport",
    "Shopping",
    "Entertainment",
    "Bills & Utilities",
    "Healthcare",
    "Education",
    "Travel",
    "Investments",
    "Other"
]


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False, default="Other")
    description = Column(Text, nullable=True)
    expense_date = Column(Date, nullable=False)
    source = Column(String, default="manual")  # manual | ocr | bank_import | ai_chat
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, nullable=True)
    receipt_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
