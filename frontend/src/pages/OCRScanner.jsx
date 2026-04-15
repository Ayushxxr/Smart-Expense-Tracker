import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import api from '../api/client'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'Food & Dining','Transport','Shopping','Entertainment',
  'Bills & Utilities','Healthcare','Education','Travel','Investments','Other'
]

function BudgetInsight({ amount, category, budgets }) {
  if (!category || !amount || isNaN(amount)) return null
  
  const budget = budgets.find(b => b.category === category)
  if (!budget) {
    return (
      <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(108,99,255,0.08)', border: '1px solid var(--border)', borderRadius: 10 }}>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>
          ℹ️ No budget set for <strong>{category}</strong>.
        </div>
      </div>
    )
  }

  const projectedSpent = budget.spent_amount + amount
  const projectedPct = Math.round((projectedSpent / budget.limit_amount) * 100)
  const isOver = projectedPct >= 100
  const isWarning = projectedPct >= 80

  const icon = isOver ? '🚨' : isWarning ? '⚠️' : '✅'
  const color = isOver ? 'var(--red)' : isWarning ? 'var(--yellow)' : 'var(--green)'
  const bg = isOver ? 'rgba(248,113,113,0.08)' : isWarning ? 'rgba(250,204,21,0.08)' : 'rgba(74,222,128,0.08)'

  return (
    <div style={{ marginTop: 14, padding: '14px 16px', background: bg, borderRadius: 12, border: `1px solid ${color}40` }}>
      <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 6 }}>
        {icon} Budget Impact for {category}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text2)' }}>
        Projected spend: <strong>₹{projectedSpent.toLocaleString('en-IN')}</strong> ({projectedPct}% of limit)
      </div>
    </div>
  )
}

export default function OCRScanner() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [prefill, setPrefill] = useState(null)
  const [ocrText, setOcrText] = useState('')
  const [dragging, setDragging] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const fileRef = useRef()
  const qc = useQueryClient()
  const todayMonth = format(new Date(), 'yyyy-MM')

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', todayMonth],
    queryFn: () => api.get(`/api/budgets?month_year=${todayMonth}`).then(r => r.data),
  })

  const scanMutation = useMutation({
    mutationFn: (f) => {
      const fd = new FormData()
      fd.append('file', f)
      return api.post('/api/ocr/scan', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: ({ data }) => {
      setPrefill(data.prefill)
      setOcrText(data.ocr_text || '')
      if (data.warning) toast(data.warning, { icon: '⚠️' })
      else toast.success('Receipt scanned! Review & confirm below.')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Scan failed')
  })

  const saveMutation = useMutation({
    mutationFn: (data) => api.post('/api/expenses', data),
    onSuccess: () => {
      qc.invalidateQueries(['expenses'])
      qc.invalidateQueries(['summary'])
      qc.invalidateQueries(['breakdown'])
      qc.invalidateQueries(['trend'])
      setConfirmed(true)
      toast.success('Expense saved! ✅')
    },
    onError: err => toast.error(err.response?.data?.detail || 'Save failed')
  })

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setPrefill(null)
    setOcrText('')
    setConfirmed(false)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('image/')) handleFile(f)
    else toast.error('Please upload an image file')
  }

  const reset = () => {
    setFile(null); setPreview(null); setPrefill(null)
    setOcrText(''); setConfirmed(false)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📷 Scan Receipt</h1>
          <p className="page-sub">AI-powered receipt data extraction</p>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(300px, 1.2fr)', gap: 24, maxWidth: 900 }} className="ocr-grid">
          {/* Upload side */}
          <div>
            <div className="card">
              <div className="card-title">📸 Upload Receipt</div>

              {confirmed ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>Expense Saved!</h3>
                  <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 20 }}>
                    Your expense has been logged successfully.
                  </p>
                  <button className="btn btn-primary" onClick={reset}>📷 Scan Another</button>
                </div>
              ) : (
                <>
                  <div
                    id="ocr-drop-zone"
                    className={`drop-zone ${dragging ? 'active' : ''}`}
                    style={{ marginBottom: 16, height: 220 }}
                    onClick={() => fileRef.current.click()}
                    onDragOver={e => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                  >
                    {preview ? (
                      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={preview} alt="Receipt preview" style={{
                          maxHeight: '100%', borderRadius: 8, objectFit: 'contain', maxWidth: '100%'
                        }} />
                      </div>
                    ) : (
                      <>
                        <div className="drop-zone-icon">📄</div>
                        <p>Drop your receipt image here</p>
                        <small>JPG, PNG · or click to browse</small>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => handleFile(e.target.files[0])} />
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    {file && !scanMutation.isPending && !prefill && (
                      <button id="ocr-scan-btn" className="btn btn-primary" style={{ flex: 1 }}
                        onClick={() => scanMutation.mutate(file)}>
                        🔍 Scan Receipt
                      </button>
                    )}
                    {scanMutation.isPending && (
                      <button className="btn btn-primary" style={{ flex: 1, opacity: 0.8 }} disabled>
                        <span className="spinner" style={{ marginRight: 8 }} />
                        Scanning...
                      </button>
                    )}
                    {file && (
                      <button className="btn btn-secondary" onClick={reset}>🔄</button>
                    )}
                  </div>

                  {/* How it works */}
                  {!file && (
                    <div style={{ marginTop: 24, padding: '16px', background: 'var(--bg3)', borderRadius: 12 }}>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>How it works</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                          ['📷', 'Take a photo of your receipt'],
                          ['🤖', 'AI extracts amount & details'],
                          ['✅', 'Review & save the expense'],
                        ].map(([icon, text], i) => (
                          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <span style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ocrText && (
                    <div style={{ marginTop: 16, padding: '12px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, fontWeight: 600 }}>📝 Extracted Text (preview)</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'monospace', lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                        {ocrText}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Prefill side */}
          <div>
            {prefill ? (
              <div className="card">
                <div className="card-title">✏️ Review & Confirm</div>
                <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
                  ✅ AI extracted the data. Please verify before saving.
                </p>

                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input className="form-input" style={{ fontSize: 18, fontWeight: 700 }} 
                    type="number" min="0.01" step="0.01"
                    value={prefill.amount || ''} placeholder="0.00"
                    onChange={e => setPrefill({ ...prefill, amount: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={prefill.category}
                    onChange={e => setPrefill({ ...prefill, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-input" type="text" value={prefill.description || ''}
                    placeholder="e.g. Starbucks Coffee"
                    onChange={e => setPrefill({ ...prefill, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={prefill.expense_date || ''}
                    onChange={e => setPrefill({ ...prefill, expense_date: e.target.value })} />
                </div>

                <BudgetInsight 
                  amount={prefill.amount} 
                  category={prefill.category} 
                  budgets={budgets} 
                />

                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button className="btn btn-secondary" onClick={reset}>❌ Discard</button>
                  <button id="ocr-confirm-btn" className="btn btn-primary" style={{ flex: 1 }}
                    disabled={!prefill.amount || saveMutation.isPending}
                    onClick={() => saveMutation.mutate({
                      amount: prefill.amount,
                      category: prefill.category,
                      description: prefill.description,
                      expense_date: prefill.expense_date,
                    })}>
                    {saveMutation.isPending ? <span className="spinner" /> : '💾 Save Expense'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'transparent', borderStyle: 'dashed' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>
                  Scan a receipt to see extracted data here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
