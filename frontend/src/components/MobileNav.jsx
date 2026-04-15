import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const AI_ITEMS = [
  { path: '/chat',     icon: '🤖', label: 'AI Chat' },
  { path: '/insights', icon: '✨', label: 'Insights' },
  { path: '/scanner',  icon: '📷', label: 'Scanner' },
]

export default function MobileNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [showAiMenu, setShowAiMenu] = useState(false)

  const isAiActive = AI_ITEMS.some(a => a.path === pathname)

  const go = (path) => {
    setShowAiMenu(false)
    navigate(path)
  }

  return (
    <>
      {/* AI sub-menu — slides up */}
      {showAiMenu && (
        <>
          <div
            onClick={() => setShowAiMenu(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 190,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
            }}
          />
          <div style={{
            position: 'fixed', bottom: 80, left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 195,
            background: 'var(--bg2)',
            border: '1px solid var(--border2)',
            borderRadius: 20,
            padding: '8px',
            display: 'flex', gap: 6,
            boxShadow: 'var(--shadow-lg)',
            animation: 'slideUp 0.2s ease',
          }}>
            {AI_ITEMS.map(item => (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '12px 16px', border: 'none', borderRadius: 14,
                  background: pathname === item.path ? 'rgba(108,99,255,0.15)' : 'transparent',
                  color: pathname === item.path ? 'var(--accent)' : 'var(--text2)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Bottom nav bar */}
      <nav className="mobile-nav">
        <button
          className={`mobile-nav-item ${pathname === '/dashboard' ? 'active' : ''}`}
          onClick={() => { setShowAiMenu(false); navigate('/dashboard') }}
        >
          <span>📊</span>
          <span>Home</span>
        </button>

        <button
          className={`mobile-nav-item ${pathname === '/expenses' ? 'active' : ''}`}
          onClick={() => { setShowAiMenu(false); navigate('/expenses') }}
        >
          <span>💸</span>
          <span>Expenses</span>
        </button>

        {/* Center — AI menu toggle */}
        <button
          className={`mobile-nav-center ${isAiActive || showAiMenu ? 'active' : ''}`}
          onClick={() => setShowAiMenu(v => !v)}
          aria-label="AI Features"
        >
          <span style={{ fontSize: 22, lineHeight: 1, transform: showAiMenu ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>✨</span>
        </button>

        <button
          className={`mobile-nav-item ${pathname === '/budgets' ? 'active' : ''}`}
          onClick={() => { setShowAiMenu(false); navigate('/budgets') }}
        >
          <span>🎯</span>
          <span>Budgets</span>
        </button>

        <button
          className={`mobile-nav-item ${pathname === '/profile' ? 'active' : ''}`}
          onClick={() => { setShowAiMenu(false); navigate('/profile') }}
        >
          <span>👤</span>
          <span>Profile</span>
        </button>
      </nav>
    </>
  )
}
