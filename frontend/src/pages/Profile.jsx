import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import useAuthStore from '../store/authStore'
import api from '../api/client'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

export default function Profile() {
  const { user, setAuth, logout } = useAuthStore()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    monthly_income: user?.monthly_income || '',
  })

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/api/insights/health').then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: (data) => api.put('/api/auth/me', data),
    onSuccess: ({ data }) => {
      setAuth(data.user, data.access_token || localStorage.getItem('access_token'))
      toast.success('Profile updated ✅')
    },
    onError: err => toast.error(err.response?.data?.detail || 'Update failed')
  })

  const handleLogout = () => {
    logout()
    toast.success('Logged out 👋')
    navigate('/login')
  }

  const handleExport = async () => {
    try {
      toast('Preparing export...', { icon: '⏳' })
      const response = await api.get('/api/expenses/export', { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Export downloaded! ✅')
    } catch {
      toast.error('Export failed')
    }
  }

  const score = health?.score || 0
  const grade = health?.grade || '—'
  const scoreColor = score >= 80 ? '#4ade80' : score >= 60 ? '#facc15' : score >= 40 ? '#f97316' : '#f87171'

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">👤 Profile</h1>
          <p className="page-sub">Manage your account</p>
        </div>
      </div>

      <div className="page-body">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'clamp(260px, 33%, 340px) 1fr',
          gap: 24, alignItems: 'start'
        }} className="profile-grid">

          {/* Left: Avatar + Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px',
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, fontWeight: 800, color: '#fff',
                boxShadow: '0 0 30px rgba(108,99,255,0.5)'
              }}>
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--text)' }}>{user?.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>{user?.email}</div>

              {/* Score ring (simple bar) */}
              <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>Financial Health</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor }}>{score}/100</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg2)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${score}%`, background: scoreColor, borderRadius: 99, transition: 'width 1s ease' }} />
                </div>
                <div style={{ marginTop: 8, fontSize: 13, color: scoreColor, fontWeight: 600, textAlign: 'center' }}>
                  Grade: {grade}
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="card" style={{ padding: '20px 24px' }}>
              <div className="card-title">📊 This Month</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text3)', fontSize: 13 }}>Total Spent</span>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                    ₹{(health?.total_spent_this_month || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text3)', fontSize: 13 }}>Transactions</span>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>{health?.transaction_count || 0}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleExport}>
                📥 Export CSV
              </button>
              <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          </div>

          {/* Right: Edit form */}
          <div className="card" style={{ padding: 32 }}>
            <div className="card-title">✏️ Edit Profile</div>
            <form onSubmit={e => { e.preventDefault(); updateMutation.mutate(form) }}>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input className="form-input" type="text" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email}
                  disabled style={{ opacity: 0.6 }} />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Monthly Income (₹)
                  <span style={{ marginLeft: 8, color: 'var(--text3)', fontSize: 12 }}>— used for AI health calculation</span>
                </label>
                <input className="form-input" type="number" min="0" placeholder="e.g. 50000"
                  value={form.monthly_income}
                  onChange={e => setForm({ ...form, monthly_income: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary"
                disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <span className="spinner" /> : '💾 Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
