import re
import pandas as pd
from datetime import date
import sys
import io

# Fix for Windows console encoding
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Robust patterns from expenses.py
# AMOUNT: Require currency symbol OR decimal point with 2 digits
AMOUNT_RE = re.compile(r'(?:₹|Rs\.?|INR)\s*(-?[\d,]+(?:\.\d{1,2})?)|(-?[\d,]+\.\d{2})', re.IGNORECASE)
# DATE: Support space, dash or slash separators for text months
DATE_RE = re.compile(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}[-\s]+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-\s,.]*\d{2,4})', re.IGNORECASE)

test_cases = [
    "01/03/2026 Paid to Swiggy ₹ 500.00",
    "Paid to Zomato 1,234.56 on 1-Mar-2026",
    "Mar 05, 2026 ATM Withdrawal INR 2000",
    "05-03-2026 Petrol Pump Rs 1500.5",
    "10 Jan 2026 Subscription -50.00",
    "2026/03/01 Merchant Payment ₹100", # This one might fail DATE_RE but let's see
]

print("--- REGEX TESTING ---")
for line in test_cases:
    matches = AMOUNT_RE.findall(line)
    amounts = [m[0] or m[1] for m in matches]
    dates = DATE_RE.findall(line)
    
    print(f"Line: {line}")
    print(f"  Amounts: {amounts}")
    print(f"  Dates: {dates}")
    
    if amounts and dates:
        amt_str = amounts[-1].replace(",", "")
        amount = abs(float(amt_str))
        try:
            txn_date = pd.to_datetime(dates[0], dayfirst=True).date()
            print(f"  Result: OK -> {amount} on {txn_date}")
        except Exception as e:
            print(f"  Result: Date Error -> {e}")
    else:
        print(f"  Result: FAILED (missing amount or date)")
    print()
