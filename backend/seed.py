"""
Seed script — populates the database with realistic sample data.
Run: python seed.py
"""
import warnings
warnings.filterwarnings('ignore')

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, timedelta
import random
from sqlalchemy.orm import Session
from app.core.database import Base, engine
from app.core.security import hash_password
from app.models.user import User
from app.models.expense import Expense
from app.models.budget import Budget

# ─── Config ──────────────────────────────────────────────────
SEED_EMAIL = "demo@expense.com"
SEED_PASSWORD = "demo1234"
SEED_NAME = "Demo User"

EXPENSES_PER_MONTH = 35  # realistic volume
MONTHS_BACK = 3  # seed last 3 months including current


# ─── Sample data ─────────────────────────────────────────────
SAMPLE_EXPENSES = [
    # Food & Dining
    ("Swiggy - Biryani", "Food & Dining", 280),
    ("Zomato - Pizza", "Food & Dining", 450),
    ("Cafe Coffee Day", "Food & Dining", 180),
    ("Domino's Pizza", "Food & Dining", 560),
    ("McDonald's", "Food & Dining", 320),
    ("Haldiram's", "Food & Dining", 150),
    ("Barbeque Nation", "Food & Dining", 1200),
    ("Grocery - BigBasket", "Food & Dining", 1800),
    ("Chai Wala", "Food & Dining", 40),
    ("Restaurant - Dinner", "Food & Dining", 850),

    # Transport
    ("Ola Auto", "Transport", 85),
    ("Uber Cab", "Transport", 220),
    ("Rapido Bike", "Transport", 45),
    ("Metro Card Recharge", "Transport", 300),
    ("Petrol - HPCL", "Transport", 1200),
    ("Bus Pass", "Transport", 500),

    # Shopping
    ("Amazon - Headphones", "Shopping", 2500),
    ("Myntra - T-shirts", "Shopping", 1200),
    ("Flipkart - Books", "Shopping", 650),
    ("Nykaa - Skincare", "Shopping", 800),
    ("D-Mart Groceries", "Shopping", 2200),

    # Entertainment
    ("Netflix Subscription", "Entertainment", 499),
    ("Spotify Premium", "Entertainment", 119),
    ("BookMyShow - Movie", "Entertainment", 380),
    ("Steam - Game", "Entertainment", 999),

    # Bills & Utilities
    ("Jio Recharge", "Bills & Utilities", 239),
    ("Electricity Bill", "Bills & Utilities", 1800),
    ("Internet - Airtel", "Bills & Utilities", 799),
    ("Water Bill", "Bills & Utilities", 300),

    # Healthcare
    ("MedPlus Pharmacy", "Healthcare", 480),
    ("Apollo Clinic", "Healthcare", 500),
    ("Gym Membership", "Healthcare", 1200),

    # Education
    ("Udemy Course", "Education", 499),
    ("Books - Amazon", "Education", 850),
    ("Coursera Monthly", "Education", 2500),

    # Travel
    ("IRCTC Train Ticket", "Travel", 1200),
    ("Hotel Booking", "Travel", 3500),

    # Investments
    ("Zerodha - SIP", "Investments", 5000),
    ("Groww - Mutual Fund", "Investments", 3000),
]

BUDGETS = [
    ("Food & Dining", 5000),
    ("Transport", 2000),
    ("Shopping", 3000),
    ("Entertainment", 1000),
    ("Bills & Utilities", 3500),
    ("Healthcare", 2000),
]


def seed():
    print("[*] Seeding database...")
    Base.metadata.create_all(bind=engine)

    db = Session(engine)

    # Create or get user
    user = db.query(User).filter(User.email == SEED_EMAIL).first()
    if not user:
        user = User(
            name=SEED_NAME,
            email=SEED_EMAIL,
            hashed_password=hash_password(SEED_PASSWORD),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"  [OK] Created user: {SEED_EMAIL}")
    else:
        print(f"  [-] User already exists: {SEED_EMAIL}")
        # Clear old seed data
        db.query(Expense).filter(Expense.user_id == user.id).delete()
        db.query(Budget).filter(Budget.user_id == user.id).delete()
        db.commit()

    # Seed expenses across last N months
    today = date.today()
    total_added = 0

    for months_ago in range(MONTHS_BACK - 1, -1, -1):
        if months_ago == 0:
            year, month = today.year, today.month
        else:
            d = today.replace(day=1) - timedelta(days=1)
            for _ in range(months_ago - 1):
                d = d.replace(day=1) - timedelta(days=1)
            year, month = d.year, d.month

        # Last day of this month
        if month == 12:
            last_day = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = date(year, month + 1, 1) - timedelta(days=1)

        first_day = date(year, month, 1)
        days_available = (min(last_day, today) - first_day).days + 1

        # Pick random expenses for this month
        monthly_expenses = random.choices(SAMPLE_EXPENSES, k=EXPENSES_PER_MONTH)
        for desc, cat, base_amount in monthly_expenses:
            # Vary amount slightly
            amount = round(base_amount * random.uniform(0.8, 1.25), 2)
            # Random day in this month
            day_offset = random.randint(0, days_available - 1)
            txn_date = first_day + timedelta(days=day_offset)

            expense = Expense(
                user_id=user.id,
                amount=amount,
                category=cat,
                description=desc,
                expense_date=txn_date,
                source="seed_data"
            )
            db.add(expense)
            total_added += 1

        # Set budgets for current month only
        if months_ago == 0:
            for cat, limit in BUDGETS:
                budget = Budget(
                    user_id=user.id,
                    category=cat,
                    limit_amount=limit,
                    month_year=f"{year}-{month:02d}"
                )
                db.add(budget)

    db.commit()
    db.close()

    print(f"  [OK] Added {total_added} expenses across {MONTHS_BACK} months")
    print(f"  [OK] Added {len(BUDGETS)} budgets for current month")
    print()
    print("=" * 40)
    print("*** Seed complete! ***")
    print(f"   Login: {SEED_EMAIL}")
    print(f"   Password: {SEED_PASSWORD}")
    print(f"   URL: http://localhost:5173/login")
    print("=" * 40)


if __name__ == "__main__":
    seed()
