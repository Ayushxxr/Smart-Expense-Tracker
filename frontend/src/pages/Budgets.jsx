import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, subMonths, addMonths, parseISO, getDaysInMonth, getDate } from 'date-fns'
import { Calendar, ChevronLeft, ChevronRight, Target, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import api from '../api/client'
import toast from 'react-hot-toast'
import * as Icons from 'lucide-react'
import { categoryService } from '../api/categoryService'

const CATEGORY_FALLBACK_COLOR = '#6b7280'
const CATEGORY_FALLBACK_ICON = Icons.Target

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
        <Calendar size={16} color="var(--text3)" strokeWidth={1.8} />
      </div>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setOpen(false)} />
          <div className="month-popover">
            <div className="year-nav">
              <button type="button" className="btn-icon btn-sm" onClick={() => setViewYear(v => v - 1)}><ChevronLeft size={16} /></button>
              <div className="year-display">{viewYear}</div>
              <button type="button" className="btn-icon btn-sm" onClick={() => setViewYear(v => v + 1)}><ChevronRight size={16} /></button>
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
  const [open, setOpen] = useState(false)
  const current = format(new Date(), 'yyyy-MM')
  const date = parseISO(value + '-01')
  const isCurrentMonth = value >= current
  
  const currentYear = parseInt(value.split('-')[0])
  const currentMonth = parseInt(value.split('-')[1])
  const [viewYear, setViewYear] = useState(currentYear)
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const prev = () => onChange(format(subMonths(date, 1), 'yyyy-MM'))
  const next = () => { if (!isCurrentMonth) onChange(format(addMonths(date, 1), 'yyyy-MM')) }

  const handleSelect = (mIdx) => {
    const newVal = `${viewYear}-${String(mIdx + 1).padStart(2, '0')}`
    onChange(newVal)
    setOpen(false)
  }

  return (
    <div className="date-navigator-wrap" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div className="date-arrows">
        <button onClick={prev} className="arrow-btn"><ChevronLeft size={18} /></button>
        <div className="date-label" style={{ userSelect: 'none' }}>
          {format(date, 'MMM yyyy')}
        </div>
        <button onClick={next} className="arrow-btn" disabled={isCurrentMonth}><ChevronRight size={18} /></button>
      </div>

      <div style={{ position: 'relative' }}>
        <button 
          onClick={() => { setOpen(!open); setViewYear(currentYear); }}
          className="btn-icon"
          style={{ 
            width: 44, height: 44, borderRadius: 14, 
            background: 'var(--bg3)', 
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = 'rgba(var(--accent-rgb), 0.1)';
            e.currentTarget.style.borderColor = 'var(--accent)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'var(--bg3)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <Calendar size={20} color="var(--accent)" strokeWidth={1.8} />
        </button>

        {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setOpen(false)} />
            <div className="month-popover" style={{ top: '100%', right: 0, marginTop: 12, zIndex: 1000, transform: 'none' }}>
              <div className="year-nav">
                <button type="button" className="btn-icon btn-sm" onClick={() => setViewYear(v => v - 1)}><ChevronLeft size={16} /></button>
                <div className="year-display">{viewYear}</div>
                <button type="button" className="btn-icon btn-sm" onClick={() => setViewYear(v => v + 1)}><ChevronRight size={16} /></button>
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
    </div>
  )
}


function fmt(n) { 
  return (
    <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}>
      ₹{Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
    </span>
  )
}

function BudgetModal({ editData, onClose }) {
  const qc = useQueryClient()
  const today = new Date()
  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories
  })
  const categories = catData || []

  const [form, setForm] = useState(editData ? {
    ...editData,
    limit_amount: String(editData.limit_amount)
  } : {
    category: categories[0]?.name || 'Food & Dining',
    limit_amount: '',
    month_year: format(today, 'yyyy-MM')
  })

  const mutation = useMutation({
    mutationFn: (data) => api.post('/api/budgets', data),
    onSuccess: () => {
      qc.invalidateQueries(['budgets-page'])
      qc.invalidateQueries(['budgets'])
      toast.success(editData ? 'Budget updated ✅' : 'Budget saved ✅')
      onClose()
    },
    onError: err => toast.error(err.response?.data?.detail || 'Error saving budget')
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/budgets/${editData.id}`),
    onSuccess: () => {
      qc.invalidateQueries(['budgets-page'])
      qc.invalidateQueries(['budgets'])
      toast.success('Budget removed')
      onClose()
    }
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Target size={22} color="var(--accent)" />
          {editData ? 'Edit Budget' : 'Set Budget'}
        </h2>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate({ ...form, limit_amount: parseFloat(form.limit_amount) }) }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category} disabled={!!editData}
              onChange={e => setForm({ ...form, category: e.target.value })}>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            {editData && <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>* Category cannot be changed after creation</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Monthly Limit (₹)</label>
            <input className="form-input" type="number" min="1" placeholder="5000"
              value={form.limit_amount}
              onChange={e => setForm({ ...form, limit_amount: e.target.value })} 
              style={{ fontSize: 16, fontWeight: 700 }}
              required />
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Month</label>
            <MonthPicker
              value={form.month_year}
              onChange={val => setForm({ ...form, month_year: val })} />
          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            {editData ? (
              <button 
                type="button" 
                className="btn btn-icon" 
                style={{ color: 'var(--red)', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}
                onClick={() => { if (confirm('Remove this budget?')) deleteMutation.mutate() }}
              >
                <Trash2 size={16} /> Delete
              </button>
            ) : <div />}
            
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-secondary" style={{ borderRadius: 12 }} onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ borderRadius: 12 }} disabled={mutation.isPending}>
                {mutation.isPending ? <span className="spinner" /> : (editData ? 'Update' : 'Save Budget')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Budgets() {
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const qc = useQueryClient()

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories
  })
  const categories = catData || []

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets-page', month],
    queryFn: () => api.get(`/api/budgets?month_year=${month}`).then(r => r.data),
  })

  // Monthly Budget Health Calculations
  const totalLimit = budgets.reduce((sum, b) => sum + b.limit_amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent_amount, 0)
  const totalPercent = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0
  const totalRemaining = totalLimit - totalSpent

  // Runway Logic
  const dateObj = parseISO(month + '-01')
  const daysInMonth = getDaysInMonth(dateObj)
  const isSelectedCurrentMonth = format(new Date(), 'yyyy-MM') === month
  const daysPassed = isSelectedCurrentMonth ? getDate(new Date()) : daysInMonth
  const daysRemaining = daysInMonth - daysPassed

  const getBudgetHealth = (spent, limit) => {
    const ratio = spent / (limit || 1)
    
    if (ratio >= 1) return { label: 'OVER BUDGET', color: 'var(--red)', rgb: 'var(--red-rgb)' }
    if (ratio >= 0.7) return { label: 'NEAR LIMIT', color: 'var(--yellow)', rgb: 'var(--yellow-rgb)' }
    return { label: 'ON TRACK', color: 'var(--green)', rgb: 'var(--green-rgb)' }
  }

  const getRunway = (spent, limit) => {
    const remaining = Math.round(limit - spent)
    const daily = Math.max(0, Math.round(remaining / (daysRemaining || 1)))
    
    return {
      remaining: Math.abs(remaining).toLocaleString('en-IN', { maximumFractionDigits: 0 }),
      daily: daily.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
      isOver: spent >= limit
    }
  }

  const health = totalRemaining < 0 ? { label: "EXCEEDED", color: "var(--red)", rgb: "var(--red-rgb)" } : totalPercent > 70 ? { label: "NEAR LIMIT", color: "var(--yellow)", rgb: "var(--yellow-rgb)" } : { label: "HEALTHY", color: "var(--green)", rgb: "var(--green-rgb)" }

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes budget-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes status-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes gauge-draw {
          from { stroke-dashoffset: 251.2; }
          to { stroke-dashoffset: ${251.2 - (251.2 * Math.min(totalPercent, 100)) / 100}; }
        }
        .shimmer-bar {
          position: relative;
          overflow: hidden;
        }
        .shimmer-bar::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: budget-shimmer 2.5s infinite linear;
        }
      `}} />
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h1 className="page-title" style={{ marginBottom: 0 }}>Budgets</h1>
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `rgba(${health.rgb}, 0.1)`,
              padding: '4px 10px', borderRadius: 10,
              border: `1px solid rgba(${health.rgb}, 0.2)`
            }}>
              <div style={{ 
                width: 6, height: 6, borderRadius: '50%', 
                background: health.color,
                boxShadow: `0 0 8px ${health.color}`,
                animation: 'status-pulse 2s infinite ease-in-out'
              }} />
              <span style={{ 
                color: health.color,
                fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                {health.label}
              </span>
            </div>
          </div>
          <p className="page-sub">Financial Intelligence & Runway Control</p>
        </div>
        <div className="page-header-controls" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 12, 
          width: '100%',
          maxWidth: 400 
        }}>
          <MonthNavigator value={month} onChange={setMonth} />
        </div>
      </div>

      {/* Floating Action Button for Budget [NEW] */}
      <button 
        id="add-budget-btn" 
        className="btn btn-primary" 
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed',
          bottom: 100, // Above the tab bar
          right: 24,
          zIndex: 900,
          height: 56,
          width: 'auto',
          minWidth: 150,
          padding: '0 24px',
          borderRadius: 20,
          fontSize: 15,
          fontWeight: 800,
          boxShadow: '0 12px 24px -6px rgba(132, 101, 255, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'linear-gradient(135deg, var(--accent), #704dff)',
          border: '1px solid rgba(255,255,255,0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 16px 32px -8px rgba(132, 101, 255, 0.6)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(132, 101, 255, 0.5)';
        }}
      >
        <Icons.Plus size={20} strokeWidth={3} />
        Set Budget
      </button>

      <div className="page-body">
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card" style={{ padding: 24, borderRadius: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div className="skeleton skeleton-circle" style={{ width: 44, height: 44, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 18, width: '60%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 10, width: '30%' }} />
                  </div>
                </div>
                <div className="skeleton" style={{ height: 10, width: '100%', marginBottom: 20, borderRadius: 10 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="skeleton" style={{ height: 14, width: 70 }} />
                  <div className="skeleton" style={{ height: 14, width: 70 }} />
                </div>
              </div>
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="card" style={{ 
            border: '2px dashed var(--border)', 
            background: 'transparent', 
            borderRadius: 32,
            padding: '80px 40px',
            textAlign: 'center'
          }}>
            <div className="empty-state">
              <div style={{ 
                width: 80, height: 80, borderRadius: 30, background: 'rgba(132, 101, 255, 0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
              }}>
                <Target size={40} color="var(--accent)" strokeWidth={1} style={{ opacity: 0.6 }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Clear the Fog</h3>
              <p style={{ color: 'var(--text3)', maxWidth: 300, margin: '0 auto 24px', lineHeight: 1.5 }}>Set monthly limits to master your financial flow.</p>
              <button className="btn btn-primary" style={{ height: 48, padding: '0 32px', borderRadius: 16 }} onClick={() => setShowModal(true)}>
                Initialize Budget
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="stagger-item">
              {/* Elite Health Cockpit Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 24, md: 48 }, 
              marginBottom: 48,
              padding: '0 8px',
              flexWrap: 'wrap'
            }}>
              {/* Left: Circular Gauge */}
              <div style={{ position: 'relative', width: 120, height: 120 }}>
                <svg width="120" height="120" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--border)" strokeWidth="8" />
                  {/* Progress Circle */}
                  <circle 
                    cx="50" cy="50" r="40" fill="transparent" 
                    stroke={health.color} 
                    strokeWidth="8" 
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * Math.min(totalPercent, 100)) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ animation: 'gauge-draw 1.5s ease-out forwards', filter: `drop-shadow(0 0 8px ${health.color}40)` }}
                  />
                  {/* Percentage Text - UPDATED LOGIC */}
                  <text x="50" y="55" fontSize="18" fontWeight="900" fill="var(--text)" textAnchor="middle" fontFamily="var(--font-title)">
                    {totalPercent}%
                  </text>
                  {totalPercent > 100 && (
                    <text x="50" y="66" fontSize="7" fontWeight="800" fill="var(--red)" textAnchor="middle" textTransform="uppercase" letterSpacing="0.5">OVER</text>
                  )}
                </svg>
              </div>

              {/* Right: Integrated Stats Panel */}
              <div style={{ display: 'flex', gap: 40, flex: 1, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                    {totalRemaining < 0 ? 'EXCEEDED BY' : 'REMAINING'}
                  </div>
                  <div style={{ 
                    fontSize: 32, fontWeight: 900, 
                    color: totalRemaining < 0 ? 'var(--red)' : 'var(--text)',
                    fontFamily: 'var(--font-title)',
                    letterSpacing: '-1px'
                  }}>
                    {fmt(Math.abs(totalRemaining))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                    TOTAL LIMIT
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text2)', fontFamily: 'var(--font-title)' }}>
                    {fmt(totalLimit)}
                  </div>
                </div>
              </div>
            </div>
          </div>

            {/* Budget Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24, paddingBottom: 100 }}>
              {budgets.map((b, idx) => {
                const catInfo = categories.find(c => c.name === b.category)
                const accent = catInfo?.color || CATEGORY_FALLBACK_COLOR
                const IconComp = Icons[catInfo?.icon] || CATEGORY_FALLBACK_ICON
                const isExceeded = b.status === 'exceeded'
                const isWarning = b.status === 'warning'
                
                return (
                  <div key={b.id} 
                    className="card stagger-item" 
                    onClick={() => setEditItem(b)}
                    style={{ 
                      position: 'relative', 
                      background: 'var(--surface)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow)',
                      borderRadius: 24,
                      padding: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      animationDelay: `${0.2 + idx * 0.05}s`
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                      e.currentTarget.style.borderColor = accent;
                      e.currentTarget.style.boxShadow = `0 20px 40px -10px ${accent}20`;
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ 
                          width: 44, height: 44, borderRadius: 14, 
                          background: `rgba(var(--accent-rgb), 0.1)`, 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `1px solid var(--border)`,
                          boxShadow: `0 0 15px rgba(var(--accent-rgb), 0.05)`
                        }}>
                          <span style={{ fontSize: 20 }}>
                            <IconComp size={24} strokeWidth={2} />
                          </span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: 16, fontFamily: 'var(--font-title)' }}>
                            {b.category}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: 11, 
                          fontWeight: 800, 
                          color: getBudgetHealth(b.spent_amount, b.limit_amount).color,
                          letterSpacing: 0.5
                        }}>
                          {getBudgetHealth(b.spent_amount, b.limit_amount).label}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5, marginBottom: 2 }}>Current Usage</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: isExceeded ? 'var(--red)' : 'var(--text)' }}>
                          {fmt(b.spent_amount)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5, marginBottom: 2 }}>Allowance</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)', opacity: 0.8 }}>
                          {fmt(b.limit_amount)}
                        </div>
                      </div>
                    </div>

                    <div className="budget-bar-bg" style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%',
                          width: `${Math.min(b.percentage, 100)}%`,
                          background: isExceeded ? 'linear-gradient(90deg, var(--red), #f87171)' : isWarning ? 'linear-gradient(90deg, var(--yellow), #fde047)' : `linear-gradient(90deg, var(--green), #16a34a)`,
                          boxShadow: isExceeded ? '0 0 10px rgba(var(--red-rgb), 0.4)' : 'none',
                          borderRadius: 4,
                          transition: 'width 0.8s ease-out'
                        }} 
                      />
                    </div>

                    <div style={{ 
                      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', 
                      marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' 
                    }}>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                          {(b.limit_amount - b.spent_amount) < 0 ? 'Exceeded' : 'Remaining'}
                        </div>
                        <div style={{ 
                          fontSize: 14, fontWeight: 800, 
                          color: (b.limit_amount - b.spent_amount) < 0 ? 'var(--red)' : 'var(--text)' 
                        }}>
                          ₹{getRunway(b.spent_amount, b.limit_amount).remaining}
                        </div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                          Daily Limit
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: (b.limit_amount - b.spent_amount) <= 0 ? 'var(--red)' : 'var(--text)', lineHeight: 1.2 }}>
                          {(b.limit_amount - b.spent_amount) <= 0 ? (
                            'No safe daily limit'
                          ) : (
                            <>
                              ₹{getRunway(b.spent_amount, b.limit_amount).daily}/day
                              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text3)', marginTop: 2 }}>
                                for next {daysRemaining || 1} days
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', cursor: 'pointer' }}>
                          Manage
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {showModal && <BudgetModal onClose={() => setShowModal(false)} />}
      {editItem && <BudgetModal editData={editItem} onClose={() => setEditItem(null)} />}
    </div>
  )
}
