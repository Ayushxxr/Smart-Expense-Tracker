import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, subMonths, addMonths, parseISO } from 'date-fns'
import api from '../api/client'
import toast from 'react-hot-toast'

function MonthPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const currentYear = parseInt(value.split('-')[0])
  const currentMonth = parseInt(value.split('-')[1])
  const [viewYear, setViewYear] = useState(currentYear)

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const handleSelect = (mIdx) => {
    const newVal = `${viewYear}-${String(mIdx + 1).padStart(2, '0')}`
    onChange(newVal)
    setOpen(false)
  }

  const displayDate = parseISO(`${value}-01`)

  return (
    <div className="month-picker-wrap">
      <div className="month-input-facade" onClick={() => setOpen(!open)}>
        <span>{format(displayDate, 'MMMM, yyyy')}</span>
        <span>📅</span>
      </div>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setOpen(false)} />
          <div className="month-popover">
            <div className="year-nav">
              <button type="button" className="btn-icon btn-sm" onClick={() => setViewYear(v => v - 1)}>‹</button>
              <div className="year-display">{viewYear}</div>
              <button type="button" className="btn-icon btn-sm" onClick={() => setViewYear(v => v + 1)}>›</button>
            </div>
            <div className="month-grid">
              {MONTHS.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  className={`month-btn ${viewYear === currentYear && (i + 1) === currentMonth ? 'selected' : ''}`}
                  onClick={() => handleSelect(i)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}


function MonthNavigator({ value, onChange }) {
  const current = format(new Date(), 'yyyy-MM')
  const date = parseISO(value + '-01')
  const isCurrentMonth = value >= current
  const prev = () => onChange(format(subMonths(date, 1), 'yyyy-MM'))
  const next = () => { if (!isCurrentMonth) onChange(format(addMonths(date, 1), 'yyyy-MM')) }
  return (
    <div className="date-arrows">
      <button onClick={prev} className="arrow-btn">‹</button>
      <div className="date-label">{format(date, 'MMM yyyy')}</div>
      <button onClick={next} className="arrow-btn" disabled={isCurrentMonth}>›</button>
    </div>
  )
}

const CATEGORIES = [
  'Food & Dining','Transport','Shopping','Entertainment',
  'Bills & Utilities','Healthcare','Education','Travel','Investments','Other'
]

const CATEGORY_EMOJI = {
  'Food & Dining': '🍔', 'Transport': '🚗', 'Shopping': '🛍️',
  'Entertainment': '🎬', 'Bills & Utilities': '💡', 'Healthcare': '💊',
  'Education': '📚', 'Travel': '✈️', 'Investments': '📈', 'Other': '📦'
}

const CATEGORY_COLORS = {
  'Food & Dining': '#ff6584',
  'Transport': '#4facfe',
  'Shopping': '#fa709a',
  'Entertainment': '#a18cd1',
  'Bills & Utilities': '#fda085',
  'Healthcare': '#43e97b',
  'Education': '#6c63ff',
  'Travel': '#f093fb',
  'Investments': '#38f9d7',
  'Other': '#c3cfe2'
}

function fmt(n) { return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` }

function BudgetModal({ onClose }) {
  const qc = useQueryClient()
  const today = new Date()
  const [form, setForm] = useState({
    category: 'Food & Dining',
    limit_amount: '',
    month_year: format(today, 'yyyy-MM')
  })

  const mutation = useMutation({
    mutationFn: (data) => api.post('/api/budgets', data),
    onSuccess: () => {
      qc.invalidateQueries(['budgets-page'])
      qc.invalidateQueries(['budgets'])
      toast.success('Budget saved ✅')
      onClose()
    },
    onError: err => toast.error(err.response?.data?.detail || 'Error saving budget')
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">🎯 Set Budget</h2>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate({ ...form, limit_amount: parseFloat(form.limit_amount) }) }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Monthly Limit (₹)</label>
            <input className="form-input" type="number" min="1" placeholder="5000"
              value={form.limit_amount}
              onChange={e => setForm({ ...form, limit_amount: e.target.value })} 
              required />
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Month</label>
            <MonthPicker
              value={form.month_year}
              onChange={val => setForm({ ...form, month_year: val })} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? <span className="spinner" /> : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Budgets() {
  const [showModal, setShowModal] = useState(false)
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const qc = useQueryClient()

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets-page', month],
    queryFn: () => api.get(`/api/budgets?month_year=${month}`).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/budgets/${id}`),
    onSuccess: () => { qc.invalidateQueries(['budgets-page']); toast.success('Budget removed') }
  })

  // Monthly Budget Health Calculations
  const totalLimit = budgets.reduce((sum, b) => sum + b.limit_amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent_amount, 0)
  const totalPercent = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0
  const totalRemaining = totalLimit - totalSpent

  return (
    <div>
      <div className="page-header">
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 className="page-title">🎯 Budgets</h1>
          <p className="page-sub">Set and track spending limits</p>
        </div>
          <div className="page-header-controls">
          <MonthNavigator value={month} onChange={setMonth} />
          <button id="add-budget-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            ➕ Set Budget
          </button>
        </div>
      </div>

      <div className="page-body">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--text3)' }}>
            <span className="spinner" style={{ margin: '0 auto 16px' }} />
            <div>Loading budgets...</div>
          </div>
        ) : budgets.length === 0 ? (
          <div className="card" style={{ borderStyle: 'dashed', background: 'transparent' }}>
            <div className="empty-state">
              <div className="empty-state-icon">🎯</div>
              <p>No budgets set for this month.</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                Set your first budget
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Budget Health Summary */}
            <div className="card" style={{ marginBottom: 28, background: 'linear-gradient(135deg, rgba(108,99,255,0.1), rgba(255,101,132,0.05))', border: '1px solid rgba(108,99,255,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>Monthly Utilization</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: totalRemaining < 0 ? 'var(--red)' : 'var(--text)' }}>
                    {totalPercent}% <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text3)' }}>Used</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>Remaining</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: totalRemaining < 0 ? 'var(--red)' : '#4ade80' }}>
                    {fmt(totalRemaining)}
                  </div>
                </div>
              </div>
              <div className="budget-bar-bg" style={{ height: 10 }}>
                <div className="budget-bar-fill ok" style={{ 
                  width: `${Math.min(totalPercent, 100)}%`,
                  background: totalPercent > 90 ? 'var(--red)' : totalPercent > 75 ? 'var(--yellow)' : 'var(--accent)'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: 'var(--text3)' }}>
                <span>Total Limit: {fmt(totalLimit)}</span>
                <span>Spent: {fmt(totalSpent)}</span>
              </div>
            </div>

            {/* Budget Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {budgets.map(b => (
                <div key={b.id} className="card" style={{ position: 'relative', borderLeft: `4px solid ${CATEGORY_COLORS[b.category] || 'var(--accent)'}` }}>
                  <button
                    className="btn-icon"
                    style={{ position: 'absolute', top: 12, right: 12 }}
                    onClick={() => { if (confirm('Remove this budget?')) deleteMutation.mutate(b.id) }}
                  >🗑️</button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: 28 }}>{CATEGORY_EMOJI[b.category] || '📦'}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{b.category}</div>
                      <div style={{ fontSize: 11, color: b.status === 'exceeded' ? 'var(--red)' : b.status === 'warning' ? 'var(--yellow)' : 'var(--text3)' }}>
                        {b.status === 'exceeded' ? '🚨 Exceeded' : b.status === 'warning' ? '⚠️ Warning' : '✅ On Track'}
                      </div>
                    </div>
                  </div>

                  <div className="budget-bar-bg">
                    <div className={`budget-bar-fill ${b.status}`}
                      style={{ width: `${Math.min(b.percentage, 100)}%` }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 13 }}>
                    <div>
                      <div style={{ color: 'var(--text3)', fontSize: 11 }}>Limit</div>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{fmt(b.limit_amount)}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: 'var(--text3)', fontSize: 11 }}>Used</div>
                      <div style={{ fontWeight: 700, color: b.status === 'exceeded' ? 'var(--red)' : 'var(--text)' }}>{b.percentage}%</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--text3)', fontSize: 11 }}>Remaining</div>
                      <div style={{ fontWeight: 700, color: (b.limit_amount - b.spent_amount) < 0 ? 'var(--red)' : '#4ade80' }}>
                        {fmt(b.limit_amount - b.spent_amount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showModal && <BudgetModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
