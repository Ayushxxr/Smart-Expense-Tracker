import sqlite3
import os

db_path = 'expense_tracker.db'
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT count(*) FROM expenses")
        exp_count = cursor.fetchone()[0]
        print(f"Expenses: {exp_count}")
        
        cursor.execute("SELECT DISTINCT user_id FROM expenses")
        exp_users = cursor.fetchall()
        print(f"Expense User IDs: {exp_users}")
        
        cursor.execute("SELECT id, email, name, monthly_income FROM users")
        users = cursor.fetchall()
        print(f"User Table Data: {users}")
        latest = cursor.fetchall()
        print(f"Latest expenses: {latest}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
