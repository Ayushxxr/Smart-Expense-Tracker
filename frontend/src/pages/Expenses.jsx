import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, subMonths, addMonths, parseISO, subDays } from 'date-fns'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Download, 
  Upload,
  Receipt,
  UtensilsCrossed, 
  Car, 
  ShoppingBag, 
  Film, 
  Zap, 
  Stethoscope, 
  GraduationCap, 
  Plane, 
  TrendingUp, 
  Box,
  ChevronLeft,
  ChevronRight,
  Database,
  Search,
  AlertCircle
} from 'lucide-react'
import api from '../api/client'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'Food & Dining', 'Transport', 'Shopping', 'Entertainment',
  'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 'Investments', 'Other'
]

const CATEGORY_ICONS = {
  'Food & Dining': UtensilsCrossed,
  'Transport': Car,
  'Shopping': ShoppingBag,
  'Entertainment': Film,
  'Bills & Utilities': Zap,
  'Healthcare': Stethoscope,
  'Education': GraduationCap,
  'Travel': Plane,
  'Investments': TrendingUp,
  'Other': Box
}

const CATEGORY_COLORS = {
  'Food & Dining': '#f97316',
  'Transport':     '#3b82f6',
  'Shopping':      '#eab308',
  'Entertainment': '#a855f7',
  'Bills & Utilities': '#0ea5e9',
  'Healthcare':    '#ef4444',
  'Education':     '#14b8a6',
  'Travel':        '#f43f5e',
  'Investments':   '#22c55e',
  'Other':         '#6b7280'
}

