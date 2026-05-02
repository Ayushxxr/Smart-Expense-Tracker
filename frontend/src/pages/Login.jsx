import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { Wallet, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const fillDemo = () => {
    setForm({ email: 'demo@expense.com', password: 'demo1234' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', {
        ...form,
        email: form.email.trim()
      })
      setAuth(data.user, data.access_token)
      toast.success(`Welcome back, ${data.user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (err.code === 'ERR_NETWORK' || !err.response) {
        toast.error('Cannot connect to server. Is the backend running?', { duration: 5000 })
      } else if (detail === 'Invalid credentials') {
        toast.error('Invalid email or password.')
      } else {
        toast.error(detail || 'Authentication failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Wallet size={24} color="#fff" /></div>
          <h1 className="auth-title">ExpenseAI</h1>
          <p className="auth-sub">Smart expense tracking with AI</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                className="form-input"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'var(--text3)', fontSize: 18, cursor: 'pointer'
                }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">or</div>
        <button
          onClick={fillDemo}
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Use Demo Account
        </button>

        <p className="auth-footer">
          No account?{' '}
          <span className="auth-link" onClick={() => navigate('/register')}>
            Create one
          </span>
        </p>
      </div>
    </div>
  )
}
