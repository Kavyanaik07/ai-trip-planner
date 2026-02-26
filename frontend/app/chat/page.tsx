'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', lineHeight: 1, userSelect: 'none' }}>
      <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 300, fontStyle: 'italic', fontSize: `${size}px`, color: '#1a1612', letterSpacing: '0.01em' }}>this</span>
      <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 300, fontStyle: 'italic', fontSize: `${size * 0.55}px`, color: '#2a9d8f', margin: `0 ${size * 0.06}px`, alignSelf: 'center' }}>·</span>
      <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 700, fontStyle: 'normal', fontSize: `${size}px`, color: '#1a1612', letterSpacing: '-0.02em' }}>Way</span>
    </span>
  )
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED = [
  { icon: '🗺️', label: 'Plan a weekend in Goa', prompt: 'Give me a perfect 2-day itinerary for Goa — beaches, food, and nightlife.' },
  { icon: '🎒', label: 'What to pack for Ladakh', prompt: 'What should I pack for a 10-day trip to Ladakh in July?' },
  { icon: '💰', label: 'Budget tips for Thailand', prompt: 'How can I travel Thailand on a tight budget? Give me practical money-saving tips.' },
  { icon: '✈️', label: 'Best time to visit Japan', prompt: 'When is the best time of year to visit Japan and why?' },
  { icon: '🍜', label: 'Must-eat foods in Vietnam', prompt: 'What are the must-try street foods in Vietnam and where to find them?' },
  { icon: '🪪', label: 'Visa for Schengen zone', prompt: 'How do I apply for a Schengen visa from India? What documents do I need?' },
]

