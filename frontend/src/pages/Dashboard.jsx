import { useQuery } from '@tanstack/react-query'
import { format, subMonths, addMonths, parseISO } from 'date-fns'
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid, LabelList
} from 'recharts'
import api from '../api/client'

const COLORS = [
  '#6c63ff', '#ff6584', '#43e97b', '#fa709a',
  '#4facfe', '#f093fb', '#fda085', '#a18cd1'
]

const CATEGORY_EMOJI = {
  'Food & Dining': '🍔', 'Transport': '🚗', 'Shopping': '🛍️',
  'Entertainment': '🎬', 'Bills & Utilities': '💡', 'Healthcare': '💊',
  'Education': '📚', 'Travel': '✈️', 'Investments': '📈', 'Other': '📦'
}

function fmt(n) { return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` }

function MonthNavigator({ value, onChange }) {
  const current = format(new Date(), 'yyyy-MM')
  const isAllTime = value === 'all'
  const date = !isAllTime ? parseISO(value + '-01') : new Date()
  const isCurrentMonth = value >= current && !isAllTime

  const prev = () => onChange(format(subMonths(date, 1), 'yyyy-MM'))
  const next = () => { if (!isCurrentMonth) onChange(format(addMonths(date, 1), 'yyyy-MM')) }

  return (
    <div className="header-nav-group">
      {/* Segmented Control */}
      <div className="segmented-control">
        <button 
          onClick={() => onChange(current)}
          className={`seg-btn ${!isAllTime ? 'active' : ''}`}
        >Monthly</button>
        <button 
          onClick={() => onChange('all')}
          className={`seg-btn ${isAllTime ? 'active' : ''}`}
        >All Time</button>
      </div>

      {/* Date Arrows */}
      {!isAllTime && (
        <div className="date-arrows">
          <button onClick={prev} className="arrow-btn">‹</button>
          <div className="date-label">
            {format(date, 'MMM yyyy')}
          </div>
          <button onClick={next} className="arrow-btn" disabled={isCurrentMonth}>›</button>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [activeIndex, setActiveIndex] = useState(-1)

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
          <h1 className="page-title">📊 Dashboard</h1>
          <p className="page-sub">Your financial overview</p>
        </div>
        <div className="page-header-controls">
          <MonthNavigator value={month} onChange={setMonth} />
        </div>
      </div>

      <div className="page-body">
        {/* Stat Cards */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon">💸</div>
            <div className="stat-label">Total Spent</div>
            <div className="stat-value">{loading ? '...' : fmt(summary?.total_spent)}</div>
            <div className={`stat-change ${changeClass}`}>
              {isAllTime ? 'Across all months' : `${changeIcon} ${Math.abs(summary?.change_percentage || 0)}% vs last month`}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🧾</div>
            <div className="stat-label">Transactions</div>
            <div className="stat-value">{loading ? '...' : summary?.transaction_count || 0}</div>
            <div className="stat-change" style={{ color: 'var(--text3)' }}>{isAllTime ? 'Account lifetime' : 'This month'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-label">Top Category</div>
            <div className="stat-value" style={{ fontSize: 16, paddingTop: 4 }}>
              {loading ? '...' : (summary?.top_category ? `${CATEGORY_EMOJI[summary.top_category] || '📦'} ${summary.top_category}` : '—')}
            </div>
            <div className="stat-change" style={{ color: 'var(--text3)' }}>
              {summary?.top_category ? fmt(summary?.by_category?.[summary.top_category]) : ''}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-label">{isAllTime ? 'Monthly Avg' : 'Prev. Month'}</div>
            <div className="stat-value">
              {loading ? '...' : isAllTime 
                ? fmt(summary?.total_spent / (trendData.length || 1)) 
                : fmt(summary?.previous_month_spent)
              }
            </div>
            <div className="stat-change" style={{ color: 'var(--text3)' }}>
              {isAllTime ? 'Estimated average' : format(subMonths(new Date(month + '-01'), 1), 'MMM yyyy')}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="chart-grid">
          <div className="chart-wrap">
            <div className="chart-title">📈 {isAllTime ? 'Monthly Spending Growth' : 'Daily Spending Trend'}</div>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#6060a0', fontSize: 11, fontWeight: 500 }} 
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
                      textAnchor: 'start'
                    }} 
                    dx={-50}
                    tickFormatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`}
                  />
                  <Tooltip
                    contentStyle={{ background: '#1a1a30', border: '1px solid #2d2d5e', borderRadius: 8, color: '#f0f0ff', pointerEvents: 'none' }}
                    itemStyle={{ pointerEvents: 'none' }}
                    formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Spent']}
                    cursor={{ fill: 'rgba(108,99,255,0.12)', radius: 4 }}
                  />
                  <Bar
                    dataKey="amount"
                    fill="#6c63ff"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
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
            <div className="chart-title">🍩 {isAllTime ? 'Lifetime Categories' : 'Category Breakdown'}</div>
            {pieData.length > 0 ? (
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
                            fill={COLORS[index % COLORS.length]} 
                            stroke={activeIndex === index ? 'rgba(255,255,255,0.8)' : 'none'}
                            strokeWidth={3}
                            style={{ 
                              outline: 'none', 
                              cursor: 'pointer',
                              filter: activeIndex === index ? `drop-shadow(0 0 8px ${COLORS[index % COLORS.length]})` : 'none',
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
                          color: COLORS[activeIndex % COLORS.length], 
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
                  <span style={{ fontSize: 16 }}>💡</span>
                  <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
                    You spent most on <span style={{ color: COLORS[0], fontWeight: 700 }}>{pieData[0]?.category}</span> ({pieData[0]?.percentage}%)
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
                        background: COLORS[i % COLORS.length], 
                        boxShadow: `0 0 6px ${COLORS[i % COLORS.length]}` 
                      }} />
                      <span style={{ fontSize: 16, marginLeft: 10, marginRight: 10 }}>
                        {CATEGORY_EMOJI[cat.category] || '📦'}
                      </span>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap' }}>
                        {cat.category}
                      </div>
                      <div style={{ flex: 1 }} />
                      <div style={{ 
                        textAlign: 'right', fontSize: 13, fontWeight: 800, 
                        color: '#4ADE80', 
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
            <div className="card-title">📊 {isAllTime ? 'Full Spending Breakdown' : 'Category Details'}</div>
            <div className="insight-list">
              {pieData.map((cat, i) => (
                <div key={cat.category} className="insight-row">
                  <div className="insight-dot" style={{ background: COLORS[i % COLORS.length] }} />
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{CATEGORY_EMOJI[cat.category] || '📦'}</span>
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
            <div className="card-title" style={{ marginBottom: 0 }}>🕐 Recent Transactions</div>
            <a href="/expenses" style={{ fontSize: 12, color: 'var(--accent3)', cursor: 'pointer' }}>View all →</a>
          </div>
          {recentExpenses.length === 0 ? (
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
                    justifyContent: 'center', fontSize: 18
                  }}>
                    {CATEGORY_EMOJI[exp.category] || '📦'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {exp.description || exp.category}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>
                      {exp.category} · {format(new Date(exp.expense_date + 'T00:00:00'), 'dd MMM yyyy')}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14, flexShrink: 0 }}>
                    {fmt(exp.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
