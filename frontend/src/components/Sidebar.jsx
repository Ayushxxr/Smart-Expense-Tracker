import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const NAV = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/expenses',  icon: '💸', label: 'Expenses'  },
  { path: '/budgets',   icon: '🎯', label: 'Budgets'   },
  null,
  { path: '/insights',  icon: '✨', label: 'AI Insights' },
  { path: '/chat',      icon: '🤖', label: 'AI Chat'   },
  { path: '/scanner',   icon: '📷', label: 'Scan Receipt' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    toast.success('Logged out 👋')
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">💰</div>
        <div>
          <div className="sidebar-logo-text">ExpenseAI</div>
          <div className="sidebar-logo-sub">Smart Tracker</div>
        </div>
      </div>

      <nav>
        {NAV.map((item, i) =>
          item === null ? (
            <div key={i} className="nav-divider">
              <span>AI Features</span>
            </div>
          ) : (
            <button
              key={item.path}
              id={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          )
        )}
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-user">
        <div
          className="sidebar-avatar"
          onClick={() => navigate('/profile')}
          title="View Profile"
        >
          <div className="avatar-circle">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="avatar-info">
            <div className="avatar-name">{user?.name}</div>
            <div className="avatar-email">{user?.email}</div>
          </div>
        </div>
        <button id="logout-btn" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </aside>
  )
}
