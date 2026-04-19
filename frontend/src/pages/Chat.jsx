import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Bot, User as UserIcon, ShieldCheck } from 'lucide-react'
import api from '../api/client'

const SUGGESTIONS = [
  "spent 500 on repairing",
  "log 200 for biryani",
  "yesterday i spent 800 on clothes",
  "coffee 150 today",
  "How much did I spend this week?",
  "show my food expenses",
  "rapido cab 120 yesterday",
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
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}><Bot size={16} color="#fff" strokeWidth={2} /></div>
      )}
      <div style={{
        maxWidth: '75%',
        background: isUser
          ? 'var(--accent)'
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
            background: 'rgba(107,191,149,0.08)', borderRadius: 8,
            border: '1px solid rgba(107,191,149,0.2)',
            fontSize: 12, color: 'var(--green)',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <ShieldCheck size={14} /> <span>Logged: {msg.expense_logged.amount} • {msg.expense_logged.category}</span>
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
      content: "Hey! I'm your AI expense assistant.\n\nYou can log expenses naturally by writing things like **\"spent 500 on biryani\"** or **\"log 1200 for repairing yesterday\"**.\n\nI also understand quick notes like **\"coffee 150\"**. Just tell me what you spent!",
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
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}><Bot size={16} color="#fff" strokeWidth={2} /></div>
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
            disabled={mutation.isPending || !input.trim()}
          >
            <Send size={18} strokeWidth={2.5} style={{ marginLeft: -2, marginTop: 2 }} />
          </button>
        </div>
      </div>
    </div>
  )
}