function formatMessage(text: string) {
  // Convert **bold** to <strong>, and newlines to <br>
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part.split('\n').map((line, j) => (
      <span key={`${i}-${j}`}>{line}{j < part.split('\n').length - 1 && <br />}</span>
    ))
  })
}

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: 'user', content: trimmed }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't connect. Please try again." }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  const firstName = session?.user?.name?.split(' ')[0] || 'there'
  const isEmpty = messages.length === 0

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        :root {
          --canvas: #faf8f4;
          --ink: #1a1612;
          --teal: #2a9d8f;
          --muted: rgba(26,22,18,0.42);
          --border: rgba(26,22,18,0.08);
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .hf { font-family: 'Cormorant Garamond', Georgia, serif; }
        .bf { font-family: 'DM Sans', sans-serif; }

        /* ── NAV ── */
        .nav-link {
          color: var(--muted); font-family: 'DM Sans', sans-serif; font-size: 13px;
          text-decoration: none; transition: color 0.2s; font-weight: 400;
        }
        .nav-link:hover { color: var(--ink); }

        /* ── SUGGESTED CHIPS ── */
        .chip {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 16px; border-radius: 100px;
          border: 1px solid var(--border); background: white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          font-family: 'DM Sans', sans-serif; font-size: 13px;
          color: var(--ink); font-weight: 400; cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
          white-space: nowrap;
        }
        .chip:hover {
          border-color: rgba(42,157,143,0.3);
          box-shadow: 0 4px 16px rgba(0,0,0,0.07);
          transform: translateY(-1px);
        }

        /* ── MESSAGES ── */
        .msg-user {
          display: flex; justify-content: flex-end; margin-bottom: 16px;
        }
        .msg-ai {
          display: flex; justify-content: flex-start; gap: 10px; margin-bottom: 20px;
          align-items: flex-start;
        }
        .bubble-user {
          max-width: 72%; padding: 13px 18px; border-radius: 20px 20px 4px 20px;
          background: var(--ink); color: white;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 300;
          line-height: 1.7;
        }
        .bubble-ai {
          max-width: 80%; padding: 14px 18px; border-radius: 4px 20px 20px 20px;
          background: white; border: 1px solid var(--border);
          box-shadow: 0 1px 6px rgba(0,0,0,0.04);
          font-family: 'DM Sans', sans-serif; font-size: 14px;
          color: rgba(26,22,18,0.8); line-height: 1.8; font-weight: 300;
        }
        .ai-avatar {
          width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #2a9d8f, #1a6a63);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; margin-top: 2px;
        }

        /* ── TYPING DOTS ── */
        .typing { display: flex; gap: 4px; align-items: center; padding: 4px 0; }
        .typing span {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(26,22,18,0.2); display: block;
          animation: bounce 1.2s ease infinite;
        }
        .typing span:nth-child(2) { animation-delay: 0.15s; }
        .typing span:nth-child(3) { animation-delay: 0.30s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }

        /* ── INPUT AREA ── */
        .input-wrap {
          background: white; border: 1px solid rgba(0,0,0,0.08); border-radius: 18px;
          padding: 12px 16px; display: flex; align-items: flex-end; gap: 10px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-wrap:focus-within {
          border-color: rgba(42,157,143,0.35);
          box-shadow: 0 0 0 3px rgba(42,157,143,0.08), 0 2px 12px rgba(0,0,0,0.06);
        }
        .input-field {
          flex: 1; border: none; outline: none; background: transparent; resize: none;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 300;
          color: var(--ink); line-height: 1.6; max-height: 160px;
          overflow-y: auto; min-height: 24px;
        }
        .input-field::placeholder { color: rgba(26,22,18,0.28); }
        .send-btn {
          width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
          background: var(--ink); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.2s;
          color: white; font-size: 15px;
        }
        .send-btn:hover:not(:disabled) { transform: scale(1.1); background: #2a9d8f; }
        .send-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

        /* ── ENTRANCE ── */
        .fade-up { opacity: 0; transform: translateY(20px); animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: var(--canvas); }
        ::-webkit-scrollbar-thumb { background: rgba(26,22,18,0.1); border-radius: 2px; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(250,248,244,0.92)', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <Link href="/dashboard" className="nav-link">← Trips</Link>
        <Link href="/" style={{ textDecoration: 'none' }}><Wordmark size={22} /></Link>
        <Link href="/plan" className="nav-link">New trip →</Link>
      </nav>

      {/* ── MESSAGES AREA ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 16px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px' }}>

          {/* ── EMPTY STATE ── */}
          {isEmpty && (
            <div className="fade-up" style={{ paddingTop: '64px', paddingBottom: '48px' }}>
              {/* Greeting */}
              <div style={{ marginBottom: '40px' }}>
                <p className="bf" style={{ color: 'rgba(26,22,18,0.3)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Travel assistant
                </p>
                <h1 className="hf" style={{
                  fontSize: 'clamp(36px,5vw,56px)', fontWeight: 700, color: '#1a1612',
                  lineHeight: 1.08, letterSpacing: '-0.015em', fontStyle: 'italic', marginBottom: '12px',
                }}>
                  Hey {firstName}, where's<br />
                  <em style={{ color: '#2a9d8f', fontWeight: 300 }}>the next adventure?</em>
                </h1>
                <p className="bf" style={{ color: 'rgba(26,22,18,0.42)', fontSize: '15px', fontWeight: 300, lineHeight: 1.7 }}>
                  Ask me anything — destinations, packing, visas, food, budget. I'm your travel brain.
                </p>
              </div>

              {/* Suggested prompts */}
              <div>
                <p className="bf" style={{ color: 'rgba(26,22,18,0.28)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '14px' }}>
                  Try asking
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {SUGGESTED.map((s) => (
                    <button key={s.label} className="chip" onClick={() => send(s.prompt)}>
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── MESSAGES ── */}
          {messages.map((msg, i) => (
            msg.role === 'user' ? (
              <div key={i} className="msg-user">
                <div className="bubble-user">{msg.content}</div>
              </div>
            ) : (
              <div key={i} className="msg-ai">
                <div className="ai-avatar">✦</div>
                <div className="bubble-ai">{formatMessage(msg.content)}</div>
              </div>
            )
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="msg-ai">
              <div className="ai-avatar">✦</div>
              <div className="bubble-ai">
                <div className="typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── INPUT BAR ── */}
      <div style={{
        borderTop: '1px solid var(--border)',
        background: 'rgba(250,248,244,0.95)', backdropFilter: 'blur(24px)',
        padding: '16px 24px 20px',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div className="input-wrap">
            <textarea
              ref={inputRef}
              className="input-field"
              placeholder="Ask anything about travel…"
              value={input}
              onChange={handleInput}
              onKeyDown={handleKey}
              rows={1}
              disabled={loading}
            />
            <button
              className="send-btn"
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              aria-label="Send"
            >
              ↑
            </button>
          </div>
          <p className="bf" style={{ color: 'rgba(26,22,18,0.22)', fontSize: '11px', textAlign: 'center', marginTop: '10px', letterSpacing: '0.03em' }}>
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
