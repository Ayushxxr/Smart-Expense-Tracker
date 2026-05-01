import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Box, Palette, Layout, Search, Settings2, Info, ChevronRight, Activity } from 'lucide-react'
import * as Icons from 'lucide-react'
import { categoryService } from '../api/categoryService'
import toast from 'react-hot-toast'

const ICON_LIST = [
  'Utensils', 'Car', 'ShoppingBag', 'Film', 'Zap', 'Heart', 'GraduationCap', 
  'Plane', 'TrendingUp', 'Gift', 'Dog', 'Dumbbell', 'Gamepad2', 'Music', 
  'Smartphone', 'Coffee', 'Pizza', 'Briefcase', 'Home', 'Hammer', 'Shirt', 'Watch'
]

const COLOR_LIST = [
  '#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', 
  '#6366f1', '#06b6d4', '#14b8a6', '#f43f5e', '#22c55e', '#6b7280'
]

export default function Categories() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', icon: 'Box', color: '#6366f1' })

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories
  })

  const addMutation = useMutation({
    mutationFn: (data) => categoryService.createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries(['categories'])
      toast.success('Category created! 🚀')
      setShowAdd(false)
      setNewCat({ name: '', icon: 'Box', color: '#6366f1' })
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to create category')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => categoryService.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries(['categories'])
      toast.success('Category removed')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to delete')
  })

  return (
    <div className="page-container" style={{ paddingBottom: 120 }}>
      {/* Premium Fintech Header */}
      <div className="page-header" style={{ marginBottom: 40 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent)', marginBottom: 8 }}>
            <div style={{ width: 4, height: 16, background: 'var(--accent)', borderRadius: 2 }} />
            <span style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>Workspace</span>
          </div>
          <h1 className="page-title" style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1px' }}>Categories</h1>
          <p className="page-sub" style={{ fontSize: 15, opacity: 0.7 }}>Define how you organize your financial world</p>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', 
        gap: 16 
      }}>
        {/* Create New Card */}
        <div 
          onClick={() => setShowAdd(true)}
          className="card stagger-item" 
          style={{ 
            padding: '24px 20px', borderRadius: 32, 
            background: 'rgba(var(--accent-rgb), 0.08)',
            border: '2px dashed rgba(var(--accent-rgb), 0.3)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.3s ease',
            minHeight: 180, textAlign: 'center'
          }}
        >
           <div style={{ 
             width: 52, height: 52, borderRadius: '50%', 
             background: 'var(--accent)', color: '#fff', 
             display: 'flex', alignItems: 'center', justifyContent: 'center', 
             marginBottom: 16, boxShadow: '0 8px 20px rgba(108, 99, 255, 0.3)' 
           }}>
              <Plus size={26} strokeWidth={3} />
           </div>
           <div>
             <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)', display: 'block' }}>Create New</span>
             <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>Add custom group</span>
           </div>
        </div>

        {isLoading ? (
          [...Array(7)].map((_, i) => (
            <div key={i} className="card skeleton" style={{ height: 180, borderRadius: 24 }} />
          ))
        ) : categories?.map((cat, idx) => {
          const IconComp = Icons[cat.icon] || Box
          return (
            <div key={cat.id} 
              className="card stagger-item" 
              onClick={() => navigate(`/category-details?name=${encodeURIComponent(cat.name)}`)}
              style={{ 
                animationDelay: `${idx * 0.04}s`,
                padding: '24px 20px', borderRadius: 32, 
                background: 'linear-gradient(165deg, var(--surface) 0%, var(--bg2) 100%)',
                border: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                position: 'relative', overflow: 'hidden',
                transition: 'all 0.3s ease',
                minHeight: 180,
                cursor: 'pointer'
              }}
            >
              {/* Top Accent Line */}
              <div style={{ 
                position: 'absolute', top: 0, left: '20%', right: '20%', height: 3, 
                background: `linear-gradient(90deg, transparent, ${cat.color}, transparent)`,
                opacity: 0.5
              }} />

              {/* Icon Container */}
              <div style={{ 
                width: 56, height: 56, borderRadius: 18, 
                background: `${cat.color}10`, color: cat.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20, border: `1.5px solid ${cat.color}20`,
                boxShadow: `0 10px 20px ${cat.color}05`
              }}>
                <IconComp size={28} strokeWidth={2.2} />
              </div>

              <div style={{ width: '100%' }}>
                <h3 style={{ 
                  fontSize: 16, fontWeight: 800, color: 'var(--text)', 
                  margin: '0', letterSpacing: '-0.3px' 
                }}>
                  {cat.name}
                </h3>
              </div>

              {/* Quick Actions Footer */}
              <div style={{ 
                marginTop: 'auto', width: '100%', pt: 16, 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
              }}>
                 {!cat.is_default ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); if(confirm('Delete this category?')) deleteMutation.mutate(cat.id) }}
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.08)', color: 'var(--red)',
                        border: 'none', width: 34, height: 34, borderRadius: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                 ) : (
                    <div style={{ width: 34 }} />
                 )}
                 <div style={{ 
                   width: 40, height: 40, borderRadius: 14, background: 'var(--accent)10',
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   color: 'var(--accent)', cursor: 'pointer', border: '1.5px solid var(--accent)25',
                   boxShadow: '0 4px 12px rgba(108, 99, 255, 0.1)'
                 }}>
                    <ChevronRight size={20} strokeWidth={3} />
                 </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating Action Hint */}
      <div style={{ 
        marginTop: 40, padding: '24px', borderRadius: 28, background: 'rgba(var(--accent-rgb), 0.05)',
        border: '1.5px dashed rgba(var(--accent-rgb), 0.2)', textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
      }}>
         <Info size={20} color="var(--accent)" />
         <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
           Custom categories can be deleted anytime. System categories are core to SmartTrack.
         </p>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" style={{ maxWidth: 460, borderRadius: 36, padding: '40px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ 
                width: 64, height: 64, borderRadius: 22, background: 'rgba(var(--accent-rgb), 0.1)', 
                color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', border: '1px solid rgba(var(--accent-rgb), 0.2)'
              }}>
                <Plus size={32} strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Create New</h2>
              <p style={{ fontSize: 14, color: 'var(--text3)', marginTop: 4 }}>Add a custom group for your tracking</p>
            </div>
            
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ fontWeight: 800, fontSize: 13 }}>Label Identity</label>
              <input 
                className="form-input" 
                style={{ height: 56, borderRadius: 16, fontSize: 16, background: 'var(--bg2)' }}
                placeholder="e.g. Subscriptions, Travel" 
                value={newCat.name}
                onChange={e => setNewCat({ ...newCat, name: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>Brand Color</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
                {COLOR_LIST.map(color => (
                  <button 
                    key={color}
                    onClick={() => setNewCat({ ...newCat, color })}
                    style={{ 
                      height: 38, borderRadius: 12, background: color,
                      border: newCat.color === color ? '3px solid #fff' : 'none',
                      boxShadow: newCat.color === color ? `0 0 15px ${color}60` : 'none',
                      cursor: 'pointer', transition: 'all 0.2s',
                      transform: newCat.color === color ? 'scale(1.15)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>Visual Symbol</label>
              <div style={{ 
                display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', 
                gap: 12, maxHeight: 160, overflowY: 'auto',
                padding: '16px', background: 'var(--bg2)', borderRadius: 20,
                border: '1px solid var(--border)'
              }}>
                {ICON_LIST.map(iconName => {
                  const Icon = Icons[iconName] || Box
                  return (
                    <button 
                      key={iconName}
                      onClick={() => setNewCat({ ...newCat, icon: iconName })}
                      style={{ 
                        width: 44, height: 44, borderRadius: 14, 
                        background: newCat.icon === iconName ? 'var(--accent)' : 'transparent',
                        color: newCat.icon === iconName ? '#fff' : 'var(--text2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <Icon size={22} strokeWidth={2.2} />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: 40, gap: 16 }}>
              <button 
                className="btn btn-secondary" 
                style={{ borderRadius: 16, flex: 1, height: 54, fontWeight: 600 }} 
                onClick={() => setShowAdd(false)}
              >
                Discard
              </button>
              <button 
                className="btn btn-primary" 
                style={{ borderRadius: 16, flex: 2, height: 54, fontWeight: 800, fontSize: 16 }}
                disabled={!newCat.name || addMutation.isPending}
                onClick={() => addMutation.mutate(newCat)}
              >
                {addMutation.isPending ? 'Processing...' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
