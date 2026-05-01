import { useState, useEffect } from 'react'
import { 
  Bell, Brain, Shield, Database, FolderInput, Palette, Info, 
  ChevronRight, ToggleLeft, ToggleRight, Download, Trash2, 
  EyeOff, Lock, Globe, Moon, Sun, Smartphone, Sparkles, Mail, X
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── PIN Lock Modal ──────────────────────────────────────────────
function PinSetupModal({ onClose, onSuccess }) {
  const [pin, setPin] = useState('')
  
  const handleSave = () => {
    if (pin.length !== 4) {
      toast.error('PIN must be 4 digits')
      return
    }
    localStorage.setItem('app_pin', pin)
    onSuccess()
    toast.success('App Lock Enabled! 🔐')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal" style={{ maxWidth: 320, borderRadius: 32, padding: 32, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(var(--accent-rgb), 0.15)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', marginBottom: 20, margin: '0 auto' }}>
          <Lock size={24} strokeWidth={2.5} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Set App PIN</h2>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 24 }}>Enter a 4-digit code to lock your app</p>
        
        <input 
          type="password"
          maxLength={4}
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g,''))}
          placeholder="••••"
          style={{ 
            width: '100%', height: 60, borderRadius: 16, border: '2px solid var(--border)', 
            background: 'var(--bg2)', color: 'var(--text)', fontSize: 32, textAlign: 'center',
            letterSpacing: 8, marginBottom: 24, fontWeight: 900
          }}
        />
        
        <button 
          className="btn btn-primary" 
          onClick={handleSave}
          style={{ width: '100%', height: 50, borderRadius: 16, fontWeight: 800 }}
        >
          Enable Lock
        </button>
      </div>
    </div>
  )
}

