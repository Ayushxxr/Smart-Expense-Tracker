from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.category import Category
from pydantic import BaseModel

router = APIRouter()

class CategoryBase(BaseModel):
    name: str
    icon: str = "MoreHorizontal"
    color: str = "#6366f1"

class CategoryResponse(CategoryBase):
    id: str
    is_default: bool

    class Config:
        from_attributes = True

DEFAULT_CATEGORIES = [
    {"name": "Food & Dining", "icon": "Utensils", "color": "#ef4444"},
    {"name": "Transport", "icon": "Car", "color": "#3b82f6"},
    {"name": "Shopping", "icon": "ShoppingBag", "color": "#8b5cf6"},
    {"name": "Entertainment", "icon": "Film", "color": "#f59e0b"},
    {"name": "Bills & Utilities", "icon": "Zap", "color": "#10b981"},
    {"name": "Healthcare", "icon": "Heart", "color": "#ec4899"},
    {"name": "Education", "icon": "GraduationCap", "color": "#6366f1"},
    {"name": "Travel", "icon": "Plane", "color": "#06b6d4"},
    {"name": "Investments", "icon": "TrendingUp", "color": "#14b8a6"},
    {"name": "Other", "icon": "MoreHorizontal", "color": "#6b7280"}
]

@router.get("", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    categories = db.query(Category).filter(Category.user_id == current_user.id).all()
    
    # Seed defaults if user has none
    if not categories:
        for cat in DEFAULT_CATEGORIES:
            new_cat = Category(
                user_id=current_user.id,
                name=cat["name"],
                icon=cat["icon"],
                color=cat["color"],
                is_default=True
            )
            db.add(new_cat)
        db.commit()
        categories = db.query(Category).filter(Category.user_id == current_user.id).all()
        
    return categories

@router.post("", response_model=CategoryResponse)
def create_category(payload: CategoryBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Prevent duplicate names
    existing = db.query(Category).filter(Category.user_id == current_user.id, Category.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
        
    new_cat = Category(
        user_id=current_user.id,
        name=payload.name,
        icon=payload.icon,
        color=payload.color,
        is_default=False
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

@router.delete("/{category_id}")
def delete_category(category_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cat = db.query(Category).filter(Category.id == category_id, Category.user_id == current_user.id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if cat.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete default categories")
        
    db.delete(cat)
    db.commit()
    return {"message": "Category deleted"}
