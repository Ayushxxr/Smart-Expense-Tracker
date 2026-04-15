import uuid
from sqlalchemy import Column, String, DateTime, Float, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)  # nullable for OAuth users
    google_id = Column(String, unique=True, nullable=True)
    avatar_url = Column(String, nullable=True)
    financial_health_score = Column(Float, default=0.0)
    monthly_income = Column(Float, default=50000.0)   # used for health score
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