export default function Settings() {
  const isLight = document.body.classList.contains('light-theme')
  const isHidden = document.body.classList.contains('hide-balance')
  const hasPin = !!localStorage.getItem('app_pin')

  const [settings, setSettings] = useState({
    budgetAlerts: true,
    overspendingAlerts: true,
    unusualActivity: false,
    autoCategorization: true,
    aiInsights: true,
    hideBalance: isHidden,
    appLock: hasPin,
    darkMode: !isLight,
    currency: 'INR (₹)',
  })

  const [showPinSetup, setShowPinSetup] = useState(false)

  const handleExportCSV = async () => {
    try {
      toast.loading('Preparing CSV export...', { id: 'csv' })
      const token = localStorage.getItem('access_token')
      
      // Use the backend export endpoint
      const response = await fetch('/api/expenses/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `elite_fintech_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast.success('Export complete! 📊', { id: 'csv' })
    } catch (err) {
      toast.error('Export failed', { id: 'csv' })
    }
  }

  // 1. Theme Effect
  useEffect(() => {
    if (settings.darkMode) {
      document.body.classList.remove('light-theme')
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.classList.add('light-theme')
      localStorage.setItem('theme', 'light')
    }
  }, [settings.darkMode])

  // 2. Hide Balance Effect
  useEffect(() => {
    if (settings.hideBalance) {
      document.body.classList.add('hide-balance')
      localStorage.setItem('hide_balance', 'true')
    } else {
      document.body.classList.remove('hide-balance')
      localStorage.setItem('hide_balance', 'false')
    }
  }, [settings.hideBalance])

  const toggle = (key) => {
    if (key === 'appLock') {
      if (settings.appLock) {
        // Disabling
        localStorage.removeItem('app_pin')
        setSettings(s => ({ ...s, appLock: false }))
        toast.success('App Lock Disabled')
      } else {
        // Enabling
        setShowPinSetup(true)
      }
      return
    }
    setSettings(s => ({ ...s, [key]: !s[key] }))
  }

  const SettingSection = ({ title, icon: Icon, children }) => (
    <div className="card stagger-item" style={{ marginBottom: 24, padding: 0, overflow: 'hidden', borderRadius: 24 }}>
      <div style={{ 
        padding: '20px 24px', background: 'rgba(var(--accent-rgb), 0.05)', 
        borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 
      }}>
        <div style={{ 
          width: 36, height: 36, borderRadius: 10, background: 'rgba(var(--accent-rgb), 0.2)', 
          color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <Icon size={18} />
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text)' }}>{title}</h3>
      </div>
      <div style={{ padding: '8px 0' }}>
        {children}
      </div>
    </div>
  )

  const SettingItem = ({ icon: Icon, label, description, rightElement, onClick, danger }) => (
    <div 
      className="dropdown-item" 
      onClick={onClick}
      style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '16px 24px', cursor: onClick ? 'pointer' : 'default'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {Icon && <Icon size={18} color={danger ? 'var(--red)' : 'var(--text3)'} />}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: danger ? 'var(--red)' : 'var(--text)' }}>{label}</div>
          {description && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{description}</div>}
        </div>
      </div>
      {rightElement}
    </div>
  )

  const Toggle = ({ active, onToggle }) => (
    <button 
      onClick={onToggle}
      style={{ 
        background: 'none', border: 'none', cursor: 'pointer', 
        color: active ? 'var(--accent)' : 'var(--text3)',
        transition: 'all 0.2s'
      }}
    >
      {active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
    </button>
  )

  return (
    <div className="page-container" style={{ paddingBottom: 100 }}>
      <div className="page-header" style={{ marginBottom: 40 }}>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Control panel and preferences</p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        <SettingSection title="Notifications" icon={Bell}>
          <SettingItem 
            label="Budget Alerts" 
            description="Notify when reaching 80% of budget"
            rightElement={<Toggle active={settings.budgetAlerts} onToggle={() => toggle('budgetAlerts')} />}
          />
          <SettingItem 
            label="Overspending Alerts" 
            description="Instant alert when limit is exceeded"
            rightElement={<Toggle active={settings.overspendingAlerts} onToggle={() => toggle('overspendingAlerts')} />}
          />
          <SettingItem 
            label="Unusual Activity" 
            description="Alert on large or duplicate transactions"
            rightElement={<Toggle active={settings.unusualActivity} onToggle={() => toggle('unusualActivity')} />}
          />
        </SettingSection>

        <SettingSection title="Privacy & Security" icon={Shield}>
          <SettingItem 
            label="Hide Balance" 
            description="Blur amounts on the dashboard"
            rightElement={<Toggle active={settings.hideBalance} onToggle={() => toggle('hideBalance')} />}
          />
          <SettingItem 
            label="App Lock" 
            description="Require PIN to open the application"
            rightElement={<Toggle active={settings.appLock} onToggle={() => toggle('appLock')} />}
          />
        </SettingSection>

        <SettingSection title="Data Management" icon={Database}>
          <SettingItem 
            label="Export Data (CSV)" 
            description="Download all transactions to spreadsheet"
            rightElement={<Download size={18} color="var(--accent)" />}
            onClick={handleExportCSV}
          />
          <SettingItem 
            label="Clear History" 
            description="Remove all transaction data but keep categories"
            danger
            onClick={() => confirm('Clear all history? This cannot be undone.') && toast.error('History cleared')}
          />
        </SettingSection>

        <SettingSection title="App Preferences" icon={Palette}>
          <SettingItem 
            label="Theme Mode" 
            description="Switch between Light and Dark mode"
            rightElement={<Toggle active={settings.darkMode} onToggle={() => toggle('darkMode')} />}
          />
          <SettingItem 
            label="Currency" 
            description="Primary currency for tracking"
            rightElement={<div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{settings.currency}</div>}
            onClick={() => toast('Currency settings coming soon')}
          />
        </SettingSection>

        <SettingSection title="About" icon={Info}>
          <SettingItem 
            label="App Version" 
            description="Stable release v2.4.0"
            rightElement={<div style={{ fontSize: 11, color: 'var(--text3)' }}>Up to date</div>}
          />
          <SettingItem 
            label="Developer Info" 
            description="SmartTrack Team • contact@smarttrack.ai"
            rightElement={<Mail size={16} color="var(--text3)" />}
          />
        </SettingSection>

      </div>

      {showPinSetup && (
        <PinSetupModal 
          onClose={() => setShowPinSetup(false)}
          onSuccess={() => setSettings(s => ({ ...s, appLock: true }))}
        />
      )}
    </div>
  )
}
