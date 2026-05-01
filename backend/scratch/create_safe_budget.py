import sqlite3
import uuid
from datetime import date

db_path = "expense_tracker.db"
user_id = "82ec70d8-3d94-46a6-bde4-dec77855461d"
month_year = "2026-04"

def create_safe_budget():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Find spending by category for April
    cursor.execute("""
        SELECT category, SUM(amount) 
        FROM expenses 
        WHERE user_id = ? AND strftime('%Y-%m', expense_date) = ?
        GROUP BY category
    """, (user_id, month_year))
    
    spending = dict(cursor.fetchall())
    print(f"Current spending in April: {spending}")
    
    # Pick a category with low spending or no budget
    # Let's just create a MASSIVE budget for 'Shopping' to ensure it's safe
    # Or 'Healthcare'
    cat = "Healthcare"
    spent = spending.get(cat, 0)
    limit = max(spent * 5, 50000) # 5x spending to ensure < 20% usage (SAFE)
    
    # Delete existing budget for this category/month if any
    cursor.execute("DELETE FROM budgets WHERE user_id = ? AND category = ? AND month_year = ?", (user_id, cat, month_year))
    
    # Insert new budget
    cursor.execute("""
        INSERT INTO budgets (id, user_id, category, limit_amount, month_year)
        VALUES (?, ?, ?, ?, ?)
    """, (str(uuid.uuid4()), user_id, cat, limit, month_year))
    
    conn.commit()
    conn.close()
    print(f"✅ Created SAFE budget for {cat}: Spent ₹{spent} / Limit ₹{limit}")

if __name__ == "__main__":
    create_safe_budget()
