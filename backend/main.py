from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import date
from app.core.config import settings
from app.core.database import Base, engine
from app.api import auth, expenses, dashboard, budgets, chat, ocr, insights, categories

# Create all tables on startup
Base.metadata.create_all(bind=engine)

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

# Include all AI-powered routers
app.include_router(auth.router)
app.include_router(expenses.router)
app.include_router(dashboard.router)
app.include_router(budgets.router)
app.include_router(chat.router)
app.include_router(ocr.router)
app.include_router(insights.router)
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])

@app.get("/")
@app.head("/")
def root():
    return {"message": "Smart Expense Tracker API Status: Online"}

@app.get("/health")
@app.head("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
