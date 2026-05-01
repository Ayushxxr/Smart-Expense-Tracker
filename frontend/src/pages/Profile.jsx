import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  User, Mail, Wallet, ShieldCheck, Heart, 
  TrendingUp, Activity, Edit3, Save, CheckCircle2,
  AlertCircle, Trophy, Target, ArrowRight
} from 'lucide-react'
import api from '../api/client'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, setAuth } = useAuthStore()
  const qc = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    monthly_income: user?.monthly_income || ''
  })

  const { data: summary } = useQuery({
    queryKey: ['summary', 'all'],
    queryFn: () => api.get('/api/dashboard/summary?month=all').then(res => res.data)
  })

  const updateMutation = useMutation({
    mutationFn: (data) => api.put('/api/auth/me', data),
    onSuccess: (res) => {
      setAuth(res.data, localStorage.getItem('access_token'))
      setIsEditing(false)
      toast.success('Profile updated! ✨')
      qc.invalidateQueries(['summary'])
    },
    onError: () => toast.error('Failed to update profile')
  })

  // Calculate Financial Health Score
  const getHealth = () => {
    if (!summary) return { score: 0, grade: 'Loading...', color: 'var(--text3)' }
    const spent = summary.total_spent || 0
    const income = summary.monthly_income || 1
    const ratio = spent / income
    
    let score = 100 - (ratio * 100)
    if (score < 0) score = 0
    if (score > 100) score = 100
    score = Math.round(score)

    if (score >= 80) return { score, grade: 'Excellent', color: 'var(--green)', desc: 'You are a financial master!' }
    if (score >= 60) return { score, grade: 'Good', color: '#3b82f6', desc: 'Solid tracking habits.' }
    if (score >= 40) return { score, grade: 'Fair', color: '#f59e0b', desc: 'Room for optimization.' }
    return { score, grade: 'Poor', color: 'var(--red)', desc: 'Budget needs attention.' }
  }

  const health = getHealth()

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  }

  const Section = ({ title, icon: Icon, children }) => (
    <div className="card stagger-item" style={{ marginBottom: 24, borderRadius: 28, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ 
          width: 32, height: 32, borderRadius: 10, background: 'var(--accent)10', 
          color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <Icon size={18} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  )

  return (
    <div className="page-container" style={{ paddingBottom: 100 }}>
      {/* 1. User Identity Header */}
      <div className="stagger-item" style={{ 
        textAlign: 'center', marginBottom: 40, marginTop: 20 
      }}>
        <div style={{ 
          width: 100, height: 100, borderRadius: '50%', margin: '0 auto 20px',
          background: 'linear-gradient(135deg, var(--bg2), var(--bg3))',
          border: '4px solid var(--accent)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', color: 'var(--accent)', fontSize: 36, fontWeight: 900,
          boxShadow: '0 10px 30px rgba(108, 99, 255, 0.3)'
        }}>
          {getInitials(user?.name)}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 4px' }}>{user?.name}</h1>
        <p style={{ color: 'var(--text3)', fontSize: 14, margin: 0 }}>{user?.email}</p>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        {/* 2. Financial Health (USP) */}
        <Section title="Financial Health" icon={Activity}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 24, 
            background: 'var(--bg2)', padding: 24, borderRadius: 20,
            border: '1px solid var(--border)'
          }}>
            <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <svg style={{ transform: 'rotate(-90deg)', width: 80, height: 80 }}>
                  <circle cx="40" cy="40" r="36" fill="none" stroke="var(--bg3)" strokeWidth="8" />
                  <circle cx="40" cy="40" r="36" fill="none" stroke={health.color} strokeWidth="8" 
                    strokeDasharray={2 * Math.PI * 36}
                    strokeDashoffset={2 * Math.PI * 36 * (1 - health.score / 100)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
               </svg>
               <div style={{ position: 'absolute', fontSize: 18, fontWeight: 900, color: health.color }}>
                 {health.score}
               </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: health.color }}>{health.grade}</span>
                <CheckCircle2 size={16} color={health.color} />
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text3)' }}>{health.desc}</p>
            </div>
            <Trophy size={32} color="var(--accent)" style={{ opacity: 0.3 }} />
          </div>
        </Section>

        {/* 3. This Month Summary */}
        <Section title="This Month Summary" icon={TrendingUp}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--bg2)', padding: 20, borderRadius: 20, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8 }}>Total Spent</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>₹{summary?.total_spent?.toLocaleString() || 0}</div>
            </div>
            <div style={{ background: 'var(--bg2)', padding: 20, borderRadius: 20, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8 }}>Transactions</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent)' }}>{summary?.transaction_count || 0}</div>
            </div>
          </div>
        </Section>

        {/* 4. Edit Profile */}
        <Section title="Edit Profile" icon={Edit3}>
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form) }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 32 }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={12} color="var(--accent)" /> Full Name
                  </label>
                  <input 
                    className="form-input" 
                    style={{ borderRadius: 12, height: 48 }}
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={12} color="var(--accent)" /> Email Address
                  </label>
                  <input 
                    className="form-input" 
                    style={{ borderRadius: 12, height: 48 }}
                    type="email"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Wallet size={12} color="var(--accent)" /> Monthly Income (₹)
                </label>
                <input 
                  className="form-input" 
                  style={{ borderRadius: 12, height: 48 }}
                  type="number"
                  value={form.monthly_income}
                  onChange={e => setForm({...form, monthly_income: e.target.value})}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-hover-scale" 
              style={{ 
                width: '100%', borderRadius: 14, height: 54, fontWeight: 800,
                fontSize: 15, letterSpacing: '0.3px',
                boxShadow: '0 8px 20px rgba(108, 99, 255, 0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
              }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : <><Save size={20} /> Save Changes</>}
            </button>
          </form>
        </Section>

      </div>
    </div>
  )
}
