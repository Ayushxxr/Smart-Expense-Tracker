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
          stroke="rgba(255,255,255,0.03)"
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
      <div style={{ height: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ 
          height: '100%', width: `${pct}%`, background: color, 
          borderRadius: 10, transition: 'width 1s ease-out',
          boxShadow: `0 0 10px ${color}40`
        }} />
      </div>
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
          <h1 className="page-title">Elite Insights</h1>
          <p className="page-sub">Next-gen financial intelligence & analytics</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ 
            background: 'rgba(132, 101, 255, 0.1)', padding: '8px 16px', borderRadius: 12, 
            display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(132, 101, 255, 0.2)' 
          }}>
            <Zap size={16} color="var(--accent)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>AI Active</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Health Cockpit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card stagger-item" style={{ 
            padding: 32, borderRadius: 28, 
            background: 'linear-gradient(180deg, rgba(30, 30, 46, 0.4) 0%, rgba(20, 20, 31, 0.4) 100%)',
            border: '1px solid var(--border2)', position: 'relative', overflow: 'hidden'
          }}>
            {/* Background Glow */}
            <div style={{ 
              position: 'absolute', top: '-20%', left: '-20%', width: '100%', height: '100%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24 }}>System Health</div>
              
              {loadingHealth ? (
                <div className="skeleton skeleton-circle" style={{ width: 160, height: 160, margin: '0 auto 24px' }} />
              ) : (
                <ProgressRing 
                  value={health?.score || 0} 
                  color={health?.score >= 80 ? '#10b981' : health?.score >= 60 ? '#f59e0b' : '#ef4444'} 
                />
              )}

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>{health?.label?.split(' ')[0]} Status</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text3)', fontSize: 13, fontWeight: 600 }}>
                  <ShieldCheck size={14} color="var(--accent)" />
                  Grade {health?.grade} Compliance
                </div>
              </div>

              <div style={{ marginTop: 32, textAlign: 'left' }}>
                <MetricPod label="Savings Rate" value={health?.breakdown?.savings || 0} max={40} color="#10b981" />
                <MetricPod label="Budget Adherence" value={health?.breakdown?.budget_adherence || 0} max={35} color="var(--accent)" />
                <MetricPod label="Spending Stability" value={health?.breakdown?.stability || 0} max={25} color="#8b5cf6" />
              </div>
            </div>
          </div>

          {/* Anomaly Card (If any) */}
          {anomalies.length > 0 && (
            <div className="card stagger-item" style={{ 
              padding: 24, borderRadius: 24, border: '1px solid rgba(239, 68, 68, 0.2)',
              background: 'rgba(239, 68, 68, 0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ background: 'rgba(239,68,68,0.1)', padding: 8, borderRadius: 10 }}>
                  <AlertOctagon size={20} color="#ef4444" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#ef4444' }}>Safety Breach</h3>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.5 }}>
                {anomalies.length} Unusual transactions detected. Spending velocity is {anomalies[0].z_score}x higher than average.
              </p>
              <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>{anomalies[0].category}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#ef4444' }}>₹{anomalies[0].amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Analytics & Tips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 2 }}>
          {/* 50/30/20 Rule Visualization */}
          <div className="card stagger-item" style={{ padding: 32, borderRadius: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>Modern Budget Distribution</h3>
                <p style={{ fontSize: 13, color: 'var(--text3)' }}>Real-time 50/30/20 Rule Adherence</p>
              </div>
              <PieChart size={24} color="var(--text3)" style={{ opacity: 0.5 }} />
            </div>

            <div style={{ height: 40, background: 'rgba(255,255,255,0.02)', borderRadius: 20, overflow: 'hidden', display: 'flex', marginBottom: 32 }}>
              <div style={{ width: `${rule.needs}%`, background: '#6366f1', transition: 'width 1.5s ease' }} />
              <div style={{ width: `${rule.wants}%`, background: '#f43f5e', transition: 'width 1.5s ease' }} />
              <div style={{ width: `${rule.savings}%`, background: '#10b981', transition: 'width 1.5s ease' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {[
                { label: 'Needs', val: rule.needs, target: 50, color: '#6366f1' },
                { label: 'Wants', val: rule.wants, target: 30, color: '#f43f5e' },
                { label: 'Savings', val: rule.savings, target: 20, color: '#10b981' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase' }}>{item.label}</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>{item.val}%</div>
                  <div style={{ fontSize: 11, color: item.val <= item.target ? '#10b981' : '#ef4444', fontWeight: 700, marginTop: 4 }}>
                    Target: {item.target}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Advisor Card */}
          <div className="card stagger-item" style={{ padding: 32, borderRadius: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <div style={{ background: 'rgba(99,102,241,0.1)', padding: 10, borderRadius: 12 }}>
                <Sparkles size={24} color="var(--accent)" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>AI Portfolio Advisor</h3>
                <p style={{ fontSize: 13, color: 'var(--text3)' }}>Tailored financial optimizations</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {loadingTips ? [...Array(4)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 100, borderRadius: 20 }} />
              )) : tips.map((tip, i) => (
                <div key={i} style={{ 
                  padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border)', position: 'relative'
                }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ 
                      width: 44, height: 44, borderRadius: 12, background: `${TIP_COLORS[tip.type]}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      {(() => {
                        const Icon = TIP_ICONS[tip.type];
                        return <Icon size={20} color={TIP_COLORS[tip.type]} />
                      })()}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{tip.title}</h4>
                      <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{tip.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Savings Projection Card */}
          <div className="card stagger-item" style={{ 
            padding: 32, borderRadius: 28, background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.05), rgba(99, 102, 241, 0.05))'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', padding: 12, borderRadius: 14 }}>
                <Wallet size={24} color="#10b981" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>Projected Potential</h3>
                <p style={{ fontSize: 13, color: 'var(--text3)' }}>End-of-month savings estimate</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                ₹{(Math.max(0, (health?.monthly_income || 0) * (rule.savings / 100))).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span style={{ fontSize: 13, color: '#10b981', fontWeight: 800, background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                + Est. Flow
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 12 }}>
              Based on your current transaction velocity, you are projected to save approx. **{rule.savings}%** of your monthly income (₹{(health?.monthly_income || 0).toLocaleString()}).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
