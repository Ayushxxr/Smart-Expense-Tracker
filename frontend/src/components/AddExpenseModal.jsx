import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import * as Icons from 'lucide-react'
import api from '../api/client'
import toast from 'react-hot-toast'
import { categoryService } from '../api/categoryService'

export default function AddExpenseModal({ onClose, editData }) {
  const qc = useQueryClient()
  const [showCatMenu, setShowCatMenu] = useState(false)
  const haptic = (s = 10) => { try { window.navigator?.vibrate?.(s) } catch(e) {} }
  const [recentCats, setRecentCats] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recent_categories') || '[]') } catch { return [] }
  })
  
  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories
  })
  const categories = catData || []

  const [form, setForm] = useState(editData || {
    amount: '', 
    category: 'Other', 
    description: '',
    expense_date: format(new Date(), 'yyyy-MM-dd')
  })

  // Set initial category when categories load
  useEffect(() => {
    if (!editData && categories.length > 0 && form.category === 'Other') {
      setForm(prev => ({ ...prev, category: categories[0].name }))
    }
  }, [categories, editData])

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
      // Save to recent categories
      const updated = [form.category, ...recentCats.filter(c => c !== form.category)].slice(0, 3)
      setRecentCats(updated)
      localStorage.setItem('recent_categories', JSON.stringify(updated))
      haptic([20, 50, 20])
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
    <div className="modal-overlay" onClick={onClose} style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div className="modal scale-in" onClick={e => e.stopPropagation()} style={{ animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {editData ? <Edit2 size={22} color="var(--accent)" /> : <Plus size={22} color="var(--accent)" />}
          {editData ? 'Edit Expense' : 'Add Expense'}
        </h2>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate({ ...form, amount: parseFloat(form.amount) }) }}>
          <div className="form-group">
            <label className="form-label">Amount</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 16, fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>₹</span>
              <input id="expense-amount" className="form-input" type="number" min="0.01" step="0.01"
                inputMode="decimal"
                placeholder="Enter amount" value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })} 
                style={{ paddingLeft: 40, fontSize: 18, fontWeight: 800, color: 'var(--text)' }} 
                required autoFocus />
            </div>
            
            {/* Quick Amount Buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {[100, 500, 1000].map(amt => (
                <button 
                  key={amt}
                  type="button"
                  onClick={() => {
                    haptic(15)
                    setForm(prev => ({ ...prev, amount: (parseFloat(prev.amount || 0) + amt).toString() }))
                  }}
                  style={{ 
                    padding: '6px 12px', borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)',
                    color: 'var(--text2)', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  className="btn-hover-scale"
                >
                  + ₹{amt}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Category</label>

            {/* Recent Category Chips */}
            {recentCats.length > 0 && !editData && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                {recentCats.map(cat => {
                  const catInfo = categories.find(c => c.name === cat)
                  const IconComp = Icons[catInfo?.icon] || Icons.Tag
                  const isActive = form.category === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        haptic(10)
                        setForm(prev => ({ ...prev, category: cat }))
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 20,
                        background: isActive ? 'rgba(132,101,255,0.2)' : 'var(--bg3)',
                        border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
                        color: isActive ? 'var(--accent)' : 'var(--text3)',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      <IconComp size={11} />
                      {cat}
                    </button>
                  )
                })}
                <span style={{ fontSize: 10, color: 'var(--text3)', alignSelf: 'center', fontWeight: 600 }}>Recent</span>
              </div>
            )}
            <div 
              onClick={() => setShowCatMenu(!showCatMenu)}
              className="form-input" 
              style={{ 
                borderRadius: 12, height: 44, display: 'flex', alignItems: 'center', 
                justifyContent: 'space-between', cursor: 'pointer', background: 'var(--bg2)',
                border: showCatMenu ? '1px solid var(--accent)' : '1px solid var(--border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {(() => {
                  const catInfo = categories.find(c => c.name === form.category);
                  const IconComp = Icons[catInfo?.icon] || Icons.Tag;
                  return <IconComp size={16} color="var(--accent)" />;
                })()}
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                  {form.category}
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
                  <div className="dropdown-scroll-area" style={{ maxHeight: 250, overflowY: 'auto', paddingRight: 4, webkitOverflowScrolling: 'touch' }}>
                    {categories.map(c => {
                      const IconComp = Icons[c.icon] || Icons.Tag
                      const isSelected = form.category === c.name
                      return (
                        <div 
                          key={c.id} 
                          onClick={() => { setForm({ ...form, category: c.name }); setShowCatMenu(false); }}
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
          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <input id="expense-desc" className="form-input" type="text"
              placeholder="e.g. Dinner at Barbeque Nation"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Date</label>
              <button 
                type="button" 
                onClick={() => setForm(prev => ({ ...prev, expense_date: format(new Date(), 'yyyy-MM-dd') }))}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Today
              </button>
            </div>
            <input id="expense-date" className="form-input" type="date"
              value={form.expense_date}
              onChange={e => setForm({ ...form, expense_date: e.target.value })} required />
          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            {editData ? (
              <button 
                type="button" 
                className="btn btn-icon delete-btn" 
                style={{ 
                  color: 'var(--red)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', 
                  borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onClick={() => {
                  haptic(20)
                  deleteMutation.mutate()
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <span className="spinner" /> : <Trash2 size={16} />}
                <span>Delete</span>
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
