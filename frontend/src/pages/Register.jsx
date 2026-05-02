import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { Wallet } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', monthly_income: '' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSocialLogin = async (provider, token) => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/social', { provider, token })
      setAuth(data.user, data.access_token)
      toast.success(`Welcome, ${data.user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Social login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        monthly_income: form.monthly_income ? parseFloat(form.monthly_income) : null
      }
      const { data } = await api.post('/api/auth/register', payload)
      setAuth(data.user, data.access_token)
      toast.success(`Welcome, ${data.user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (err.code === 'ERR_NETWORK' || !err.response) {
        toast.error('Cannot connect to server. Is the backend running?', { duration: 5000 })
      } else if (typeof detail === 'string') {
        toast.error(detail)
      } else {
        toast.error('Registration failed. Please try again.')
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
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-sub">Start tracking smarter today</p>
        </div>

        <div className="social-auth">
          <GoogleLogin
            onSuccess={credentialResponse => handleSocialLogin('google', credentialResponse.credential)}
            onError={() => toast.error('Google Login Failed')}
            theme="filled_blue"
            shape="pill"
            width="346"
          />
        </div>

        <div className="auth-divider">or register with email</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              id="register-name"
              className="form-input"
              type="text"
              placeholder="Your Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="register-email"
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
            <input
              id="register-password"
              className="form-input"
              type="password"
              placeholder="Min 8 characters"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              minLength={8}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Monthly Income (₹) <span style={{ color: 'var(--text3)', fontSize: 12 }}>— optional, for AI insights</span>
            </label>
            <input
              id="register-income"
              className="form-input"
              type="number"
              placeholder="e.g. 50000"
              value={form.monthly_income}
              onChange={e => setForm({ ...form, monthly_income: e.target.value })}
              min="0"
            />
          </div>

          <button
            id="register-submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">Already have an account?</div>
        <p className="auth-footer">
          <span className="auth-link" onClick={() => navigate('/login')}>
            Sign in instead
          </span>
        </p>
      </div>
    </div>
  )
}
