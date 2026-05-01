import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { User, LogOut, Settings as SettingsIcon, UserCircle } from 'lucide-react'
import useAuthStore from './store/authStore'
import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Budgets from './pages/Budgets'
import Chat from './pages/Chat'
import Insights from './pages/Insights'
import OCRScanner from './pages/OCRScanner'
import Profile from './pages/Profile'
import Categories from './pages/Categories'
import Settings from './pages/Settings'
import CategoryDetails from './pages/CategoryDetails'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } }
})

// Component to load global preferences on startup
function InitialSetup() {
  const { pathname } = useLocation()
  
  useEffect(() => {
    // 1. Theme
    const theme = localStorage.getItem('theme')
    if (theme === 'light') {
      document.body.classList.add('light-theme')
    }
    
    // 2. Hide Balance
    const hideBalance = localStorage.getItem('hide_balance')
    if (hideBalance === 'true') {
      document.body.classList.add('hide-balance')
    }
    
    // 3. Scroll to top
    window.scrollTo(0, 0)
    const mainContent = document.querySelector('.main-content')
    if (mainContent) mainContent.scrollTop = 0
  }, [pathname])
  
  return null
}

function ProtectedLayout({ children }) {
  const { token, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  
  if (!token) return <Navigate to="/login" replace />

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  }
  
  return (
    <div className="app-shell">
      {/* Mobile Top Header (GPay Style) */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>SmartTrack</span>
        </div>
        
        <div style={{ position: 'relative' }}>
          <button 
            className="mobile-profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              width: 40, height: 40, borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--bg2), var(--bg3))',
              border: '2px solid var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)', cursor: 'pointer',
              boxShadow: '0 0 15px rgba(108, 99, 255, 0.2)',
              fontWeight: 800, fontSize: 14
            }}
          >
            {getInitials(user?.name)}
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <>
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 1001 }}
                onClick={() => setShowProfileMenu(false)}
              />
              <div style={{
                position: 'absolute', top: 50, right: 0,
                width: 200, background: 'var(--surface)',
                borderRadius: 16, border: '1px solid var(--border)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                zIndex: 1002, overflow: 'hidden',
                animation: 'staggerReveal 0.2s ease'
              }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{user?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{user?.email}</div>
                </div>
                <div style={{ padding: 8 }}>
                  <button 
                    className="dropdown-item"
                    onClick={() => { navigate('/profile'); setShowProfileMenu(false) }}
                    style={{ 
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12, 
                      padding: '10px 12px', border: 'none', background: 'transparent',
                      color: 'var(--text)', fontSize: 13, fontWeight: 600, borderRadius: 10, cursor: 'pointer'
                    }}
                  >
                    <UserCircle size={16} /> My Profile
                  </button>
                  <button 
                    className="dropdown-item"
                    onClick={() => { navigate('/settings'); setShowProfileMenu(false) }}
                    style={{ 
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12, 
                      padding: '10px 12px', border: 'none', background: 'transparent',
                      color: 'var(--text)', fontSize: 13, fontWeight: 600, borderRadius: 10, cursor: 'pointer'
                    }}
                  >
                    <SettingsIcon size={16} /> Settings
                  </button>
                  <button 
                    className="dropdown-item"
                    onClick={() => { logout(); navigate('/login') }}
                    style={{ 
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12, 
                      padding: '10px 12px', border: 'none', background: 'transparent',
                      color: 'var(--red)', fontSize: 13, fontWeight: 600, borderRadius: 10, cursor: 'pointer'
                    }}
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Sidebar />
      <main className="main-content">{children}</main>
      <MobileNav />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <InitialSetup />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a1a30', color: '#f0f0ff', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 10 },
            duration: 3000,
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/expenses" element={<ProtectedLayout><Expenses /></ProtectedLayout>} />
          <Route path="/budgets" element={<ProtectedLayout><Budgets /></ProtectedLayout>} />
          <Route path="/chat" element={<ProtectedLayout><Chat /></ProtectedLayout>} />
          <Route path="/insights" element={<ProtectedLayout><Insights /></ProtectedLayout>} />
          <Route path="/scanner" element={<ProtectedLayout><OCRScanner /></ProtectedLayout>} />
          <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
          <Route path="/categories" element={<ProtectedLayout><Categories /></ProtectedLayout>} />
          <Route path="/category-details" element={<ProtectedLayout><CategoryDetails /></ProtectedLayout>} />
          <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
