import { useQuery } from '@tanstack/react-query'
import api from '../api/client'

function ScoreRing({ score }) {
  const radius = 54
  const circ = 2 * Math.PI * radius
  const dash = (score / 100) * circ
  const color = score >= 80 ? '#4ade80' : score >= 60 ? '#facc15' : score >= 40 ? '#fb923c' : '#f87171'

  return (
    <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 24px' }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={color} strokeWidth="14"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'stroke-dasharray 1.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ fontSize: 36, fontWeight: 800, color, letterSpacing: -1 }}>{score}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>Score</div>
      </div>
    </div>
  )
}

const TIP_ICONS = { warning: '⚠️', success: '✅', info: '💡' }
const TIP_COLORS = { warning: 'var(--yellow)', success: 'var(--green)', info: 'var(--accent)' }

export default function Insights() {
  const { data: health, isLoading: h1 } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/api/insights/health').then(r => r.data),
  })
  const { data: tipsData, isLoading: h2 } = useQuery({
    queryKey: ['tips'],
    queryFn: () => api.get('/api/insights/tips').then(r => r.data),
  })
  const { data: anomalyData, isLoading: h3 } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => api.get('/api/insights/anomalies').then(r => r.data),
  })

  const tips = tipsData?.tips || []
  const anomalies = anomalyData?.anomalies || []

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">✨ AI Insights</h1>
          <p className="page-sub">Smart analysis of your finances</p>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'clamp(260px, 33%, 320px) 1fr', gap: 24, marginBottom: 24, alignItems: 'start' }} className="insights-grid">

          {/* Health Score */}
          <div className="card" style={{ textAlign: 'center', padding: '28px 24px' }}>
            <div className="card-title">🏆 Financial Health</div>
            {h1 ? (
              <div style={{ padding: 40, color: 'var(--text3)' }}>
                <span className="spinner" style={{ margin: '0 auto 12px' }} />
                <div>Analyzing...</div>
              </div>
            ) : (
              <>
                <ScoreRing score={health?.score || 0} />
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>
                  {health?.label}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
                  Grade: <strong style={{ color: 'var(--accent)' }}>{health?.grade}</strong>
                </div>

                {/* Score breakdown */}
                <div style={{ textAlign: 'left', background: 'var(--bg3)', borderRadius: 12, padding: 16 }}>
                  {[
                    { label: 'Savings Rate', key: 'savings', max: 40 },
                    { label: 'Budget Adherence', key: 'budget_adherence', max: 35 },
                    { label: 'Spending Stability', key: 'stability', max: 25 },
                  ].map(({ label, key, max }) => {
                    const val = health?.breakdown?.[key] || 0
                    const pct = (val / max) * 100
                    return (
                      <div key={key} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>
                          <span>{label}</span>
                          <span>{val}/{max}</span>
                        </div>
                        <div className="budget-bar-bg" style={{ height: 6 }}>
                          <div
                            className="budget-bar-fill ok"
                            style={{ width: `${pct}%`, background: pct > 80 ? '#4ade80' : pct > 50 ? 'var(--accent)' : 'var(--yellow)' }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div style={{ marginTop: 16, padding: 14, background: 'var(--bg3)', borderRadius: 12, textAlign: 'left' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>This Month</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
                    ₹{(health?.total_spent_this_month || 0).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{health?.transaction_count || 0} transactions</div>
                </div>
              </>
            )}
          </div>

          {/* Tips */}
          <div>
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-title">💡 AI Spending Tips</div>
              {h2 ? (
                <div style={{ color: 'var(--text3)', padding: '40px 0', textAlign: 'center' }}>
                   <span className="spinner" style={{ margin: '0 auto 12px' }} />
                   <div>Scanning pattern...</div>
                </div>
              ) : tips.length === 0 ? (
                <div style={{ color: 'var(--text3)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Add more transactions to unlock insights!</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {tips.map((tip, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 14, padding: '14px 16px',
                      background: 'var(--bg3)', borderRadius: 12,
                      borderLeft: `3px solid ${TIP_COLORS[tip.type] || TIP_COLORS.info}`,
                      transition: 'transform 0.2s'
                    }}
                      onMouseOver={e => e.currentTarget.style.transform = 'translateX(4px)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'none'}
                    >
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{TIP_ICONS[tip.type] || '💡'}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>{tip.title}</div>
                        <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.5 }}>{tip.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 50/30/20 Guide */}
            <div className="card">
              <div className="card-title">📐 50/30/20 Budget Rule</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { pct: 50, label: 'Needs', desc: 'Rent, groceries, bills', color: '#6c63ff', emoji: '🏠' },
                  { pct: 30, label: 'Wants', desc: 'Dining, fun, shopping', color: '#ff6584', emoji: '🎉' },
                  { pct: 20, label: 'Savings', desc: 'Emergency, SIP, EMI', color: '#43e97b', emoji: '💰' },
                ].map(({ pct, label, desc, color, emoji }) => (
                  <div key={label} style={{
                    background: 'var(--bg3)', borderRadius: 12, padding: '16px', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{emoji}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color, marginBottom: 2 }}>{pct}%</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, lineHeight: 1.4 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Anomalies */}
        {!h3 && anomalies.length > 0 && (
          <div className="card" style={{ borderColor: 'rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.05)' }}>
            <div className="card-title" style={{ color: 'var(--red)' }}>🚨 Unusual Activity Detected</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {anomalies.map(a => (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'var(--bg3)', borderRadius: 12,
                  padding: '14px 16px'
                }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                      {a.description?.slice(0, 60) || a.category}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{a.message}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--red)', flexShrink: 0 }}>
                    ₹{a.amount.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
