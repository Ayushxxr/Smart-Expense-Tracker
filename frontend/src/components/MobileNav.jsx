import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Receipt, Target, User, Sparkles, MessageCircle, ScanLine } from 'lucide-react'

const AI_ITEMS = [
  { path: '/chat',     icon: MessageCircle, label: 'AI Chat'  },
  { path: '/insights', icon: Sparkles,      label: 'Insights' },
  { path: '/scanner',  icon: ScanLine,      label: 'Scanner'  },
]

const iconStyle = (active) => ({
  color: active ? 'var(--accent)' : 'var(--text3)',
  transition: 'color 0.2s',
})

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
      {/* AI sub-menu */}
      <div
        onClick={() => setShowAiMenu(false)}
        style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: 190, 
          background: 'rgba(0,0,0,0.4)', 
          opacity: showAiMenu ? 1 : 0,
          pointerEvents: showAiMenu ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />
      <div style={{
        position: 'fixed', 
        bottom: 84, 
        left: '50%',
        zIndex: 195,
        background: 'var(--glass)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        borderRadius: 24,
        padding: '10px',
        display: 'flex', 
        gap: 8,
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        
        /* Smooth, accelerated transition */
        opacity: showAiMenu ? 1 : 0,
        transform: `translateX(-50%) translateY(${showAiMenu ? '0' : '15px'}) scale(${showAiMenu ? 1 : 0.95})`,
        pointerEvents: showAiMenu ? 'auto' : 'none',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'transform, opacity',
      }}>
        {AI_ITEMS.map(item => {
          const active = pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => go(item.path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '14px 18px', border: 'none', borderRadius: 16,
                background: active ? 'rgba(132, 101, 255, 0.15)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text3)',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <item.icon size={22} strokeWidth={1.8} />
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Bottom nav bar */}
      <nav className="mobile-nav" style={{ 
        background: 'var(--glass)',
        backdropFilter: 'var(--glass-blur)', 
        borderTop: '1px solid var(--glass-border)',
        height: 'calc(64px + env(safe-area-inset-bottom))'
      }}>
        {[
          { path: '/dashboard', icon: LayoutDashboard, label: 'Home'     },
          { path: '/expenses',  icon: Receipt,          label: 'Expenses' },
        ].map(({ path, icon: Icon, label }) => {
          const active = pathname === path
          return (
            <button key={path} className={`mobile-nav-item ${active ? 'active' : ''}`}
              onClick={() => { setShowAiMenu(false); navigate(path) }}>
              <Icon size={20} strokeWidth={1.8} style={iconStyle(active)} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{label}</span>
            </button>
          )
        })}

        {/* Center AI button */}
        <button
          className={`mobile-nav-center ${isAiActive || showAiMenu ? 'active' : ''}`}
          onClick={() => setShowAiMenu(v => !v)}
          aria-label="AI Features"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            border: '4px solid var(--bg)',
            boxShadow: '0 4px 12px rgba(132, 101, 255, 0.3)',
            marginTop: -22
          }}
        >
          <Sparkles
            size={24}
            strokeWidth={1.8}
            style={{ 
              transform: showAiMenu ? 'rotate(25deg)' : 'none', 
              transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
              color: '#fff' 
            }}
          />
        </button>
        {[
          { path: '/budgets', icon: Target, label: 'Budgets' },
          { path: '/profile', icon: User,   label: 'Profile' },
        ].map(({ path, icon: Icon, label }) => {
          const active = pathname === path
          return (
            <button key={path} className={`mobile-nav-item ${active ? 'active' : ''}`}
              onClick={() => { setShowAiMenu(false); navigate(path) }}>
              <Icon size={20} strokeWidth={1.8} style={iconStyle(active)} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
