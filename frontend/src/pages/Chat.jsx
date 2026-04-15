import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'

const SUGGESTIONS = [
  "dropped 350 on Zomato tonight",
  "rapido cab 120 yesterday",
  "Big Bazaar groceries 800",
  "recharged Jio for 239",
  "How much did I spend this month?",
  "What's my top spending category?",
  "show food expenses this week",
]

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

function Message({ msg }) {
  const isUser = msg.role === 'user'
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
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
        }}>🤖</div>
      )}
      <div style={{
        maxWidth: '75%',
        background: isUser
          ? 'linear-gradient(135deg, var(--accent), var(--accent2))'
          : 'var(--surface2)',
        color: isUser ? '#fff' : 'var(--text)',
        padding: '12px 16px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        fontSize: 14,
        lineHeight: 1.6,
        border: isUser ? 'none' : '1px solid var(--border)',
        boxShadow: isUser ? 'var(--shadow)' : 'none',
      }}>
        {msg.content.split('**').map((part, i) =>
          i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
        )}
        {msg.expense_logged && (
          <div style={{
            marginTop: 10, padding: '10px 12px',
            background: 'rgba(67,233,123,0.1)', borderRadius: 8,
            border: '1px solid rgba(67,233,123,0.2)',
            fontSize: 12, color: '#4ade80',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            ✅ <span>Logged: {msg.expense_logged.amount} • {msg.expense_logged.category}</span>
          </div>
        )}
      </div>
      {isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
        }}>👤</div>
      )}
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey! 👋 I'm your AI expense assistant.\n\nTell me what you spent — like **\"coffee 150\"** or **\"uber 200 yesterday\"** — and I'll log it for you.\n\nYou can also ask me things like **\"how much did I spend this week?\"** 📊",
    }
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (message) => api.post('/api/chat', { message }).then(r => r.data),
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        expense_logged: data.expense_logged || null,
      }])
      
      if (data.expense_logged) {
        queryClient.invalidateQueries({ queryKey: ['summary'] })
        queryClient.invalidateQueries({ queryKey: ['expenses'] })
        queryClient.invalidateQueries({ queryKey: ['breakdown'] })
        queryClient.invalidateQueries({ queryKey: ['trend'] })
        queryClient.invalidateQueries({ queryKey: ['budgets'] })
        queryClient.invalidateQueries({ queryKey: ['recent-expenses'] })
      }
    },
    onError: () => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Oops! Something went wrong 😅 Please try again.",
      }])
    }
  })

  const send = (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setInput('')
    mutation.mutate(msg)
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
          <h1 className="page-title">🤖 AI Chat</h1>
          <p className="page-sub">Log expenses & ask questions naturally</p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(67,233,123,0.1)', border: '1px solid rgba(67,233,123,0.2)',
          borderRadius: 99, padding: '6px 14px', fontSize: 12, color: '#4ade80'
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
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
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 99, padding: '8px 14px', fontSize: 13,
                  color: 'var(--text2)', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {mutation.isPending && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 20 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
            }}>🤖</div>
            <div style={{
              background: 'var(--surface2)', padding: '12px 16px',
              borderRadius: '18px 18px 18px 4px', border: '1px solid var(--border)'
            }}>
              <TypingDots />
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
            disabled={mutation.isPending}
          />
          <button
            id="chat-send"
            className="btn btn-primary"
            style={{ borderRadius: 99, width: 44, padding: 0, flexShrink: 0 }}
            onClick={() => send()}
            disabled={mutation.isPending || !input.trim()}
          >
            🚀
          </button>
        </div>
      </div>
    </div>
  )
}