function fmt(n) { return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` }

// ── Month Navigator ─────────────────────────────────────────────
function MonthNavigator({ value, onChange }) {
  const current = format(new Date(), 'yyyy-MM')
  const date = parseISO(value + '-01')
  const isCurrentMonth = value >= current
  const prev = () => onChange(format(subMonths(date, 1), 'yyyy-MM'))
  const next = () => { if (!isCurrentMonth) onChange(format(addMonths(date, 1), 'yyyy-MM')) }
  return (
    <div className="date-arrows" style={{ height: 44 }}>
      <button onClick={prev} className="arrow-btn" title="Previous Month">
        <ChevronLeft size={20} strokeWidth={2.5} />
      </button>
      <div className="date-label" style={{ minWidth: 80, textAlign: 'center', fontSize: 13, fontWeight: 800 }}>
        {format(date, 'MMM yyyy')}
      </div>
      <button onClick={next} className="arrow-btn" disabled={isCurrentMonth} title="Next Month">
        <ChevronRight size={20} strokeWidth={2.5} />
      </button>
    </div>
  )
}

// ── Add / Edit Expense Modal ────────────────────────────────────
function AddExpenseModal({ onClose, editData }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(editData || {
    amount: '', category: 'Other', description: '',
    expense_date: format(new Date(), 'yyyy-MM-dd')
  })

  const mutation = useMutation({
    mutationFn: (data) => editData
      ? api.put(`/api/expenses/${editData.id}`, data)
      : api.post('/api/expenses', data),
    onSuccess: () => {
      qc.invalidateQueries(['expenses'])
      qc.invalidateQueries(['summary'])
      qc.invalidateQueries(['trend'])
      qc.invalidateQueries(['breakdown'])
      qc.invalidateQueries(['budgets'])
      toast.success(editData ? 'Expense updated ✅' : 'Expense added ✅')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Error saving expense')
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/expenses/${editData.id}`),
    onSuccess: () => {
      qc.invalidateQueries(['expenses'])
      qc.invalidateQueries(['summary'])
      qc.invalidateQueries(['trend'])
      qc.invalidateQueries(['breakdown'])
      qc.invalidateQueries(['budgets'])
      toast.success('Transaction deleted ✅')
      onClose()
    },
    onError: () => toast.error('Error deleting transaction')
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {editData ? <Edit2 size={22} color="var(--accent)" /> : <Plus size={22} color="var(--accent)" />}
          {editData ? 'Edit Expense' : 'Add Expense'}
        </h2>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate({ ...form, amount: parseFloat(form.amount) }) }}>
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input id="expense-amount" className="form-input" type="number" min="0.01" step="0.01"
              placeholder="0.00" value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })} 
              style={{ fontSize: 16, fontWeight: 700 }} required />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select id="expense-category" className="form-select" value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <input id="expense-desc" className="form-input" type="text"
              placeholder="e.g. Dinner at Barbeque Nation"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input id="expense-date" className="form-input" type="date"
              value={form.expense_date}
              onChange={e => setForm({ ...form, expense_date: e.target.value })} required />
          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            {editData ? (
              <button 
                type="button" 
                className="btn btn-icon" 
                style={{ color: 'var(--red)', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}
                onClick={() => { if (confirm('Delete this transaction?')) deleteMutation.mutate() }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <span className="spinner" /> : <Trash2 size={16} />}
                Delete
              </button>
            ) : <div />}
            
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-secondary" style={{ borderRadius: 12 }} onClick={onClose}>Cancel</button>
              <button id="expense-save" type="submit" className="btn btn-primary" style={{ borderRadius: 12 }} disabled={mutation.isPending}>
                {mutation.isPending ? <span className="spinner" /> : (editData ? 'Update' : 'Add Expense')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Bank Statement Download Guide ──────────────────────────────
const BANK_STEPS = {
  'SBI': {
    icon: '🔵',
    app: 'YONO SBI (Main)',
    steps: [
      'Open YONO SBI → Login',
      'Tap "Accounts" (top left) → Select your account card',
      'Tap "Transaction Statement" (or the 📖 icon)',
      'Tap the ⬇️ (Download) icon at the top right',
      'Password: DOB (DDMM) + @ + last 4 mobile (e.g. 0105@9999)',
    ],
  },
  'HDFC': {
    icon: '🔴',
    app: 'HDFC Bank Mobile',
    steps: [
      'Open HDFC Mobile → Login',
      'Tap on your "Savings Account" card directly',
      'Tap "Statement" → "Past Statements"',
      'Tap "Request Statement" or select month → "Download"',
      'Password: Your 8-digit HDFC Customer ID',
    ],
  },
  'ICICI': {
    icon: '🟠',
    app: 'iMobile Pay',
    steps: [
      'Open iMobile Pay → Login',
      'Tap "Accounts & Statements" → Select account',
      'Tap "Detailed Statement" → "Export as PDF"',
      'Select date range and tap "Submit/View"',
      'Password: First 4 name letters (small) + DDMM (e.g. ayus0101)',
    ],
  },
  'Axis': {
    icon: '🟣',
    app: 'Axis Mobile',
    steps: [
      'Open Axis Mobile → Login',
      'Tap "Accounts" (bottom bar) → Select account',
      'Tap "View Statement" → "Download Statement"',
      'Select date range → Tap "Download"',
      'Password: First 4 name (CAPS) + Last 4 mobile (e.g. AYUS9999)',
    ],
  },
  'GPay': {
    icon: '🟢',
    app: 'Google Pay India',
    steps: [
      'Open GPay → Tap Profile (top right)',
      'Tap "Transaction history" (this shows receipts only)',
      '⚠️ GPay cannot export full Bank PDF statements',
      'Best Way: Use your Bank App (SBI/HDFC/etc.) to download',
      'GPay payments always show up in your official bank PDF',
    ],
  },
  'PhonePe': {
    icon: '🟤',
    app: 'PhonePe',
    steps: [
      'Open PhonePe → Tap "History" (bottom right)',
      'Tap "Download Statement" (the button at the very top)',
      'Select a specific month or custom range',
      'Tap "Download" → PDF is saved to your phone',
      'Password: Usually none, or your registered mobile number',
    ],
  },
  'BHIM': {
    icon: '🇮🇳',
    app: 'BHIM App',
    steps: [
      'Open BHIM → Login with Passcode',
      'Tap "Transactions" (bottom bar)',
      'Tap "Filter" (top right) to select your period',
      'Tap the ⬇️ (PDF) icon at the top right of the list',
      'Full history: Always check your Bank Statement PDF',
    ],
  },
}

function BankGuide() {
  const [open, setOpen] = useState(false)
  const [activeBank, setActiveBank] = useState('SBI')
  const bank = BANK_STEPS[activeBank]

  return (
    <div style={{ marginBottom: 14 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)',
          borderRadius: open ? '12px 12px 0 0' : 12, padding: '12px 16px',
          cursor: 'pointer', color: 'var(--accent)', fontSize: 13, fontWeight: 700,
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={16} />
          <span>Statement Download Guide</span>
        </div>
        <ChevronRight size={18} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'none' }} />
      </button>

      {open && (
        <div style={{
          border: '1px solid rgba(108,99,255,0.2)', borderTop: 'none',
          borderRadius: '0 0 12px 12px', padding: '16px',
          background: 'rgba(108,99,255,0.02)',
        }}>
          {/* Bank selector chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {Object.entries(BANK_STEPS).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setActiveBank(key)}
                style={{
                  padding: '6px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                  border: '1px solid',
                  borderColor: activeBank === key ? 'var(--accent)' : 'var(--border)',
                  background: activeBank === key ? 'var(--accent)' : 'var(--surface2)',
                  color: activeBank === key ? '#fff' : 'var(--text2)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {val.icon} {key}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
            App: <span style={{ color: 'var(--text2)' }}>{bank.app}</span>
          </div>

          <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bank.steps.map((step, i) => (
              <li key={i} style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                {step}
              </li>
            ))}
          </ol>

          <div style={{
            marginTop: 16, padding: '12px',
            background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.2)',
            borderRadius: 10, fontSize: 11, color: 'var(--yellow)',
            display: 'flex', gap: 10, alignItems: 'center'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <div><strong>Pro Tip:</strong> Upload the downloaded PDF or CSV directly using the tool below.</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Bank Import Modal ───────────────────────────────────────────
function BankImportModal({ onClose }) {
  const qc = useQueryClient()
  const fileRef = useRef()
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)

  const mutation = useMutation({
    mutationFn: (f) => {
      const fd = new FormData(); fd.append('file', f)
      return api.post('/api/expenses/parse', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: ({ data }) => {
      setResult(data)
      qc.invalidateQueries(['expenses'])
      qc.invalidateQueries(['summary'])
      qc.invalidateQueries(['trend'])
      qc.invalidateQueries(['breakdown'])
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Import failed')
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Upload size={22} color="var(--accent)" /> Import Bank Statement
        </h2>
        {result ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h3 style={{ color: 'var(--text)', fontSize: 20 }}>{result.imported} transactions imported!</h3>
            <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={onClose}>Got it</button>
          </div>
        ) : (
          <>
            <BankGuide />

            <div
              id="bank-drop-zone"
              className={`drop-zone ${dragging ? 'active' : ''}`}
              onClick={() => fileRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}
              style={{ height: 140 }}
            >
              <div className="drop-zone-icon"><Database size={32} color="var(--text3)" /></div>
              {file
                ? <p style={{ color: 'var(--accent)', fontWeight: 700 }}>📄 {file.name}</p>
                : <><p style={{ fontWeight: 600, color: 'var(--text2)' }}>Drop CSV or PDF here</p><small style={{ color: 'var(--text3)' }}>or tap to browse</small></>
              }
              <input ref={fileRef} type="file" accept=".csv,.pdf" style={{ display: 'none' }}
                onChange={e => setFile(e.target.files[0])} />
            </div>
            <div className="modal-footer" style={{ marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button id="bank-import-btn" className="btn btn-primary"
                disabled={!file || mutation.isPending}
                onClick={() => mutation.mutate(file)}>
                {mutation.isPending ? <><span className="spinner" /> Importing...</> : <><Download size={18} style={{ marginRight: 8 }} /> Import Now</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Expenses Page ──────────────────────────────────────────
export default function Expenses() {
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [filterCat, setFilterCat] = useState('')
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const params = new URLSearchParams({ page, per_page: 20 })
  if (filterCat) params.append('category', filterCat)
  if (filterMonth) params.append('month', filterMonth)

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page, filterCat, filterMonth],
    queryFn: () => api.get(`/api/expenses?${params}`).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/expenses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['expenses'])
      qc.invalidateQueries(['summary'])
      qc.invalidateQueries(['trend'])
      qc.invalidateQueries(['breakdown'])
      toast.success('Expense deleted')
    }
  })

  const expenses = data?.expenses || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 20)

  // ── Date Grouping Logic ──
  const groupExpensesByDate = (exps) => {
    const groups = {}
    const today = format(new Date(), 'yyyy-MM-dd')
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

    exps.forEach(exp => {
      let dateLabel = exp.expense_date
      if (exp.expense_date === today) dateLabel = 'Today'
      else if (exp.expense_date === yesterday) dateLabel = 'Yesterday'
      else dateLabel = format(parseISO(exp.expense_date), 'dd MMM yyyy').toUpperCase()

      if (!groups[dateLabel]) groups[dateLabel] = []
      groups[dateLabel].push(exp)
    })
    return groups
  }

  const groupedExpenses = groupExpensesByDate(expenses)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-sub">{total} transactions</p>
        </div>
        <div className="page-header-controls" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', 
          gap: 12, 
          width: '100%',
          alignItems: 'center'
        }}>
          <div style={{ minWidth: 0 }}>
            <MonthNavigator value={filterMonth} onChange={m => { setFilterMonth(m); setPage(1) }} />
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ 
              height: 44, display: 'flex', justifyContent: 'center', 
              alignItems: 'center', borderRadius: 12, fontWeight: 800,
              width: '100%', padding: '0 4px'
            }} 
            onClick={() => setShowImport(true)}
          >
            <Upload size={18} style={{ marginRight: 6 }} />
            <span style={{ fontSize: 13 }}>Import</span>
          </button>
          
          <div className="hide-mobile">
            <button id="add-expense-btn" className="btn btn-primary" style={{ borderRadius: 12, height: 44, padding: '0 24px' }} onClick={() => setShowAdd(true)}>
              <Plus size={18} style={{ marginRight: 6 }} /> Add Expense
            </button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* ── Filters ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <select className="form-select" style={{ width: '100%', paddingLeft: 40, borderRadius: 12, height: 44 }}
              value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1) }}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* ── Expense List ── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 16 }}>
          {isLoading ? (
            <div style={{ padding: '0' }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ 
                  display: 'flex', alignItems: 'center', gap: 14, 
                  padding: '16px 20px', 
                  borderBottom: '1px solid var(--border)' 
                }}>
                  <div className="skeleton skeleton-circle" style={{ width: 40, height: 40, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 16, width: '50%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 10, width: '30%' }} />
                  </div>
                  <div className="skeleton" style={{ height: 20, width: 70, marginLeft: 'auto' }} />
                </div>
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="empty-state" style={{ padding: 60 }}>
              <div className="empty-state-icon" style={{ marginBottom: 16 }}><Receipt size={48} color="var(--text3)" /></div>
              <p style={{ fontWeight: 700, color: 'var(--text2)' }}>No transactions found for this period.</p>
              <button className="btn btn-primary" style={{ marginTop: 20, borderRadius: 12, height: 40 }} onClick={() => setShowAdd(true)}>
                Add your first expense
              </button>
            </div>
          ) : Object.entries(groupedExpenses).map(([date, items]) => (
            <div key={date}>
              {/* Date Header */}
              <div style={{ 
                background: 'var(--bg2)', 
                padding: '10px 20px', 
                fontSize: 10, 
                fontWeight: 800, 
                color: 'var(--text3)', 
                textTransform: 'uppercase', 
                letterSpacing: '1.2px',
                borderBottom: '1px solid var(--border)',
                borderTop: date !== Object.keys(groupedExpenses)[0] ? '1px solid var(--border)' : 'none'
              }}>
                {date}
              </div>

              {/* Transactions */}
              {items.map((exp, idx) => {
                const IconComp = CATEGORY_ICONS[exp.category] || Box
                const catColor = CATEGORY_COLORS[exp.category] || 'var(--accent)'
                return (
                  <div key={exp.id} 
                    className="stagger-item" 
                    onClick={() => setEditItem({ ...exp })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 20px',
                      borderBottom: '1px solid var(--border)',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      background: 'var(--surface)',
                      animationDelay: `${idx * 0.05}s`,
                      cursor: 'pointer'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.zIndex = '5';
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = 'var(--surface)';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.zIndex = '1';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Category color bar */}
                    <div style={{
                      position: 'absolute', left: 0, top: '20%', bottom: '20%',
                      width: 4, borderRadius: '0 4px 4px 0',
                      background: catColor,
                      boxShadow: `0 0 10px ${catColor}60`
                    }} />

                    {/* Icon container */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: 'var(--bg3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text2)',
                      border: '1px solid var(--border)'
                    }}>
                      <IconComp size={20} strokeWidth={1.8} />
                    </div>

                    {/* Description + category */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <div style={{
                        fontSize: 14.5, fontWeight: 700, color: 'var(--text)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        lineHeight: '20px'
                      }}>
                        {exp.description || exp.category}
                      </div>
                      <div style={{ 
                        fontSize: 10, fontWeight: 800, color: 'var(--text3)', 
                        textTransform: 'uppercase', letterSpacing: '0.8px',
                        fontFamily: 'var(--font-title)',
                        opacity: 0.8,
                        lineHeight: '16px'
                      }}>
                        {exp.category}
                      </div>
                    </div>

                    {/* Amount */}
                    <div style={{ 
                      flexShrink: 0, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'flex-end', 
                      marginLeft: 'auto',
                      paddingLeft: 10,
                      justifyContent: 'center'
                    }}>
                      <div style={{ 
                        fontWeight: 700, fontSize: 16, color: 'var(--text)', 
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '-0.5px',
                        lineHeight: '20px',
                        display: 'flex',
                        alignItems: 'baseline'
                      }}>
                        ₹{Number(exp.amount).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', justifyContent: 'center', alignItems: 'center', 
              gap: 20, padding: '24px', borderTop: '1px solid var(--border)',
              background: 'var(--bg2)'
            }}>
              <button className="btn btn-secondary btn-sm" style={{ minWidth: 100, borderRadius: 10, height: 36 }} 
                disabled={page <= 1} onClick={() => { setPage(p => p - 1); window.scrollTo(0,0) }}>
                <ChevronLeft size={16} style={{ marginRight: 4 }} /> Previous
              </button>
              
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                Page <span style={{ color: 'var(--text)' }}>{page}</span> of {totalPages}
              </div>
              
              <button className="btn btn-secondary btn-sm" style={{ minWidth: 100, borderRadius: 10, height: 36 }} 
                disabled={page >= totalPages} onClick={() => { setPage(p => p + 1); window.scrollTo(0,0) }}>
                Next <ChevronRight size={16} style={{ marginLeft: 4 }} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} />}
      {editItem && <AddExpenseModal editData={editItem} onClose={() => setEditItem(null)} />}
      {showImport && <BankImportModal onClose={() => setShowImport(false)} />}

      {/* Mobile FAB */}
      <button
        className="expense-fab"
        onClick={() => setShowAdd(true)}
        aria-label="Add expense"
      >
        <Plus size={24} strokeWidth={3} />
      </button>
    </div>
  )
}
