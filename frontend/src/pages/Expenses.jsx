import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, subMonths, addMonths, parseISO, subDays } from 'date-fns'
import { useSearchParams } from 'react-router-dom'
import { 
  Plus, 
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import api from '../api/client'
import * as Icons from 'lucide-react'
import { categoryService } from '../api/categoryService'
import AddExpenseModal from '../components/AddExpenseModal'

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

export default function Expenses() {
  const [searchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') || ''
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [filterCat, setFilterCat] = useState(initialCategory)
  const [showCatMenu, setShowCatMenu] = useState(false)
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [page, setPage] = useState(1)
  
  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: categoryService.getCategories })
  const categories = catData || []
  
  const params = new URLSearchParams({ page, per_page: 20 })
  if (filterCat) params.append('category', filterCat)
  if (filterMonth) params.append('month', filterMonth)
  
  const { data, isLoading } = useQuery({ 
    queryKey: ['expenses', page, filterCat, filterMonth], 
    queryFn: () => api.get(`/api/expenses?${params}`).then(r => r.data) 
  })
  
  const expenses = data?.expenses || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 20)

  const groupedExpenses = expenses.reduce((groups, exp) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
    let dateLabel = exp.expense_date
    if (exp.expense_date === today) dateLabel = 'Today'
    else if (exp.expense_date === yesterday) dateLabel = 'Yesterday'
    else dateLabel = format(parseISO(exp.expense_date), 'dd MMM yyyy').toUpperCase()
    if (!groups[dateLabel]) groups[dateLabel] = []
    groups[dateLabel].push(exp)
    return groups
  }, {})

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Expenses</h1><p className="page-sub">{total} transactions</p></div>
        <div className="page-header-controls" style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end' }}>
          <MonthNavigator value={filterMonth} onChange={m => { setFilterMonth(m); setPage(1) }} />
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAdd(true)}
            style={{ height: 44, padding: '0 20px', borderRadius: 12, gap: 8, display: 'flex', alignItems: 'center' }}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>
      <div className="page-body">
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', zIndex: 10 }} />
            
            {/* Custom Category Dropdown (High Fidelity) */}
            <div className="custom-select-container" style={{ position: 'relative', width: '100%' }}>
              <div 
                onClick={() => setShowCatMenu(!showCatMenu)}
                className="form-input" 
                style={{ 
                  paddingLeft: 40, borderRadius: 12, height: 44, display: 'flex', alignItems: 'center', 
                  justifyContent: 'space-between', cursor: 'pointer', background: 'var(--bg2)',
                  border: showCatMenu ? '1px solid var(--accent)' : '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {!filterCat ? <Icons.LayoutGrid size={16} color="var(--accent)" /> : (() => {
                    const catInfo = categories.find(c => c.name === filterCat);
                    const IconComp = Icons[catInfo?.icon] || Icons.Tag;
                    return <IconComp size={16} color="var(--accent)" />;
                  })()}
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                    {filterCat || 'All Categories'}
                  </span>
                </div>
                <Icons.ChevronDown size={16} style={{ transform: showCatMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.5 }} />
              </div>

              {showCatMenu && (
                <>
                  <div 
                    style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
                    onClick={() => setShowCatMenu(false)} 
                  />
                  <div 
                    className="stagger-item"
                    style={{ 
                      position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8,
                      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
                      boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden', padding: 6,
                      backdropFilter: 'blur(12px)'
                    }}
                  >
                    <div 
                      onClick={() => { setFilterCat(''); setPage(1); setShowCatMenu(false); }}
                      className="dropdown-item"
                      style={{ 
                        padding: '12px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12,
                        cursor: 'pointer', transition: 'all 0.2s',
                        background: !filterCat ? 'rgba(132, 101, 255, 0.15)' : 'transparent'
                      }}
                    >
                      <div style={{ width: 16, display: 'flex', justifyContent: 'center' }}>
                        {!filterCat ? <Icons.Check size={14} color="var(--accent)" strokeWidth={3} /> : null}
                      </div>
                      <Icons.LayoutGrid size={16} color={!filterCat ? 'var(--accent)' : 'var(--text3)'} />
                      <span style={{ flex: 1, fontWeight: !filterCat ? 800 : 500, color: !filterCat ? 'var(--accent)' : 'var(--text2)' }}>All Categories</span>
                    </div>

                    <div style={{ height: 1, background: 'var(--border)', margin: '6px 10px', opacity: 0.5 }} />

                    <div className="dropdown-scroll-area" style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 4, webkitOverflowScrolling: 'touch' }}>
                      {categories.map(c => {
                        const IconComp = Icons[c.icon] || Icons.Tag
                        const isSelected = filterCat === c.name
                        return (
                          <div 
                            key={c.id} 
                            onClick={() => { setFilterCat(c.name); setPage(1); setShowCatMenu(false); }}
                            className="dropdown-item"
                            style={{ 
                              padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12,
                              cursor: 'pointer', transition: 'all 0.2s', marginBottom: 2,
                              background: isSelected ? 'rgba(132, 101, 255, 0.15)' : 'transparent'
                            }}
                          >
                            <div style={{ width: 16, display: 'flex', justifyContent: 'center' }}>
                              {isSelected ? <Icons.Check size={14} color="var(--accent)" strokeWidth={3} /> : null}
                            </div>
                            <IconComp size={16} color={isSelected ? 'var(--accent)' : 'var(--text3)'} />
                            <span style={{ flex: 1, fontWeight: isSelected ? 800 : 500, color: isSelected ? 'var(--accent)' : 'var(--text2)' }}>{c.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 16 }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 15, fontWeight: 600 }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              Analyzing your financial history...
            </div>
          ) : expenses.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>📝</div>
              <div style={{ color: 'var(--text2)', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No transactions yet</div>
              <p style={{ color: 'var(--text3)', fontSize: 14 }}>Start by adding your first expense to see the magic.</p>
            </div>
          ) : (
            Object.entries(groupedExpenses).map(([date, items]) => (
              <div key={date}>
                <div style={{ background: 'var(--bg2)', padding: '10px 20px', fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{date}</div>
                {items.map(exp => (
                  <div key={exp.id} onClick={() => setEditItem(exp)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icons.Receipt size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{exp.description || exp.category}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>{exp.category}</div>
                    </div>
                    <div className="amount" style={{ fontWeight: 700 }}>₹{Number(exp.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                  </div>
                ))}
              </div>
            ))
          )}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              padding: '24px', gap: 20, borderTop: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.01)'
            }}>
              <button 
                disabled={page <= 1} 
                onClick={() => setPage(p => p - 1)}
                className="btn-hover-scale"
                style={{ 
                  width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.3 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <ChevronLeft size={20} />
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{page}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>of</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{totalPages}</span>
              </div>

              <button 
                disabled={page >= totalPages} 
                onClick={() => setPage(p => p + 1)}
                className="btn-hover-scale"
                style={{ 
                  width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.3 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
      {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} />}
      {editItem && <AddExpenseModal editData={editItem} onClose={() => setEditItem(null)} />}
      <button className="expense-fab" onClick={() => setShowAdd(true)}><Plus size={24} strokeWidth={3} /></button>
    </div>
  )
}
