import os
import sys
import random
import re
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline

# Ensure we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.core.keywords import KEYWORD_CATEGORIES

# ── CONFIG ──────────────────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'app', 'core', 'ml')
MODEL_PATH = os.path.join(MODEL_DIR, 'intent_classifier.joblib')
os.makedirs(MODEL_DIR, exist_ok=True)

# ── SYNTHETIC DATA GENERATOR ────────────────────────────────────────
def generate_synthetic_data():
    print(f"[*] Generating Massive synthetic training data from {len(KEYWORD_CATEGORIES)} seed keywords...")
    data = []
    
    log_prefixes = [
        "spent on ", "paid for ", "logged ", "i spent ", "i paid ", "new expense for ",
        "spent ", "paid ", "bought ", "ordered ", "got ", "at ", "for "
    ]
    
    query_prefixes = [
        "how much spent on ", "how much for ", "total for ", "what did i spend on ",
        "spent on ", "show me expenses for ", "how much did i spend on ", "what is total for ",
        "yesterday spent on ", "last week on ", "spend on ", "expenditure for ", "bills for "
    ]

    budget_prefixes = [
        "how much budget left for ", "remaining budget for ", "am i over budget on ",
        "what is my limit for ", "budget status for ", "left in ", "limit for "
    ]

    months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december", "jan", "feb", "mar", "apr", "oct", "dec"]
    timeframes = ["today", "yesterday", "this week", "last week", "this month", "previous month", "last month", "overall", "all time"]
    
    suffixes = [" rs", " inr", " rupees", " rps", " 500", " 1000", " 5000"]

    def apply_typo(text):
        if len(text) < 4: return text
        idx = random.randint(0, len(text)-1)
        chars = 'abcdefghijklmnopqrstuvwxyz'
        if random.random() > 0.5:
            return text[:idx] + random.choice(chars) + text[idx+1:]
        else:
            return text[:idx] + text[idx+1:]

    for keyword, category in KEYWORD_CATEGORIES.items():
        # 0. The Category Name itself
        data.append({"text": category, "category": category})
        data.append({"text": f"how much on {category.lower()}", "category": category})
        
        # 1. Base keyword variations
        data.append({"text": keyword, "category": category})
        data.append({"text": apply_typo(keyword), "category": category})
        
        # 2. MASSIVE Logging variations (Amount First and Last)
        for _ in range(10):
            p = random.choice(log_prefixes)
            amt = str(random.randint(10, 10000))
            data.append({"text": f"{p}{keyword} {amt}", "category": category})
            data.append({"text": f"{amt} {random.choice(['in', 'for', 'on'])} {keyword}", "category": category})
            data.append({"text": f"{p}{apply_typo(keyword)} {amt}", "category": category})
            
        # 3. MASSIVE Query variations (Category + Time/Month)
        for _ in range(15):
            qp = random.choice(query_prefixes)
            time = random.choice(timeframes + months)
            # Pattern: "How much spent on [keyword] [timeframe]"
            data.append({"text": f"{qp}{keyword} {time}", "category": category})
            data.append({"text": f"{time} spent on {keyword}", "category": category})
            # Typo version
            data.append({"text": f"{qp}{apply_typo(keyword)} {time}", "category": category})

        # 4. Budget variations
        for _ in range(5):
            bp = random.choice(budget_prefixes)
            data.append({"text": f"{bp}{keyword}", "category": category})
            data.append({"text": f"{keyword} budget remaining", "category": category})

    df = pd.DataFrame(data)
    df = df.sample(frac=1).reset_index(drop=True)
    print(f"[SUCCESS] Massive dataset created with {len(df)} variations.")
    return df

# ── TRAINING ───────────────────────────────────────────────────────
def train():
    df = generate_synthetic_data()
    
    print("[*] Building Elite ML Pipeline...")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 3), 
            analyzer='char_wb',
            max_features=20000
        )),
        ('clf', LinearSVC(C=1.2, dual='auto', max_iter=2000))
    ])
    
    print("[*] Training Elite Brain...")
    pipeline.fit(df['text'], df['category'])
    
    print(f"[*] Saving model to {MODEL_PATH}...")
    joblib.dump(pipeline, MODEL_PATH)
    print("[ELITE] Brain fully trained with Category + Month + Amount Intelligence!")

if __name__ == "__main__":
    train()
