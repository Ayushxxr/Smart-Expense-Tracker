from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.api import auth, expenses, dashboard, budgets, chat, ocr, insights

# Create all tables on startup
Base.metadata.create_all(bind=engine)

# ── Safe column migrations (SQLite doesn't support ALTER TABLE DROP COLUMN)
# Add any new columns that may not exist in older DB files
def run_migrations():
    from sqlalchemy import text
    with engine.connect() as conn:
        # Add monthly_income to users if missing
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN monthly_income FLOAT DEFAULT 50000.0"))
            conn.commit()
        except Exception:
            pass  # Column already exists — safe to ignore

run_migrations()

app = FastAPI(
    title="Smart Expense Tracker API",
    description="AI-powered personal finance tracker",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(expenses.router)
app.include_router(dashboard.router)
app.include_router(budgets.router)
app.include_router(chat.router)
app.include_router(ocr.router)
app.include_router(insights.router)


@app.get("/")
def root():
    return {"message": "Smart Expense Tracker API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
