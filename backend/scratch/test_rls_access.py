import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.core.database import SessionLocal
from app.models.user import User

def test_access():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if user:
            print(f"[SUCCESS] Successfully accessed DB! Found user: {user.email}")
        else:
            print("[SUCCESS] Successfully connected to DB, but no users exist yet.")
    except Exception as e:
        print(f"[FAIL] Error accessing DB after RLS: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_access()
