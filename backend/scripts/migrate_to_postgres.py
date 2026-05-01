import sqlite3
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.user import User
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.category import Category
from app.core.config import settings

# --- CONFIGURATION ---
SQLITE_PATH = "expense_tracker.db"
POSTGRES_URL = "postgresql://postgres.ujvodubxmjhmlzrfzyod:28K9thI9ZIlfiS51@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

def migrate():
    print(f"[*] Starting migration from {SQLITE_PATH} to Cloud Postgres...")

    # 1. Setup Postgres Connection
    pg_engine = create_engine(POSTGRES_URL)
    PgSession = sessionmaker(bind=pg_engine)
    pg_db = PgSession()

    # 2. Create tables in Postgres
    print("[*] Creating tables in Postgres...")
    Base.metadata.create_all(bind=pg_engine)

    # 3. Connect to SQLite
    sl_conn = sqlite3.connect(SQLITE_PATH)
    sl_conn.row_factory = sqlite3.Row
    sl_cursor = sl_conn.cursor()

    try:
        # --- MIGRATE USERS ---
        print("[*] Migrating Users...")
        sl_cursor.execute("SELECT * FROM users")
        for row in sl_cursor.fetchall():
            row_dict = dict(row)
            if not pg_db.query(User).filter(User.id == row_dict['id']).first():
                user = User(
                    id=row_dict['id'],
                    email=row_dict['email'],
                    name=row_dict['name'],
                    hashed_password=row_dict['hashed_password'],
                    google_id=row_dict.get('google_id'),
                    avatar_url=row_dict.get('avatar_url'),
                    financial_health_score=row_dict.get('financial_health_score', 0.0),
                    monthly_income=row_dict.get('monthly_income', 50000.0),
                    is_active=bool(row_dict['is_active'])
                )
                pg_db.add(user)
        pg_db.commit()

        # --- MIGRATE CATEGORIES ---
        print("[*] Migrating Categories...")
        sl_cursor.execute("SELECT * FROM categories")
        for row in sl_cursor.fetchall():
            row_dict = dict(row)
            if not pg_db.query(Category).filter(Category.id == row_dict['id']).first():
                cat = Category(
                    id=row_dict['id'],
                    user_id=row_dict['user_id'],
                    name=row_dict['name'],
                    icon=row_dict['icon'],
                    color=row_dict['color'],
                    is_default=bool(row_dict['is_default'])
                )
                pg_db.add(cat)
        pg_db.commit()

        # --- MIGRATE EXPENSES ---
        print("[*] Migrating Expenses...")
        sl_cursor.execute("SELECT * FROM expenses")
        for row in sl_cursor.fetchall():
            row_dict = dict(row)
            if not pg_db.query(Expense).filter(Expense.id == row_dict['id']).first():
                exp = Expense(
                    id=row_dict['id'],
                    user_id=row_dict['user_id'],
                    amount=row_dict['amount'],
                    category=row_dict['category'],
                    description=row_dict['description'],
                    expense_date=row_dict['expense_date'],
                    source=row_dict['source'],
                    is_anomaly=bool(row_dict.get('is_anomaly', False)),
                    anomaly_score=row_dict.get('anomaly_score'),
                    receipt_url=row_dict.get('receipt_url')
                )
                pg_db.add(exp)
        pg_db.commit()

        # --- MIGRATE BUDGETS ---
        print("[*] Migrating Budgets...")
        sl_cursor.execute("SELECT * FROM budgets")
        for row in sl_cursor.fetchall():
            row_dict = dict(row)
            if not pg_db.query(Budget).filter(Budget.id == row_dict['id']).first():
                bud = Budget(
                    id=row_dict['id'],
                    user_id=row_dict['user_id'],
                    category=row_dict['category'],
                    limit_amount=row_dict['limit_amount'],
                    month_year=row_dict['month_year'],
                    alert_sent_80=bool(row_dict.get('alert_sent_80', False)),
                    alert_sent_100=bool(row_dict.get('alert_sent_100', False))
                )
                pg_db.add(bud)
        pg_db.commit()

        print("[SUCCESS] Migration complete! Your cloud database is now in sync.")

    except Exception as e:
        print(f"[ERROR] Migration failed: {e}")
        pg_db.rollback()
    finally:
        pg_db.close()
        sl_conn.close()

if __name__ == "__main__":
    migrate()
