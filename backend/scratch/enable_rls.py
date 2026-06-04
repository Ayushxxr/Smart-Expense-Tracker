import os
import sys
from sqlalchemy import create_engine, text

# Add parent directory to sys.path to import app settings
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.core.config import settings

def enable_rls():
    db_url = settings.DATABASE_URL
    print(f"[*] Connecting to database: {db_url.split('@')[-1]}")
    engine = create_engine(db_url)
    
    tables = ["users", "expenses", "budgets", "categories"]
    
    with engine.connect() as conn:
        transaction = conn.begin()
        try:
            for table in tables:
                print(f"[*] Enabling Row Level Security (RLS) on table: {table}...")
                conn.execute(text(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;"))
            
            transaction.commit()
            print("[SUCCESS] Row Level Security (RLS) has been successfully enabled on all tables!")
        except Exception as e:
            transaction.rollback()
            print(f"[ERROR] Failed to enable RLS: {e}")
            raise e

if __name__ == "__main__":
    enable_rls()
