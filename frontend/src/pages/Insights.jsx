import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  AlertTriangle, CheckCircle2, Info, Sparkles, TrendingUp, 
  Target, AlertOctagon, ShieldCheck, Zap, ArrowRight,
  PieChart, Activity, Wallet
} from 'lucide-react'
import api from '../api/client'

const TIP_ICONS = { warning: AlertTriangle, success: CheckCircle2, info: Info }
const TIP_COLORS = { 
  warning: '#f97316', 
  success: '#10b981', 
  info: '#6366f1' 
}

function ProgressRing({ value, size = 160, stroke = 12, color = 'var(--accent)' }) {
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const offset = circ - (value / 100) * circ

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="var(--bg3)"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          style={{ 
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 8px ${color}60)` 
          }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.25, fontWeight: 900, color: 'var(--text)', fontFamily: 'var(--font-title)' }}>
          {Math.round(value)}%
        </span>
        <span style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 800 }}>Score</span>
      </div>
    </div>
  )
}

function MetricPod({ label, value, max, color }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
        <span>{label}</span>
        <span style={{ color: 'var(--text2)' }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ 
          height: '100%', width: `${pct}%`, background: color, 
          borderRadius: 10, transition: 'width 1s ease-out',
          boxShadow: `0 0 8px ${color}20`
        }} />
      </div>
    </div>
  )
}

function SectionHeader({ title, icon: Icon, color = 'var(--text2)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 12 }}>
      <div style={{ width: 4, height: 16, background: color, borderRadius: 2 }} />
      <h2 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1.5 }}>{title}</h2>
    </div>
  )
}

export default function Insights() {
  const { data: health, isLoading: loadingHealth } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/api/insights/health').then(r => r.data),
  })
  const { data: tipsData, isLoading: loadingTips } = useQuery({
    queryKey: ['tips'],
    queryFn: () => api.get('/api/insights/tips').then(r => r.data),
  })
  const { data: anomalyData } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => api.get('/api/insights/anomalies').then(r => r.data),
  })

  const tips = tipsData?.tips || []
  const anomalies = anomalyData?.anomalies || []
  const rule = health?.rule_50_30_20 || { needs: 0, wants: 0, savings: 0 }

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 className="page-title">Insights</h1>
          <p className="page-sub">Your monthly financial summary</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ 
            background: 'rgba(var(--accent-rgb), 0.1)', padding: '8px 16px', borderRadius: 12, 
            display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(var(--accent-rgb), 0.2)' 
          }}>
            <Zap size={16} color="var(--accent)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>AI is active</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        
        {/* SECTION 1: OVERVIEW */}
        <section>
          <SectionHeader title="Overview" color="var(--accent)" />
          <div className="card" style={{ 
            padding: 32, borderRadius: 28, 
            background: 'linear-gradient(180deg, var(--bg2) 0%, var(--surface) 100%)',
            border: '1px solid var(--border2)', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ 
              position: 'absolute', top: '-20%', left: '-20%', width: '100%', height: '100%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24 }}>Financial Health Score</div>
              {loadingHealth ? (
                <div style={{ textAlign: 'center', margin: '0 auto 24px' }}>
                  <div className="skeleton skeleton-circle" style={{ width: 160, height: 160, margin: '0 auto 24px' }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text3)', animation: 'pulse 2s infinite' }}>Analyzing your financial health...</div>
                </div>
              ) : (
                <ProgressRing 
                  value={health?.score || 0} 
                  color={health?.score >= 80 ? '#10b981' : health?.score >= 60 ? '#f59e0b' : '#ef4444'} 
                />
              )}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                  Your financial health is{' '}
                  <span style={{ color: (health?.score || 0) >= 80 ? '#10b981' : (health?.score || 0) >= 60 ? '#f59e0b' : '#ef4444' }}>
                    {(health?.score || 0) >= 80 ? 'excellent' : (health?.score || 0) >= 60 ? 'good' : (health?.score || 0) >= 40 ? 'average' : 'needs attention'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text3)', fontSize: 13, fontWeight: 600 }}>
                  <ShieldCheck size={14} color="var(--accent)" />
                  Grade {health?.grade || 'N/A'}
                </div>
                <div style={{ marginTop: 12, fontSize: 10, color: 'var(--text3)', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Analysis based on recent activity · Updated Today
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: ALERTS */}
        {anomalies.length > 0 && (
          <section>
            <SectionHeader title="Section 2: Alerts" color="#ef4444" />
            <div className="card" style={{ 
              padding: 24, borderRadius: 24, border: '1px solid rgba(239, 68, 68, 0.2)',
              background: 'rgba(239, 68, 68, 0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ background: 'rgba(239,68,68,0.1)', padding: 8, borderRadius: 10 }}>
                  <AlertOctagon size={20} color="#ef4444" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#ef4444' }}>Unusual spending detected in {anomalies[0].category}</h3>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.5 }}>
                You're spending **{Math.floor(anomalies[0].z_score)}x faster** than usual. Review this activity to maintain budget safety.
              </p>
              <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>{anomalies[0].category}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#ef4444' }}>₹{Math.floor(anomalies[0].amount)}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: SPENDING ANALYSIS */}
        <section>
          <SectionHeader title="Spending Analysis" color="#8b5cf6" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <div className="card" style={{ padding: 32, borderRadius: 28 }}>
               <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 24 }}>Your Metrics</div>
               <MetricPod label="Savings Rate" value={health?.breakdown?.savings || 0} max={40} color="#10b981" />
               <MetricPod label="Budget Adherence" value={health?.breakdown?.budget_adherence || 0} max={35} color="var(--accent)" />
               <MetricPod label="Spending Stability" value={health?.breakdown?.stability || 0} max={25} color="#8b5cf6" />
            </div>

            <div className="card" style={{ padding: 32, borderRadius: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>50/30/20 Distribution</div>
                <PieChart size={18} color="var(--text3)" style={{ opacity: 0.5 }} />
              </div>
              <div style={{ height: 12, background: 'var(--bg3)', borderRadius: 20, overflow: 'hidden', display: 'flex', marginBottom: 32 }}>
                <div style={{ width: `${rule.needs}%`, background: '#6366f1', transition: 'width 1.5s ease' }} />
                <div style={{ width: `${rule.wants}%`, background: '#f43f5e', transition: 'width 1.5s ease' }} />
                <div style={{ width: `${rule.savings}%`, background: '#10b981', transition: 'width 1.5s ease' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { label: 'Needs', val: rule.needs, color: '#6366f1' },
                  { label: 'Wants', val: rule.wants, color: '#f43f5e' },
                  { label: 'Savings', val: rule.savings, color: '#10b981' },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>{item.val}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: AI SUGGESTIONS */}
        <section>
          <SectionHeader title="Suggestions" color="#10b981" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card" style={{ padding: 32, borderRadius: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <Sparkles size={20} color="var(--accent)" />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Smart Suggestions</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {loadingTips ? [...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />
                )) : tips.map((tip, i) => (
                  <div key={i} style={{ 
                    padding: 20, borderRadius: 16, background: 'var(--bg3)',
                    border: '1px solid var(--border)', display: 'flex', gap: 12
                  }}>
                    <div style={{ 
                      width: 32, height: 32, borderRadius: 8, background: `${TIP_COLORS[tip.type]}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      {(() => {
                        const Icon = TIP_ICONS[tip.type];
                        return <Icon size={16} color={TIP_COLORS[tip.type]} />
                      })()}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>{tip.title}</h4>
                      <p style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>{tip.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ 
              padding: 32, borderRadius: 28, background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.05), rgba(99, 102, 241, 0.05))',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: 'rgba(16,185,129,0.1)', padding: 12, borderRadius: 14 }}>
                  <Wallet size={24} color="#10b981" />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>Estimated Savings This Month</h3>
                  <p style={{ fontSize: 13, color: 'var(--text3)' }}>Based on current trend</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Estimated</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                  ₹{Math.floor(Math.max(0, (health?.monthly_income || 0) * (rule.savings / 100)))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>Based on current trend</div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
