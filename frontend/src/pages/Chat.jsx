import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Bot, User as UserIcon, ShieldCheck, Mic, MicOff } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../api/client'

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--text3)',
          animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes bounce {
          0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)}
        }
      `}</style>
    </div>
  )
}

function Message({ msg, onConfirm, onEditUpdate }) {
  const isUser = msg.role === 'user'
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(msg.preview_expense || {})

  const CATEGORIES = ["Food & Dining", "Transport", "Shopping", "Entertainment", "Bills & Utilities", "Healthcare", "Education", "Travel", "Investments", "Other"]

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 20,
      gap: 10,
      alignItems: 'flex-end',
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}><Bot size={16} color="#fff" strokeWidth={2} /></div>
      )}
      <div style={{
        maxWidth: '85%',
        background: isUser
          ? 'var(--accent)'
          : 'var(--surface2)',
        color: isUser ? '#fff' : 'var(--text)',
        padding: '12px 16px',
        borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
        fontSize: 14,
        lineHeight: 1.6,
        border: isUser ? 'none' : '1px solid var(--border)',
        boxShadow: isUser ? 'var(--shadow)' : 'none',
      }}>
        {msg.content.split('**').map((part, i) =>
          i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
        )}

        {/* Structured Preview Card */}
        {msg.preview_expense && !msg.confirmed && (
          <div style={{ 
            marginTop: 16, padding: '16px', borderRadius: 16, 
            background: 'var(--bg)', border: '1px solid var(--border2)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
          }}>
             <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                {isEditing ? 'Edit Transaction' : 'Verify Transaction'}
             </div>

             {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                   <div>
                      <label style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4, display: 'block' }}>Amount (₹)</label>
                      <input 
                        className="form-input"
                        type="number" 
                        value={editData.amount}
                        onChange={(e) => setEditData({ ...editData, amount: Math.floor(parseFloat(e.target.value) || 0) })}
                        style={{ height: 38, fontSize: 14, fontWeight: 700 }}
                      />
                   </div>
                   <div>
                      <label style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4, display: 'block' }}>Category</label>
                      <select 
                        className="form-input"
                        value={editData.category}
                        onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                        style={{ height: 38, fontSize: 13 }}
                      >
                         {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button 
                        onClick={() => {
                          onEditUpdate(msg, editData)
                          setIsEditing(false)
                        }}
                        className="btn btn-primary" 
                        style={{ flex: 1, height: 36, fontSize: 12, fontWeight: 800 }}
                      >
                        Save Changes
                      </button>
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="btn btn-secondary" 
                        style={{ flex: 1, height: 36, fontSize: 12 }}
                      >
                        Cancel
                      </button>
                   </div>
                </div>
             ) : (
                <>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 12, marginBottom: 16 }}>
                      <div>
                         <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Amount</div>
                         <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>₹{Math.floor(msg.preview_expense.amount)}</div>
                      </div>
                      <div>
                         <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Category</div>
                         <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
                            {msg.preview_expense.category}
                         </div>
                      </div>
                   </div>
                   <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        onClick={() => onConfirm(msg)}
                        className="btn btn-primary" 
                        style={{ flex: 2, height: 36, fontSize: 12, borderRadius: 10, fontWeight: 800 }}
                      >
                        Confirm Log
                      </button>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="btn btn-secondary" 
                        style={{ flex: 1, height: 36, fontSize: 12, borderRadius: 10, border: '1px solid var(--border)' }}
                      >
                        Edit
                      </button>
                   </div>
                </>
             )}
          </div>
        )}

        {msg.confirmed && (
          <div style={{
            marginTop: 12, padding: '10px 14px',
            background: 'rgba(34,197,94,0.1)', borderRadius: 12,
            border: '1px solid rgba(34,197,94,0.2)',
            fontSize: 12, color: 'var(--green)',
            display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700
          }}>
            <ShieldCheck size={16} /> <span>Logged successfully</span>
          </div>
        )}
      </div>
      {isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}><UserIcon size={16} color="var(--text3)" strokeWidth={1.8} /></div>
      )}
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I can log expenses for you.\n\nTry: **\"coffee 150\"** or **\"spent 500 on food\"**.",
    }
  ])
  const [input, setInput] = useState('')
  const [dynamicSuggestions, setDynamicSuggestions] = useState([
    "coffee 150 today",
    "spent 500 on food",
    "How much did I spend this week?",
    "show my food expenses"
  ])
  const bottomRef = useRef(null)
  const navigate = useNavigate()
  const [isListening, setIsListening] = useState(false)

  // Voice Input Implementation
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Voice input not supported in this browser 😢')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.lang = 'en-IN'
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      // Optional: auto-send
      // send(transcript)
    }

    recognition.start()
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fetch recent data for smart suggestions
  useEffect(() => {
    api.get('/api/expenses?per_page=5').then(res => {
      const recent = res.data.expenses
      if (recent && recent.length > 0) {
        const smart = recent.map((e, i) => {
          const amount = Math.floor(e.amount || 0)
          const cat = (e.category || 'Other').toLowerCase()
          if (i === 0) return `Spent ₹${amount} on ${cat} yesterday?`
          if (i === 1) return `Add ₹${amount} ${cat}?`
          return `${e.category || 'Other'} ${amount}`
        })
        setDynamicSuggestions([...new Set([...smart, "How much did I spend this week?", "show my food expenses"])].slice(0, 6))
      }
    }).catch(() => {})
  }, [])

  const queryClient = useQueryClient()
  const chatMutation = useMutation({
    mutationFn: (message) => api.post('/api/chat', { message }).then(r => r.data),
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        preview_expense: data.preview_expense || null,
        id: Date.now()
      }])
    },
    onError: () => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Oops! Something went wrong 😅 Please try again.",
      }])
    }
  })

  const confirmMutation = useMutation({
    mutationFn: (expense) => api.post('/api/expenses', {
      amount: expense.amount,
      category: expense.category,
      description: expense.description || 'Logged via Chat',
      expense_date: expense.date || new Date().toISOString().split('T')[0]
    }),
    onSuccess: (_, variables) => {
      setMessages(prev => prev.map(m => 
        m.preview_expense === variables ? { ...m, confirmed: true } : m
      ))
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['breakdown'] })
      queryClient.invalidateQueries({ queryKey: ['trend'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      toast.success('Expense confirmed! 🚀')
    }
  })

  const send = (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setInput('')
    chatMutation.mutate(msg)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)' }} className="chat-messages">
      <div className="page-header" style={{ flexShrink: 0, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="page-title">AI Chat</h1>
          <p className="page-sub">Log expenses & ask questions naturally</p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(107,191,149,0.1)', border: '1px solid rgba(107,191,149,0.2)',
          borderRadius: 99, padding: '6px 14px', fontSize: 12, color: 'var(--green)'
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite' }} />
          Online
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        {/* Suggestions */}
        {messages.length <= 1 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>💬 Try these:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {dynamicSuggestions.map(s => (
                <button key={s} onClick={() => send(s)} style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 99, padding: '8px 14px', fontSize: 13,
                  color: 'var(--text2)', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <Message 
            key={msg.id || i} 
            msg={msg} 
            onConfirm={(m) => confirmMutation.mutate(m.preview_expense)}
            onEditUpdate={(m, newData) => {
              setMessages(prev => prev.map(old => 
                old.id === m.id ? { ...old, preview_expense: newData } : old
              ))
            }}
          />
        ))}
        
        {chatMutation.isPending && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}><Bot size={16} color="#fff" strokeWidth={2} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TypingDots />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg2)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 10, maxWidth: 800, margin: '0 auto' }}>
          <input
            id="chat-input"
            className="form-input"
            style={{ flex: 1, borderRadius: 99 }}
            placeholder="Type an expense or ask a question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={chatMutation.isPending}
          />
          <button
            className="btn"
            style={{ 
              borderRadius: '50%', 
              width: 46, height: 46, 
              padding: 0, 
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isListening ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface2)',
              border: isListening ? '1px solid var(--red)' : '1px solid var(--border)',
              transition: 'all 0.3s'
            }}
            onClick={startListening}
            disabled={chatMutation.isPending}
          >
            {isListening ? (
              <Mic size={18} color="var(--red)" style={{ animation: 'pulse 1.5s infinite' }} />
            ) : (
              <Mic size={18} color="var(--text2)" />
            )}
          </button>
          <button
            id="chat-send"
            className="btn btn-primary"
            style={{ 
              borderRadius: '50%', 
              width: 46, height: 46, 
              padding: 0, 
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => send()}
            disabled={chatMutation.isPending || !input.trim()}
          >
            <Send size={18} strokeWidth={2.5} style={{ marginLeft: -2, marginTop: 2 }} />
          </button>
        </div>
      </div>
    </div>
  )
}
