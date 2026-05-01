import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, Calendar, Plus, Edit2, TrendingUp, 
  ChevronRight, Receipt, PieChart, Activity,
  ArrowUpRight, ArrowDownRight, Clock, Target,
  Filter, Share2, MoreHorizontal, AlertCircle, X
} from 'lucide-react'
import { format, subMonths } from 'date-fns'
import api from '../api/client'
import * as Icons from 'lucide-react'
import AddExpenseModal from '../components/AddExpenseModal'
import toast from 'react-hot-toast'

// ── Set Limit Modal ─────────────────────────────────────────────
function SetLimitModal({ category, currentLimit, onClose, onSuccess }) {
  const [limit, setLimit] = useState(currentLimit || '')
  const mutation = useMutation({
    mutationFn: (val) => api.post('/api/budgets', { 
      category, 
      limit_amount: parseFloat(val),
      month_year: format(new Date(), 'yyyy-MM')
    }),
    onSuccess: () => {
      onSuccess()
      toast.success('Spending limit updated! 🎯')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to update limit')
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 340, borderRadius: 32, padding: 24 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
           <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(var(--accent-rgb), 0.15)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Target size={20} strokeWidth={2.5} />
           </div>
           <button onClick={onClose} style={{ border: 'none', background: 'none', color: 'var(--text3)', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        
        <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 6px' }}>Set Limit</h2>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 24 }}>Budget for <b>{category}</b></p>

        <div className="form-group" style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Limit Amount (₹)</label>
          <div style={{ position: 'relative' }}>
             <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, fontWeight: 800, color: 'var(--text2)' }}>₹</span>
             <input 
               autoFocus
               type="number" 
               className="form-input" 
               value={limit}
               onChange={e => setLimit(e.target.value)}
               style={{ height: 56, borderRadius: 16, fontSize: 24, fontWeight: 900, paddingLeft: 40, background: 'var(--bg2)', border: '1px solid var(--border)' }}
               placeholder="0"
             />
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          disabled={!limit || mutation.isPending}
          onClick={() => mutation.mutate(limit)}
          style={{ width: '100%', height: 52, borderRadius: 16, fontSize: 14, fontWeight: 800 }}
        >
          {mutation.isPending ? 'Updating...' : 'Confirm Limit'}
        </button>
      </div>
    </div>
  )
}

export default function CategoryDetails() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const categoryName = searchParams.get('name')
  
  const [timeRange, setTimeRange] = useState('this_month')
  const [customDates, setCustomDates] = useState({ start: '', end: '' })
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showSetLimit, setShowSetLimit] = useState(false)

  // Determine actual dates for API
  const getApiParams = () => {
    const params = { category: categoryName }
    if (timeRange === 'this_month') {
      params.month = format(new Date(), 'yyyy-MM')
    } else if (timeRange === 'last_month') {
      params.month = format(subMonths(new Date(), 1), 'yyyy-MM')
    } else if (timeRange === 'custom' && customDates.start && customDates.end) {
      params.start_date = customDates.start
      params.end_date = customDates.end
    }
    return params
  }

  const apiParams = getApiParams()

  // 1. Fetch Transactions
  const { data: expensesData, isLoading: loadingExps } = useQuery({
    queryKey: ['expenses', apiParams],
    queryFn: () => api.get('/api/expenses', { params: { ...apiParams, per_page: 50 } }).then(r => r.data)
  })

  // 2. Fetch Breakdown for % calculation
  const { data: breakdownData } = useQuery({
    queryKey: ['breakdown', apiParams.month || apiParams.start_date],
    queryFn: () => api.get('/api/dashboard/breakdown', { params: { month: apiParams.month, start_date: apiParams.start_date, end_date: apiParams.end_date } }).then(r => r.data)
  })

  // 3. Fetch Budgets to get the current limit
  const { data: budgetData } = useQuery({
    queryKey: ['budgets', format(new Date(), 'yyyy-MM')],
    queryFn: () => api.get('/api/budgets').then(r => r.data)
  })

  const expenses = expensesData?.expenses || []
  const categoryStat = breakdownData?.breakdown?.find(b => b.category === categoryName)
  const totalSpent = categoryStat?.amount || 0
  const percentage = categoryStat?.percentage || 0

  // 4. Fetch Previous Month for Comparison
  const prevMonthStr = format(subMonths(new Date(), 1), 'yyyy-MM')
  const { data: prevBreakdownData } = useQuery({
    queryKey: ['breakdown', prevMonthStr],
    queryFn: () => api.get('/api/dashboard/breakdown', { params: { month: prevMonthStr } }).then(r => r.data)
  })
  
  const prevCategoryStat = prevBreakdownData?.breakdown?.find(b => b.category === categoryName)
  const prevTotalSpent = prevCategoryStat?.amount || 0
  const diffAmount = totalSpent - prevTotalSpent
  const diffPercent = prevTotalSpent > 0 ? (Math.abs(diffAmount) / prevTotalSpent * 100).toFixed(1) : 0
  
  const activeBudget = budgetData?.find(b => b.category === categoryName)
  const currentLimit = activeBudget?.limit_amount || 0

  const SectionHeader = ({ title, icon: Icon }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, marginTop: 40 }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(var(--accent-rgb), 0.15)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} />
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 1.2, margin: 0 }}>{title}</h3>
    </div>
  )

  return (
    <div className="page-container" style={{ paddingBottom: 120, paddingTop: 20 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; box-shadow: 0 0 10px var(--red); }
          50% { transform: scale(1.4); opacity: 0.7; box-shadow: 0 0 25px var(--red); }
          100% { transform: scale(1); opacity: 1; box-shadow: 0 0 10px var(--red); }
        }
      `}} />
      {/* 1. Dynamic Fintech Header */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        marginBottom: 32, position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--bg)', padding: '10px 0'
      }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ 
            width: 42, height: 42, borderRadius: '50%', background: 'var(--bg2)', 
            border: '1px solid var(--border)', color: 'var(--text)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>{categoryName}</h1>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1 }}>Analysis</div>
        </div>
        <div style={{ width: 42 }} />
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        {/* 2. Hero Card (Revolut Style) */}
        <div className="card stagger-item" style={{ 
          padding: '40px 32px', borderRadius: 40, 
          background: 'linear-gradient(165deg, var(--bg2) 0%, var(--surface) 100%)',
          border: '1px solid var(--border)', marginBottom: 40, overflow: 'hidden', 
          position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}>
          {/* Subtle Background Glow */}
          <div style={{ 
            position: 'absolute', top: '-20%', right: '-10%', width: '60%', height: '100%',
            background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
            opacity: 0.08, pointerEvents: 'none'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
               <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 2 }}>Total Spent</div>
               {currentLimit > 0 && (
                 <div style={{ 
                   fontSize: 12, fontWeight: 900, color: totalSpent > currentLimit ? 'var(--red)' : 'var(--text2)', 
                   textTransform: 'uppercase', background: 'var(--bg3)', padding: '6px 12px', borderRadius: 10,
                   border: '1px solid var(--border)'
                 }}>
                   BUDGET: ₹{Math.floor(currentLimit).toLocaleString()}
                 </div>
               )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 24 }}>
              <span className="amount" style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px' }}>
                ₹{Math.floor(totalSpent).toLocaleString()}
              </span>
            </div>
            
            {/* Visual Progress Bar */}
            <div style={{ marginBottom: 24 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, fontWeight: 700 }}>
                 <span style={{ color: 'var(--text3)' }}>
                   {currentLimit > 0 ? (
                      activeBudget?.percentage >= 100 
                        ? `${Math.round(activeBudget.percentage - 100)}% above budget`
                        : `${Math.round(activeBudget.percentage)}% used`
                   ) : 'Wallet Share'}
                 </span>
               </div>
               <div style={{ width: '92%', height: 10, background: 'var(--bg3)', borderRadius: 10, overflow: 'visible', position: 'relative', marginTop: 12 }}>
                 {/* 100% Mark Indicator (High Visibility) */}
                 <div style={{ 
                   position: 'absolute', right: 0, top: -8, bottom: -8, width: 2, 
                   borderLeft: '2px dashed rgba(255,255,255,0.4)', zIndex: 10 
                 }} />
                 
                 <div style={{ 
                   width: `${currentLimit > 0 && activeBudget?.percentage > 100 ? 106 : Math.min(100, currentLimit > 0 ? activeBudget?.percentage : percentage)}%`, 
                   height: '100%', 
                   background: currentLimit > 0 
                     ? (activeBudget?.percentage >= 100 ? 'linear-gradient(90deg, #ef4444, #ff6b6b)' : activeBudget?.percentage >= 70 ? '#facc15' : '#22c55e') 
                     : 'var(--accent)', 
                   borderRadius: 10, 
                   boxShadow: currentLimit > 0 && activeBudget?.percentage >= 100 
                     ? '0 0 30px rgba(239, 68, 68, 0.6)' 
                     : `0 0 15px ${
                         currentLimit > 0 
                           ? (activeBudget?.percentage >= 70 ? '#facc1550' : '#22c55e50') 
                           : 'var(--accent)50'
                       }`,
                   transition: 'all 1s cubic-bezier(0.2, 0.8, 0.2, 1)',
                   position: 'relative'
                 }}>
                   {/* Pulsing End Cap for Overflow */}
                   {currentLimit > 0 && activeBudget?.percentage > 100 && (
                     <div style={{
                       position: 'absolute',
                       right: -6,
                       top: -3,
                       width: 14,
                       height: 14,
                       background: '#ef4444',
                       borderRadius: '50%',
                       boxShadow: '0 0 20px #ef4444',
                       animation: 'pulse 1.5s infinite',
                       zIndex: 10
                     }} />
                   )}
                 </div>
               </div>
            </div>

              <div style={{ display: 'flex', gap: 12 }}>
                {currentLimit > 0 && totalSpent > currentLimit ? (
                  <div style={{ 
                    padding: '8px 14px', borderRadius: 12, background: 'rgba(var(--red-rgb), 0.15)', 
                    color: 'var(--red)', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    <AlertCircle size={14} /> ₹{Math.floor(totalSpent - currentLimit).toLocaleString()} over budget
                  </div>
                ) : null}

                {prevTotalSpent > 0 && (
                  <div style={{ 
                    padding: '8px 14px', borderRadius: 12, 
                    background: diffAmount > 0 ? 'rgba(var(--red-rgb), 0.15)' : 'rgba(var(--green-rgb), 0.15)', 
                    color: diffAmount > 0 ? 'var(--red)' : 'var(--green)', 
                    fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    {diffAmount > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    ₹{Math.floor(Math.abs(diffAmount)).toLocaleString()} {diffAmount > 0 ? 'more' : 'less'} than last month
                  </div>
                )}

                {!activeBudget && prevTotalSpent === 0 && (
                   <div style={{ 
                    padding: '8px 14px', borderRadius: 12, background: 'rgba(var(--accent-rgb), 0.15)', 
                    color: 'var(--accent)', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    <Activity size={14} /> First time tracking this month
                  </div>
                )}
              </div>
          </div>
        </div>

        {/* 3. Time Analysis Chips */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 40, flexWrap: 'nowrap', overflowX: 'auto', padding: '4px 0', scrollbarWidth: 'none' }}>
          {[
            { id: 'this_month', label: 'This Month', icon: Calendar },
            { id: 'last_month', label: 'Last Month', icon: Clock },
            { id: 'custom', label: 'Custom', icon: Filter }
          ].map(range => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              style={{
                padding: '12px 24px', borderRadius: 20, fontSize: 13, fontWeight: 800,
                background: timeRange === range.id ? 'var(--accent)' : 'var(--bg2)',
                color: timeRange === range.id ? '#fff' : 'var(--text2)',
                border: '1px solid', borderColor: timeRange === range.id ? 'var(--accent)' : 'var(--border)',
                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8,
                whiteSpace: 'nowrap', boxShadow: timeRange === range.id ? '0 10px 20px rgba(var(--accent-rgb), 0.3)' : 'none'
              }}
            >
              <range.icon size={16} />
              {range.label}
            </button>
          ))}
        </div>

        {timeRange === 'custom' && (
          <div className="card stagger-item" style={{ 
            display: 'flex', gap: 16, padding: '24px', borderRadius: 24, marginBottom: 40,
            background: 'var(--bg2)', border: '1px solid var(--border)'
          }}>
             <div style={{ flex: 1 }}>
               <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>From</label>
               <input 
                 type="date" className="form-input" 
                 value={customDates.start} 
                 onChange={e => setCustomDates({...customDates, start: e.target.value})}
                 style={{ height: 48, borderRadius: 14, background: 'var(--bg)', border: '1px solid var(--border)' }}
               />
             </div>
             <div style={{ flex: 1 }}>
               <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>To</label>
               <input 
                 type="date" className="form-input" 
                 value={customDates.end} 
                 onChange={e => setCustomDates({...customDates, end: e.target.value})}
                 style={{ height: 48, borderRadius: 14, background: 'var(--bg)', border: '1px solid var(--border)' }}
               />
             </div>
          </div>
        )}

        {/* 4. Quick Actions (Fintech Style) */}
        <SectionHeader title="Quick Actions" icon={Activity} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <button 
            onClick={() => setShowAddExpense(true)}
            style={{
              padding: '24px', borderRadius: 32, background: 'var(--bg2)', 
              border: '1px solid var(--border)', color: 'var(--text)', 
              cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textAlign: 'left', position: 'relative', overflow: 'hidden'
            }}
            className="btn-hover-scale"
          >
            <div style={{ 
              width: 48, height: 48, borderRadius: 16, background: 'var(--accent)', 
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16, boxShadow: '0 8px 20px rgba(var(--accent-rgb), 0.4)'
            }}>
              <Plus size={24} strokeWidth={3} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>Add Expense</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Fast transaction entry</div>
          </button>

          <button 
            onClick={() => setShowSetLimit(true)}
            style={{
              padding: '24px', borderRadius: 32, background: 'var(--bg2)', 
              border: '1px solid var(--border)', color: 'var(--text)', 
              cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textAlign: 'left'
            }}
            className="btn-hover-scale"
          >
            <div style={{ 
              width: 48, height: 48, borderRadius: 16, background: 'var(--surface)', 
              color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16, border: '1px solid var(--border)'
            }}>
              <Target size={22} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>Set Budget</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Manage category budget</div>
          </button>
        </div>

        {/* 5. Transactions List */}
        <SectionHeader title="Recent Activity" icon={Receipt} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loadingExps ? (
            [...Array(5)].map((_, i) => <div key={i} className="card skeleton" style={{ height: 80, borderRadius: 24 }} />)
          ) : expenses.length === 0 ? (
            <div className="card" style={{ padding: 60, textAlign: 'center', borderRadius: 32, border: '1.5px dashed var(--border)' }}>
              <Clock size={40} color="var(--text3)" style={{ marginBottom: 16, opacity: 0.3 }} />
              <p style={{ fontWeight: 800, color: 'var(--text3)', margin: 0 }}>No entries found</p>
            </div>
          ) : expenses.map((exp, idx) => (
            <div 
              key={exp.id} 
              className="stagger-item"
              style={{ 
                display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px',
                borderRadius: 24, background: 'linear-gradient(135deg, var(--surface), var(--bg2))',
                border: '1px solid var(--border)', transition: 'all 0.2s', cursor: 'pointer',
                animationDelay: `${idx * 0.05}s`
              }}
            >
              <div style={{ 
                width: 48, height: 48, borderRadius: 14, background: 'var(--bg3)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                color: 'var(--text2)', border: '1px solid var(--border)'
              }}>
                <Receipt size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{exp.description || exp.category}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>{format(new Date(exp.expense_date), 'dd MMM yyyy')}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>₹{Math.floor(exp.amount).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {showAddExpense && (
        <AddExpenseModal 
          onClose={() => setShowAddExpense(false)} 
          defaultCategory={categoryName}
        />
      )}

      {showSetLimit && (
        <SetLimitModal 
          category={categoryName}
          currentLimit={currentLimit}
          onClose={() => setShowSetLimit(false)}
          onSuccess={() => qc.invalidateQueries(['budgets'])}
        />
      )}
    </div>
  )
}
