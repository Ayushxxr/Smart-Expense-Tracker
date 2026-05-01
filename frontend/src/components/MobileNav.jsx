import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Receipt, Target, User, Sparkles, MessageCircle, ScanLine, Layout } from 'lucide-react'

const AI_ITEMS = [
  { path: '/chat',       icon: MessageCircle, label: 'AI Chat'  },
  { path: '/insights',   icon: Sparkles,      label: 'Insights' },
  { path: '/scanner',    icon: ScanLine,      label: 'Scanner'  },
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

  return (
    <>
      {/* AI Menu Overlay Backdrop */}
      {showAiMenu && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 998 }}
          onClick={() => setShowAiMenu(false)}
        />
      )}

      {/* AI Features Menu Content - Horizontal Layout */}
      {showAiMenu && (
        <div style={{
          position: 'fixed', bottom: 100, left: 0, right: 0,
          display: 'flex', flexDirection: 'row', justifyContent: 'center', 
          gap: 10, zIndex: 999, padding: '0 16px'
        }}>
          {AI_ITEMS.map((item, idx) => (
            <button 
              key={item.path}
              onClick={() => { navigate(item.path); setShowAiMenu(false) }}
              className="stagger-item"
              style={{
                animationDelay: `${idx * 0.05}s`,
                flex: 1, maxWidth: 100, minHeight: 90,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 8px', borderRadius: 24,
                background: 'var(--surface)', border: '1px solid var(--border)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                color: pathname === item.path ? 'var(--accent)' : 'var(--text)',
                fontSize: 12, fontWeight: 700, transition: 'all 0.2s'
              }}
            >
              <div style={{ 
                width: 42, height: 42, borderRadius: 14, 
                background: pathname === item.path ? 'var(--accent)15' : 'var(--bg3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: pathname === item.path ? 'var(--accent)' : 'var(--text2)'
              }}>
                <item.icon size={22} />
              </div>
              <span style={{ textAlign: 'center' }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      <nav className="mobile-nav" style={{ 
        background: 'var(--glass)',
        backdropFilter: 'var(--glass-blur)', 
        borderTop: '1px solid var(--glass-border)',
        height: 'calc(64px + env(safe-area-inset-bottom))',
        zIndex: 1000
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
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            border: '4px solid var(--bg)',
            boxShadow: '0 4px 12px rgba(132, 101, 255, 0.3)',
            marginTop: -22, width: 56, height: 56, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: showAiMenu ? 'rotate(25deg)' : 'none'
          }}
        >
          <Sparkles size={24} strokeWidth={1.8} />
        </button>

        {[
          { path: '/budgets', icon: Target, label: 'Budgets' },
          { path: '/categories', icon: Layout, label: 'Categories' },
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
