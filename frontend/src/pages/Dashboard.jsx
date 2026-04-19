import { useQuery } from '@tanstack/react-query'
import { format, subMonths, addMonths, parseISO } from 'date-fns'
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts'
import { 
  TrendingDown, Hash, Tag, Calendar, ChevronLeft, ChevronRight,
  UtensilsCrossed, Car, ShoppingBag, Film, Zap, Stethoscope, 
  GraduationCap, Plane, TrendingUp, Box, History, LayoutDashboard,
  Wallet, Pencil, CircleDollarSign
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'

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

const CATEGORY_ICONS = {
  'Food & Dining': UtensilsCrossed,
  'Transport':     Car,
  'Shopping':      ShoppingBag,
  'Entertainment': Film,
  'Bills & Utilities': Zap,
  'Healthcare':    Stethoscope,
  'Education':     GraduationCap,
  'Travel':        Plane,
  'Investments':   TrendingUp,
  'Other':         Box
}

const CATEGORY_EMOJI = {
  'Food & Dining': '🍔', 'Transport': '🚗', 'Shopping': '🛍️',
  'Entertainment': '🎬', 'Bills & Utilities': '💡', 'Healthcare': '💊',
  'Education': '📚', 'Travel': '✈️', 'Investments': '📈', 'Other': '📦'
}

function fmt(n) { 
  return (
    <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}>
      ₹{Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
    </span>
  )
}

// ── Month Picker Modal ──────────────────────────────────────────
function MonthPickerModal({ value, onChange, onClose }) {
  const [viewYear, setViewYear] = useState(parseInt(value?.split('-')[0] || new Date().getFullYear()))
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  const selectMonth = (idx) => {
    const monthStr = (idx + 1).toString().padStart(2, '0')
    onChange(`${viewYear}-${monthStr}`)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal" style={{ maxWidth: 320, padding: '24px', background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--border2)', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button className="arrow-btn" onClick={() => setViewYear(v => v - 1)}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '0.5px' }}>
            {viewYear}
          </div>
          <button className="arrow-btn" onClick={() => setViewYear(v => v + 1)}>
            <ChevronRight size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {months.map((m, i) => {
            const isSelected = value === `${viewYear}-${(i + 1).toString().padStart(2, '0')}`
            return (
              <button
                key={m}
                onClick={() => selectMonth(i)}
                style={{
                  height: 48,
                  borderRadius: 12,
                  border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: isSelected ? 'rgba(132, 101, 255, 0.15)' : 'rgba(255,255,255,0.02)',
                  color: isSelected ? 'var(--accent)' : 'var(--text2)',
                  fontSize: 13,
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? '0 0 15px rgba(132, 101, 255, 0.3)' : 'none'
                }}
              >
                {m}
              </button>
            )
          })}
        </div>

        <button 
          className="btn btn-secondary" 
          style={{ width: '100%', marginTop: 24, borderRadius: 12, height: 44, fontWeight: 700 }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  )
}

function MonthNavigator({ value, onChange }) {
  const [showPicker, setShowPicker] = useState(false)
  const current = format(new Date(), 'yyyy-MM')
  const isAllTime = value === 'all'
  const date = !isAllTime ? parseISO(value + '-01') : new Date()
  const isCurrentMonth = value >= current && !isAllTime

  const prev = () => onChange(format(subMonths(date, 1), 'yyyy-MM'))
  const next = () => { if (!isCurrentMonth) onChange(format(addMonths(date, 1), 'yyyy-MM')) }

  return (
    <div className="header-nav-group">
      <div className="segmented-control">
        <button onClick={() => onChange(current)} className={`seg-btn ${!isAllTime ? 'active' : ''}`}>Monthly</button>
        <button onClick={() => onChange('all')} className={`seg-btn ${isAllTime ? 'active' : ''}`}>All Time</button>
      </div>
      {!isAllTime && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="date-arrows">
            <button onClick={prev} className="arrow-btn"><ChevronLeft size={18} strokeWidth={2.5} /></button>
            <div className="date-label">{format(date, 'MMM yyyy')}</div>
            <button onClick={next} className="arrow-btn" disabled={isCurrentMonth}><ChevronRight size={18} strokeWidth={2.5} /></button>
          </div>
          
          <button 
            className="arrow-btn" 
            onClick={() => setShowPicker(true)}
            title="Calendar Explorer"
            style={{ 
              background: 'linear-gradient(135deg, rgba(132, 101, 255, 0.2), rgba(132, 101, 255, 0.05))',
              borderColor: 'rgba(132, 101, 255, 0.4)',
              color: 'var(--accent)',
              marginLeft: 8,
              width: 44,
              height: 44,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(132, 101, 255, 0.15)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer'
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(132, 101, 255, 0.3), rgba(132, 101, 255, 0.1))'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(132, 101, 255, 0.3)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(132, 101, 255, 0.2), rgba(132, 101, 255, 0.05))'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(132, 101, 255, 0.15)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <Calendar size={20} strokeWidth={2.2} />
          </button>

          {showPicker && (
            <MonthPickerModal 
              value={value} 
              onChange={onChange} 
              onClose={() => setShowPicker(false)} 
            />
          )}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [activeIndex, setActiveIndex] = useState(-1)
  const [showSalaryModal, setShowSalaryModal] = useState(false)
  const [salaryInput, setSalaryInput] = useState('')
  const qc = useQueryClient()

  const { data: summary, isLoading: s1 } = useQuery({
    queryKey: ['summary', month],
    queryFn: () => api.get(`/api/dashboard/summary?month=${month}`).then(r => r.data),
  })
  const { data: trend, isLoading: s2 } = useQuery({
    queryKey: ['trend', month],
    queryFn: () => api.get(`/api/dashboard/trend?month=${month}`).then(r => r.data),
  })
  const { data: breakdown, isLoading: s3 } = useQuery({
    queryKey: ['breakdown', month],
    queryFn: () => api.get(`/api/dashboard/breakdown?month=${month}`).then(r => r.data),
  })
  const { data: recentData } = useQuery({
    queryKey: ['recent-expenses'],
    queryFn: () => api.get('/api/expenses?page=1&per_page=5').then(r => r.data),
  })
  const recentExpenses = recentData?.expenses || []

  const loading = s1 || s2 || s3
  const isAllTime = month === 'all'

  const updateSalaryMutation = useMutation({
    mutationFn: (newSalary) => {
      // Get current user info from query client if possible, or just update salary
      // For this app, we know /api/auth/me handles the full user update
      // We'll fetch current user info first or just use placeholders for name/email
      return api.get('/api/auth/me').then(res => {
        const user = res.data;
        return api.put('/api/auth/me', {
          name: user.name,
          email: user.email,
          monthly_income: parseFloat(newSalary)
        })
      })
    },
    onSuccess: () => {
      qc.invalidateQueries(['summary'])
      setShowSalaryModal(false)
    }
  })

  const openSalaryModal = () => {
    setSalaryInput(summary?.monthly_income || '')
    setShowSalaryModal(true)
  }

  const handleUpdateSalary = (e) => {
    e.preventDefault()
    updateSalaryMutation.mutate(salaryInput)
  }

  const trendData = trend?.trend?.map(d => {
    let dateLabel = d.date
    try {
      if (isAllTime) {
        dateLabel = format(parseISO(d.date + '-01'), 'MMM yy')
      } else {
        dateLabel = format(new Date(d.date + 'T00:00:00'), 'dd MMM')
      }
    } catch(e) {}
    return { date: dateLabel, amount: d.amount }
  }) || []

  const pieData = breakdown?.breakdown || []

  const changeIcon = summary?.change_percentage > 0 ? '↑' : '↓'
  const changeClass = summary?.change_percentage > 0 ? 'up' : 'down'

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Your financial overview</p>
        </div>
        <div className="page-header-controls">
          <MonthNavigator value={month} onChange={setMonth} />
        </div>
      </div>

      <div className="page-body">
        {/* Stat Cards */}
        <div className="stat-grid">
          {/* 1. Available Balance Card [NEW] */}
          {!isAllTime && (
            <div className="stat-card stagger-item" style={{ 
              animationDelay: '0.05s',
              border: !loading && summary?.total_spent > summary?.monthly_income 
                ? '1px solid rgba(255,107,107,0.3)' 
                : '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="stat-icon" style={{ 
                  background: !loading && summary?.total_spent > summary?.monthly_income ? 'rgba(255,107,107,0.1)' : 'rgba(74,222,128,0.1)'
                }}>
                  <Wallet size={20} strokeWidth={1.8} color={!loading && summary?.total_spent > summary?.monthly_income ? 'var(--red)' : 'var(--green)'} />
                </div>
                <button 
                  onClick={openSalaryModal}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text3)', padding: 4, borderRadius: 6, cursor: 'pointer' }}
                  title="Update Salary"
                >
                  <Pencil size={14} />
                </button>
              </div>
              <div className="stat-label">Available Balance</div>
              <div className="stat-value" style={{ 
                color: !loading && summary?.total_spent > (summary?.monthly_income * 0.9) ? 'var(--red)' : 'var(--text)' 
              }}>
                {loading ? <div className="skeleton" style={{ height: 28, width: 100, borderRadius: 8 }} /> : fmt(summary?.monthly_income - summary?.total_spent)}
              </div>
              <div className="stat-change" style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CircleDollarSign size={12} />
                {loading ? '...' : `Limit: ${summary?.suggested_daily_limit || 0}/day`}
              </div>
            </div>
          )}

          <div className="stat-card stagger-item" style={{ animationDelay: '0.1s' }}>
            <div className="stat-icon"><TrendingDown size={20} strokeWidth={1.8} color="var(--accent)" /></div>
            <div className="stat-label">Total Spent</div>
            <div className="stat-value">
              {loading ? <div className="skeleton" style={{ height: 28, width: 100, borderRadius: 8 }} /> : fmt(summary?.total_spent)}
            </div>
            <div className={`stat-change ${changeClass}`}>
              {isAllTime ? 'Across all months' : `${changeIcon} ${Math.abs(summary?.change_percentage || 0)}% vs last month`}
            </div>
          </div>
          <div className="stat-card stagger-item" style={{ animationDelay: '0.2s' }}>
            <div className="stat-icon"><Hash size={20} strokeWidth={1.8} color="var(--accent2)" /></div>
            <div className="stat-label">Transactions</div>
            <div className="stat-value">
              {loading 
                ? <div className="skeleton" style={{ height: 28, width: 60, borderRadius: 8 }} /> 
                : <span style={{ fontFamily: 'var(--font-mono)' }}>{summary?.transaction_count || 0}</span>
              }
            </div>
            <div className="stat-change" style={{ color: 'var(--text3)' }}>{isAllTime ? 'Account lifetime' : 'This month'}</div>
          </div>
          <div className="stat-card stagger-item" style={{ animationDelay: '0.3s' }}>
            <div className="stat-icon"><Tag size={20} strokeWidth={1.8} color="var(--accent3)" /></div>
            <div className="stat-label">Top Category</div>
            <div className="stat-value" style={{ fontSize: 16, paddingTop: 4, fontWeight: 700 }}>
              {loading ? <div className="skeleton" style={{ height: 24, width: 120, borderRadius: 6 }} /> : (summary?.top_category || '—')}
            </div>
            <div className="stat-change" style={{ color: 'var(--text3)' }}>
              {summary?.top_category ? fmt(summary?.by_category?.[summary.top_category]) : ''}
            </div>
          </div>
          <div className="stat-card stagger-item" style={{ animationDelay: '0.4s' }}>
            <div className="stat-icon"><Calendar size={20} strokeWidth={1.8} color="var(--text3)" /></div>
            <div className="stat-label">{isAllTime ? 'Monthly Avg' : 'Prev. Month'}</div>
            <div className="stat-value">
              {loading ? <div className="skeleton" style={{ height: 28, width: 100, borderRadius: 8 }} /> : (isAllTime 
                ? fmt(summary?.total_spent / (trendData.length || 1)) 
                : fmt(summary?.previous_month_spent))
              }
            </div>
            <div className="stat-change" style={{ color: 'var(--text3)' }}>
              {isAllTime ? 'Estimated average' : format(subMonths(new Date(month + '-01'), 1), 'MMM yyyy')}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="chart-grid">
            <div className="chart-wrap stagger-item" style={{ animationDelay: '0.5s' }}>
              <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={16} color="var(--accent3)" />
                {isAllTime ? 'Monthly Spending Growth' : 'Daily Spending Trend'}
              </div>
              {loading ? (
                <div className="skeleton" style={{ height: 220, width: '100%', borderRadius: 16, marginTop: 10 }} />
              ) : trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity={1}/>
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.4}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'var(--text3)', fontSize: 10, fontWeight: 500, fontFamily: 'var(--font-mono)' }} 
                      axisLine={false} 
                      tickLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      width={55}
                      tick={{ 
                        fill: 'var(--text3)', 
                        fontSize: 10,
                        textAnchor: 'start',
                        fontFamily: 'var(--font-mono)'
                      }} 
                      dx={-50}
                      tickFormatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`}
                    />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, color: 'var(--text)', fontSize: 12, pointerEvents: 'none' }}
                      itemStyle={{ pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}
                      formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Spent']}
                      cursor={{ fill: 'rgba(132, 101, 255, 0.08)', radius: 4 }}
                    />
                    <Bar
                      dataKey="amount"
                      fill="url(#barGradient)"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <div className="empty-state-icon">📊</div>
                <p>No spending data yet</p>
              </div>
            )}
          </div>

          <div className="chart-wrap">
            <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag size={16} color="var(--accent)" />
              {isAllTime ? 'Lifetime Categories' : 'Category Breakdown'}
            </div>
            {loading ? (
              <div className="skeleton" style={{ height: 200, width: '100%', borderRadius: 16, marginTop: 10 }} />
            ) : pieData.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
                {/* 1. The Donut Chart */}
                <div style={{ height: 200, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        dataKey="amount"
                        stroke="none"
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(-1)}
                        onClick={(_, index) => setActiveIndex(index)}
                        activeIndex={activeIndex}
                      >
                        {pieData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CATEGORY_COLORS[entry.category] || '#7c5cff'} 
                            stroke={activeIndex === index ? 'rgba(255,255,255,0.8)' : 'none'}
                            strokeWidth={3}
                            style={{ 
                              outline: 'none', 
                              cursor: 'pointer',
                              transition: 'all 0.2s ease-out'
                            }}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Label (Dynamic Sync) */}
                  <div style={{ 
                    position: 'absolute', top: '50%', left: '50%', 
                    transform: 'translate(-50%, -50%)', 
                    textAlign: 'center', pointerEvents: 'none',
                    width: '100%',
                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                  }}>
                    {activeIndex === -1 ? (
                      <>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Spent</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginTop: -2 }}>{fmt(summary?.total_spent)}</div>
                      </>
                    ) : (
                      <>
                        <div style={{ 
                          fontSize: 11, fontWeight: 800, 
                          color: CATEGORY_COLORS[pieData[activeIndex]?.category] || '#7c5cff', 
                          textTransform: 'uppercase', letterSpacing: 0.5,
                          maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {pieData[activeIndex]?.category}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginTop: -2 }}>
                          {fmt(pieData[activeIndex]?.amount)}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)' }}>
                          {pieData[activeIndex]?.percentage}%
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* AI Insight Line */}
                <div style={{ 
                  background: 'rgba(108,99,255,0.08)',
                  border: '1px solid rgba(108,99,255,0.15)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: -8,
                  marginBottom: -4
                }}>
                  <Zap size={16} color="var(--yellow)" />
                  <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
                    You spent most on <span style={{ color: CATEGORY_COLORS[pieData[0]?.category] || '#7c5cff', fontWeight: 700 }}>{pieData[0]?.category}</span> ({pieData[0]?.percentage}%)
                  </div>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: '0' }}>
                  {pieData.map((cat, i) => (
                    <div key={cat.category} 
                      onMouseEnter={() => setActiveIndex(i)}
                      onMouseLeave={() => setActiveIndex(-1)}
                      style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'auto auto auto 1fr auto auto', 
                        alignItems: 'center', 
                        padding: '10px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: activeIndex === i ? 'rgba(255,255,255,0.03)' : 'transparent',
                        borderRadius: 4
                      }}>
                      <div style={{ 
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginLeft: 4,
                        background: CATEGORY_COLORS[cat.category] || '#7c5cff'
                      }} />
                      <span style={{ fontSize: 16, marginLeft: 10, marginRight: 10, color: 'var(--text2)' }}>
                        {(() => {
                          const IconComp = CATEGORY_ICONS[cat.category] || Box
                          return <IconComp size={16} strokeWidth={1.8} />
                        })()}
                      </span>
                      <div style={{ 
                        fontSize: 12, fontWeight: 700, color: '#ffffff',
                        wordBreak: 'break-word', lineHeight: 1.2
                      }}>
                        {cat.category}
                      </div>
                      <div style={{ flex: 1 }} />
                      <div style={{ 
                        textAlign: 'right', fontSize: 13, fontWeight: 800, 
                        color: '#6bbf95', 
                        whiteSpace: 'nowrap', minWidth: 70 
                      }}>
                        ₹{cat.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </div>
                      <div style={{ 
                        textAlign: 'right', fontSize: 11, fontWeight: 700, 
                        color: '#94A3B8', marginLeft: 8, minWidth: 40 
                      }}>
                        {cat.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <div className="empty-state-icon">🍩</div>
                <p>No categories yet</p>
              </div>
            )}
          </div>
        </div>


        {/* Category List (Desktop) */}
        {pieData.length > 0 && (
          <div className="card hide-mobile" style={{ marginTop: 24 }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <LayoutDashboard size={14} />
              {isAllTime ? 'Full Spending Breakdown' : 'Category Details'}
            </div>
            <div className="insight-list">
              {pieData.map((cat, i) => (
                <div key={cat.category} className="insight-row">
                  <div className="insight-dot" style={{ background: CATEGORY_COLORS[cat.category] || '#7c5cff' }} />
                  <span style={{ fontSize: 16, flexShrink: 0, color: 'var(--text2)' }}>
                    {(() => {
                      const IconComp = CATEGORY_ICONS[cat.category] || Box
                      return <IconComp size={18} strokeWidth={1.8} />
                    })()}
                  </span>
                  <span className="insight-label">{cat.category}</span>
                  <div className="insight-value">{fmt(cat.amount)}</div>
                  <div className="insight-percent">{cat.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 0 }}>
              <History size={14} />
              Recent Transactions
            </div>
            <a href="/expenses" style={{ fontSize: 12, color: 'var(--accent3)', cursor: 'pointer' }}>View all →</a>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', borderBottom: '1px solid var(--border)' }}>
                  <div className="skeleton skeleton-circle" style={{ width: 36, height: 36, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 6 }} />
                    <div className="skeleton" style={{ height: 10, width: '40%' }} />
                  </div>
                  <div className="skeleton" style={{ height: 18, width: 60, marginLeft: 'auto' }} />
                </div>
              ))}
            </div>
          ) : recentExpenses.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-icon">🧾</div>
              <p>No transactions yet. <a href="/expenses" style={{ color: 'var(--accent3)' }}>Add your first expense</a></p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentExpenses.map(exp => (
                <div key={exp.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 4px', borderBottom: '1px solid var(--border)'
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: 'var(--bg3)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'var(--text2)'
                  }}>
                    {(() => {
                      const IconComp = CATEGORY_ICONS[exp.category] || Box
                      return <IconComp size={18} strokeWidth={1.8} />
                    })()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: 13.5, fontWeight: 500, color: 'var(--text)',
                      lineHeight: 1.3, wordBreak: 'break-word',
                      marginBottom: 2
                    }}>
                      {exp.description || exp.category}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>
                      {exp.category} · {format(new Date(exp.expense_date + 'T00:00:00'), 'dd MMM yyyy')}
                    </div>
                  </div>
                  <div style={{ 
                    fontWeight: 700, color: 'var(--text)', fontSize: 14, 
                    flexShrink: 0, marginLeft: 'auto', paddingLeft: 12, textAlign: 'right' 
                  }}>
                    {fmt(exp.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Salary Update Modal [NEW] */}
      {showSalaryModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justify_content: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)'
        }}>
          <div className="card" style={{ 
            width: '90%', maxWidth: 400, padding: 32, 
            background: 'var(--surface)', border: '1px solid var(--border2)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div className="auth-logo-icon" style={{ background: 'var(--accent)', marginBottom: 20 }}>
              <CircleDollarSign size={24} color="white" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Update Monthly Income</h3>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24 }}>
              Set your expected earnings this month to track your available balance and daily limits.
            </p>
            
            <form onSubmit={handleUpdateSalary}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase' }}>Monthly Salary (₹)</label>
                <input 
                  type="number" 
                  className="form-select" 
                  style={{ width: '100%', padding: '0 16px', borderRadius: 12, height: 48 }}
                  value={salaryInput}
                  onChange={e => setSalaryInput(e.target.value)}
                  placeholder="50000"
                  autoFocus
                />
              </div>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ flex: 1, background: 'var(--bg3)', borderRadius: 12 }}
                  onClick={() => setShowSalaryModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, borderRadius: 12 }}
                  disabled={updateSalaryMutation.isLoading}
                >
                  {updateSalaryMutation.isLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
