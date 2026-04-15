import uuid
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    category = Column(String, nullable=False)
    limit_amount = Column(Float, nullable=False)
    month_year = Column(String, nullable=False)  # e.g. "2026-04"
    alert_sent_80 = Column(Boolean, default=False)
    alert_sent_100 = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
