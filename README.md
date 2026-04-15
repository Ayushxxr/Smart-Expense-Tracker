# 💸 Smart Expense Tracker — AI-Powered Finance Manager

> A full-stack, mobile-first personal finance app with AI chat, OCR receipt scanning, bank statement import, and smart financial insights.

---

## 🚀 Quick Start

### One-click launch (Windows)
```
Double-click  →  START.bat
```
This opens both servers and the browser automatically.

### Manual start
```bash
# Terminal 1 — Backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- **App:** http://localhost:5173  
- **API Docs:** http://localhost:8000/docs  

### Demo account (pre-loaded with 105 transactions)
```
Email:    demo@expense.com
Password: demo1234
```

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 **Auth** | JWT login/register, bcrypt passwords |
| 📊 **Dashboard** | Stats, daily trend chart, category pie chart, recent transactions |
| 🧾 **Expenses** | Add/edit/delete, filters, bank import, CSV export |
| 💰 **Budgets** | Per-category monthly limits with live progress bars |
| 🤖 **AI Chat** | Log expenses in plain English: *"spent 350 on Zomato today"* |
| 🔮 **AI Insights** | Financial Health Score (0–100), smart tips, anomaly detection |
| 📸 **OCR Scanner** | Photograph a receipt → AI extracts amount, merchant & category |
| 🏦 **Bank Import** | Upload CSV/PDF bank statements → auto-categorized |
| 👤 **Profile** | Edit name/email/income, export data, view health grade |
| 📱 **Mobile PWA** | Installable on Android/iOS, bottom tab navigation |

---

## 📱 Mobile Navigation

On phones (≤ 768px), the sidebar is replaced by a bottom tab bar:

```
[ 📊 Home ] [ 🧾 Expenses ] [──🤖──] [ 💰 Budgets ] [ 👤 Profile ]
                               ↑ pops up:
                        🤖 Chat | 🔮 Insights | 📸 Scanner
```

**Test mobile on desktop:** Chrome → F12 → 📱 icon (Ctrl+Shift+M)

---

## 🏗️ Architecture

```
SMART EXPENSE TRACKER/
├── backend/               # FastAPI + SQLite
│   ├── main.py            # App entry, CORS, startup migrations
│   ├── seed.py            # Demo data seeder (105 expenses)
│   ├── requirements.txt
│   ├── .env               # SECRET_KEY, GEMINI_API_KEY (optional)
│   └── app/
│       ├── api/           # Route handlers
│       │   ├── auth.py    # Register, login, profile update
│       │   ├── expenses.py# CRUD + bank import + CSV export
│       │   ├── dashboard.py# Summary, trend, breakdown
│       │   ├── budgets.py # Budget CRUD with live spending
│       │   ├── chat.py    # AI expense logging via NLP
│       │   ├── ocr.py     # Receipt scanning (pytesseract)
│       │   └── insights.py# Health score, tips, anomalies
│       ├── models/        # SQLAlchemy ORM models
│       ├── schemas/       # Pydantic request/response models
│       └── core/          # DB, security, config
│
├── frontend/              # React + Vite
│   ├── src/
│   │   ├── pages/         # 8 pages: Dashboard, Expenses, Budgets,
│   │   │                  #   Chat, Insights, OCRScanner, Profile,
│   │   │                  #   Login, Register
│   │   ├── components/    # Sidebar, MobileNav
│   │   ├── api/client.js  # Axios with JWT interceptor
│   │   ├── store/authStore.js  # Zustand auth state
│   │   ├── App.jsx        # Routes + protected layout
│   │   └── index.css      # Design system (dark theme)
│   ├── public/manifest.json   # PWA manifest
│   └── vite.config.js    # Proxy /api → localhost:8000
│
├── START.bat              # One-click launcher
└── README.md
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account → returns JWT |
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/me` | Update name, email, monthly income |

### Expenses
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/expenses` | List (paginated, filterable) |
| POST | `/api/expenses` | Add expense |
| PUT | `/api/expenses/{id}` | Update expense |
| DELETE | `/api/expenses/{id}` | Delete expense |
| POST | `/api/expenses/parse` | Import bank CSV/PDF |
| GET | `/api/expenses/export` | Download as CSV |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | Total, count, top category vs prev month |
| GET | `/api/dashboard/trend` | Daily spending over selected month |
| GET | `/api/dashboard/breakdown` | Spending % by category |

### Budgets
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/budgets` | List with live spent_amount |
| POST | `/api/budgets` | Set a budget |
| DELETE | `/api/budgets/{id}` | Remove a budget |

### AI Features
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat` | Natural language expense logging |
| POST | `/api/ocr/scan` | Upload receipt image → extracted data |
| GET | `/api/insights/health` | Financial Health Score (0–100) |
| GET | `/api/insights/tips` | Personalized spending tips |
| GET | `/api/insights/anomalies` | Unusual transaction detection |

---

## ⚙️ Environment Setup

### `backend/.env`
```env
SECRET_KEY=your-secret-key-change-this-in-production
DATABASE_URL=sqlite:///./expenses.db
GEMINI_API_KEY=             # Optional — AI chat uses rule-based fallback if empty
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30
```

### `frontend/.env`
```env
VITE_API_URL=http://localhost:8000
```

---

## 🌱 Seed Demo Data

```bash
cd backend
python seed.py
```

Creates `demo@expense.com` / `demo1234` with:
- **105 realistic Indian expenses** across 3 months
- **6 monthly budgets** (Food, Transport, Shopping, Entertainment, Bills, Healthcare)

---

## 📦 Installation

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

---

## 🏆 Financial Health Score

Calculated from 3 components:

| Component | Max Points | How |
|---|---|---|
| Savings Rate | 40 pts | Based on monthly income you set in Profile |
| Budget Adherence | 35 pts | % of category budgets stayed within limit |
| Spending Stability | 25 pts | Low variance in daily spend = stable habits |

**Grades:** A (80–100) · B (60–79) · C (40–59) · D (0–39)

---

## 📱 Install as PWA (Mobile)

### Android
1. Open `http://your-deployed-url` in Chrome
2. Tap ⋮ menu → **Add to Home Screen**

### iPhone
1. Open in Safari
2. Tap Share → **Add to Home Screen**

---

## 🛣️ Roadmap (Phase 3)

- [ ] **Supabase** — replace SQLite with PostgreSQL for production
- [ ] **Google OAuth** — one-click sign in
- [ ] **Recurring expenses** — auto-log monthly bills
- [ ] **Email reports** — weekly spending summary email
- [ ] **Multi-currency** — USD, EUR, GBP support
- [ ] **React Native** — native iOS/Android app

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, SQLAlchemy, SQLite, Pydantic v2 |
| Auth | JWT (python-jose), bcrypt (passlib) |
| AI | Google Gemini 1.5 Flash (optional) |
| OCR | pytesseract + OpenCV (optional) |
| Frontend | React 19, Vite, TanStack Query v5 |
| State | Zustand |
| Charts | Recharts |
| Styling | Vanilla CSS (dark theme design system) |
| Mobile | PWA + CSS media queries |
