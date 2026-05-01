import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ScanLine, Image, Search, RotateCcw, Save, CheckCircle, X, FileText, Camera } from 'lucide-react'
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
      <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(124,116,232,0.06)', border: '1px solid var(--border)', borderRadius: 10 }}>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>
          No budget set for <strong>{category}</strong>.
        </div>
      </div>
    )
  }
  const projectedSpent = budget.spent_amount + amount
  const projectedPct = Math.round((projectedSpent / budget.limit_amount) * 100)
  const isOver = projectedPct >= 100
  const isWarning = projectedPct >= 80
  const color = isOver ? 'var(--red)' : isWarning ? 'var(--yellow)' : 'var(--green)'
  const bg = isOver ? 'rgba(224,119,119,0.06)' : isWarning ? 'rgba(212,172,90,0.06)' : 'rgba(107,191,149,0.06)'
  return (
    <div style={{ marginTop: 14, padding: '14px 16px', background: bg, borderRadius: 12, border: `1px solid ${color}40` }}>
      <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 6 }}>
        Budget Impact — {category}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text2)' }}>
        Projected: <strong>₹{projectedSpent.toLocaleString('en-IN')}</strong> ({projectedPct}% of limit)
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
  const cameraRef = useRef()
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
      if (data.warning) toast(data.warning, { icon: <AlertTriangle size={18} color="var(--yellow)" /> })
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
      toast.success('Expense saved!')
    },
    onError: err => toast.error(err.response?.data?.detail || 'Save failed')
  })

  const handleFile = (f) => {
    if (!f) return
    setFile(f); setPrefill(null); setOcrText(''); setConfirmed(false)
    setPreview(URL.createObjectURL(f))
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('image/')) handleFile(f)
    else toast.error('Please upload an image file')
  }

  const reset = () => { setFile(null); setPreview(null); setPrefill(null); setOcrText(''); setConfirmed(false) }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Scan Receipt</h1>
          <p className="page-sub">AI-powered receipt data extraction</p>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(300px, 1.2fr)', gap: 24, maxWidth: 900 }} className="ocr-grid">
          {/* Upload side */}
          <div>
            <div className="card">
              <div className="card-title">Upload Receipt</div>

              {confirmed ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <CheckCircle size={48} color="var(--green)" strokeWidth={1.5} style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>Expense Saved!</h3>
                  <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 20 }}>Your expense has been logged successfully.</p>
                  <button className="btn btn-primary" onClick={reset}>
                    <ScanLine size={16} strokeWidth={2} style={{ marginRight: 8 }} /> Scan Another
                  </button>
                </div>
              ) : (
                <>
                  {!file ? (
                    <div style={{ 
                      position: 'relative', 
                      background: 'rgba(255, 255, 255, 0.01)',
                      border: '1px dashed var(--border)',
                      borderRadius: 24,
                      padding: '40px 24px',
                      marginBottom: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 280,
                      cursor: 'pointer'
                    }}
                    onClick={() => cameraRef.current.click()}
                    >
                      {/* Viewfinder Corners */}
                      <div className="pulse" style={{ position: 'absolute', top: 15, left: 15, width: 20, height: 20, borderLeft: '3px solid var(--accent)', borderTop: '3px solid var(--accent)', opacity: 0.8, borderRadius: '4px 0 0 0' }} />
                      <div className="pulse" style={{ position: 'absolute', top: 15, right: 15, width: 20, height: 20, borderRight: '3px solid var(--accent)', borderTop: '3px solid var(--accent)', opacity: 0.8, borderRadius: '0 4px 0 0' }} />
                      <div className="pulse" style={{ position: 'absolute', bottom: 15, left: 15, width: 20, height: 20, borderLeft: '3px solid var(--accent)', borderBottom: '3px solid var(--accent)', opacity: 0.8, borderRadius: '0 0 0 4px' }} />
                      <div className="pulse" style={{ position: 'absolute', bottom: 15, right: 15, width: 20, height: 20, borderRight: '3px solid var(--accent)', borderBottom: '3px solid var(--accent)', opacity: 0.8, borderRadius: '0 0 4px 0' }} />

                      <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div style={{ background: 'rgba(132, 101, 255, 0.1)', width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                          <ScanLine size={24} color="var(--accent)" />
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>Choose a method to extract data</div>
                        <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          Your data stays private 🔒
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 360 }}>
                        {/* Camera Tile */}
                        <button 
                          onClick={() => cameraRef.current.click()}
                          style={{
                            background: 'var(--bg3)',
                            border: '1px solid var(--border)',
                            borderRadius: 16,
                            padding: '16px 10px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 8,
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                          }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
                        >
                          <Camera size={20} color="var(--accent)" />
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Scan Receipt</div>
                        </button>

                        {/* Gallery Tile */}
                        <button 
                          onClick={() => fileRef.current.click()}
                          style={{
                            background: 'var(--bg3)',
                            border: '1px solid var(--border)',
                            borderRadius: 16,
                            padding: '16px 10px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 8,
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                          }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--text2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
                        >
                          <Image size={20} color="var(--text2)" />
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Upload Receipt</div>
                        </button>
                      </div>

                      <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.6 }}>
                        Takes ~2 seconds to extract details
                      </div>
                    </div>
                  ) : (
                    <div
                      id="ocr-drop-zone"
                      className={`drop-zone ${dragging ? 'active' : ''}`}
                      style={{ marginBottom: 16, height: 260, cursor: 'default' }}
                      onDragOver={e => { e.preventDefault(); setDragging(true) }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDrop}
                    >
                      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={preview} alt="Receipt preview" style={{ maxHeight: '100%', borderRadius: 12, objectFit: 'contain', maxWidth: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }} />
                      </div>
                    </div>
                  )}

                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => handleFile(e.target.files[0])} />
                  <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                    onChange={e => handleFile(e.target.files[0])} />

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {file && !scanMutation.isPending && !prefill && (
                      <button id="ocr-scan-btn" className="btn btn-primary" style={{ flex: 1, height: 48, borderRadius: 12, fontSize: 14, fontWeight: 600 }}
                        onClick={() => scanMutation.mutate(file)}>
                        <Search size={18} strokeWidth={2.5} style={{ marginRight: 8 }} /> Scan Selection
                      </button>
                    )}
                    {scanMutation.isPending && (
                      <button className="btn btn-primary" style={{ flex: 1, opacity: 0.8, height: 48, borderRadius: 12 }} disabled>
                        <span className="spinner" style={{ marginRight: 8 }} /> Analyzing Receipt...
                      </button>
                    )}
                    {file && (
                      <button className="btn btn-secondary" style={{ width: 48, height: 48, borderRadius: 12 }} onClick={reset}>
                        <RotateCcw size={16} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>

                  {!file && (
                    <div style={{ marginTop: 24, padding: '16px', background: 'var(--bg3)', borderRadius: 12 }}>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>How it works</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                          [ScanLine, 'Take a photo of your receipt'],
                          [Search,   'AI extracts amount & details'],
                          [Save,     'Review & save the expense'],
                        ].map(([Icon, text], i) => (
                          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <Icon size={17} strokeWidth={1.8} color="var(--text3)" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!file && (
                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                      <button 
                        onClick={() => navigate('/expenses')}
                        style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Or add manually
                      </button>
                    </div>
                  )}

                  {ocrText && (
                    <div style={{ marginTop: 16, padding: '12px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={13} strokeWidth={2} /> Extracted Text
                      </div>
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
                <div className="card-title">Review & Confirm</div>
                <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
                  AI extracted the data — verify before saving.
                </p>
                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input className="form-input" style={{ fontSize: 18, fontWeight: 700 }}
                    type="number" min="1" step="1"
                    value={prefill.amount || ''} placeholder="0"
                    onChange={e => setPrefill({ ...prefill, amount: Math.floor(parseFloat(e.target.value)) })} />
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
                <BudgetInsight amount={prefill.amount} category={prefill.category} budgets={budgets} />
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button className="btn btn-secondary" onClick={reset}>
                    <X size={15} strokeWidth={2} style={{ marginRight: 6 }} /> Discard
                  </button>
                  <button id="ocr-confirm-btn" className="btn btn-primary" style={{ flex: 1 }}
                    disabled={!prefill.amount || saveMutation.isPending}
                    onClick={() => saveMutation.mutate({ amount: prefill.amount, category: prefill.category, description: prefill.description, expense_date: prefill.expense_date })}>
                    {saveMutation.isPending ? <span className="spinner" /> : <><Save size={15} strokeWidth={2} style={{ marginRight: 8 }} /> Save Expense</>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'transparent', borderStyle: 'dashed' }}>
                <Search size={40} color="var(--text3)" strokeWidth={1.5} style={{ marginBottom: 16, opacity: 0.5 }} />
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
