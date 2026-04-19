import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Receipt, Target,
  Sparkles, MessageCircle, ScanLine,
  LogOut, User, Wallet
} from 'lucide-react'

const NAV = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/expenses',  icon: Receipt,          label: 'Expenses'  },
  { path: '/budgets',   icon: Target,           label: 'Budgets'   },
  null,
  { path: '/insights',  icon: Sparkles,         label: 'AI Insights' },
  { path: '/chat',      icon: MessageCircle,    label: 'AI Chat'   },
  { path: '/scanner',   icon: ScanLine,         label: 'Scan Receipt' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Wallet size={18} color="#fff" strokeWidth={2} />
        </div>
        <div>
          <div className="sidebar-logo-text">ExpenseAI</div>
          <div className="sidebar-logo-sub">Smart Tracker</div>
        </div>
      </div>

      <nav>
        {NAV.map((item, i) =>
          item === null ? (
            <div key={i} className="nav-divider"><span>AI Features</span></div>
          ) : (
            <button
              key={item.path}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon
                size={17}
                strokeWidth={1.8}
                style={{ flexShrink: 0 }}
                color={location.pathname === item.path ? 'var(--accent)' : 'var(--text3)'}
              />
              {item.label}
            </button>
          )
        )}
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-user">
        <div className="sidebar-avatar" onClick={() => navigate('/profile')} title="View Profile">
          <div className="avatar-circle">
            {user?.name?.[0]?.toUpperCase() || <User size={16} />}
          </div>
          <div className="avatar-info">
            <div className="avatar-name">{user?.name}</div>
            <div className="avatar-email">{user?.email}</div>
          </div>
        </div>
        <button
          id="logout-btn"
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', justifyContent: 'center', gap: 8 }}
          onClick={handleLogout}
        >
          <LogOut size={14} strokeWidth={2} />
          Logout
        </button>
      </div>
    </aside>
  )
}
