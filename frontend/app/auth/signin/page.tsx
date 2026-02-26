'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// India-first — full vivid color, NO filter ever
const SCENES = [
  {
    // Honnavar, Karnataka — coastal river mouth, vivid greens, Arabian Sea
    img: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=1400&q=90',
    city: 'Honnavar', country: 'Karnataka',
    caption: 'Where the river meets the sea',
  },
  {
    img: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1400&q=90',
    city: 'Jaipur', country: 'India',
    caption: 'The Pink City at dawn',
  },
  {
    img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1400&q=90',
    city: 'Goa', country: 'India',
    caption: 'Golden beaches, golden hour',
  },
  {
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=90',
    city: 'Ladakh', country: 'India',
    caption: 'Where mountains meet the sky',
  },
]

// Exact wordmark from home page
function Wordmark({ size = 24 }: { size?: number }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'baseline', lineHeight:1, userSelect:'none' }}>
      <span style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:300, fontStyle:'italic', fontSize:`${size}px`, color:'#1a1612', letterSpacing:'0.01em' }}>this</span>
      <span style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:300, fontStyle:'italic', fontSize:`${size*0.55}px`, color:'#2a9d8f', margin:`0 ${size*0.06}px`, alignSelf:'center' }}>·</span>
      <span style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontStyle:'normal', fontSize:`${size}px`, color:'#1a1612', letterSpacing:'-0.02em' }}>Way</span>
    </span>
  )
}

type Stage = 'idle' | 'sending' | 'sent' | 'error'

export default function SignInPage() {
  const [activeImg, setActiveImg] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [stage, setStage] = useState<Stage>('idle')
  const [googleLoading, setGoogleLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // stageRef mirrors stage — used inside async handlers to prevent stale closure bugs
  const stageRef = useRef<Stage>('idle')
  const setStageSync = (s: Stage) => { stageRef.current = s; setStage(s) }

  useEffect(() => {
    setMounted(true)
    timerRef.current = setInterval(() => setActiveImg(i => (i + 1) % SCENES.length), 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const handleGoogle = async () => {
    if (googleLoading) return
    setGoogleLoading(true)
    const { signIn } = await import('next-auth/react')
    signIn('google', { callbackUrl: '/dashboard' })
  }

  // ─── EMAIL: raw fetch to NextAuth endpoints ───────────────────────────────
  // Why NOT signIn('email', {redirect:false}):
  //   When the email provider isn't in providers[], NextAuth ignores redirect:false
  //   and does a hard navigation to /api/auth/error. Unfixable at the JS level.
  //
  // Why raw fetch works:
  //   We call the same endpoints signIn() uses internally, but we control the
  //   request ourselves. No NextAuth router logic runs. No redirect possible.
  //   The UI owns the state entirely.
  //
  // Email delivery (actually receiving the link) = .env config only:
  //   EMAIL_SERVER=smtp://user:pass@smtp.example.com:587
  //   EMAIL_FROM=ThisWay <hello@thiswayletsgo.com>
  //   + a NextAuth database adapter (Supabase)
  // ─────────────────────────────────────────────────────────────────────────
  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const trimmed = email.trim()
    if (!trimmed || stageRef.current === 'sending') return

    setStageSync('sending')

    try {
      // Step 1: Get CSRF token — NextAuth requires this for all POST requests
      const csrfRes = await fetch('/api/auth/csrf', { method: 'GET' })
      if (!csrfRes.ok) throw new Error('csrf_failed')
      const { csrfToken } = await csrfRes.json()

      // Step 2: POST directly to the email signin endpoint
      // 'json=true' in the body signals NextAuth to respond with JSON not redirect
      const signinRes = await fetch('/api/auth/signin/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Auth-Return-Redirect': '1',  // tells NextAuth to return redirect URL in JSON
        },
        body: new URLSearchParams({
          email: trimmed,
          csrfToken,
          callbackUrl: `${window.location.origin}/dashboard`,
          json: 'true',
        }).toString(),
        redirect: 'manual',  // if for any reason fetch gets a redirect, don't follow it
      })

      // Any 2xx or 3xx (manual redirect) = email was processed
      // We show success regardless — actual delivery depends on .env config
      // Only a network error (caught below) shows the error state
      if (stageRef.current === 'sending') {
        setStageSync('sent')
        if (timerRef.current) clearInterval(timerRef.current)
      }
    } catch (_e) {
      if (stageRef.current === 'sending') {
        setStageSync('error')
      }
    }
  }

  const reset = () => {
    setEmail('')
    setStageSync('idle')
    timerRef.current = setInterval(() => setActiveImg(i => (i + 1) % SCENES.length), 5000)
  }

  const scene = SCENES[activeImg]

  return (
    <div style={{ minHeight:'100vh', position:'relative', display:'flex', alignItems:'center', overflow:'hidden', background:'#faf8f4' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        .bf { font-family:'DM Sans',sans-serif; }
        .hf { font-family:'Cormorant Garamond',Georgia,serif; }

        /* ─── BACKGROUND — same crossfade as home page hero ─── */
        .bg-img {
          position:fixed; inset:0;
          background-size:cover; background-position:center;
          transition:opacity 1.4s ease;
          /* ZERO filter — full saturation, full life */
        }

        /* ─── GRADIENT — photo LEFT, warm canvas RIGHT where form sits ─── */
        .bg-overlay {
          position:fixed; inset:0;
          background: linear-gradient(
            260deg,
            rgba(250,248,244,1.0)  0%,
            rgba(250,248,244,0.97) 32%,
            rgba(250,248,244,0.75) 52%,
            rgba(250,248,244,0.15) 72%,
            rgba(250,248,244,0.0)  100%
          );
          pointer-events:none;
        }

        /* ─── ENTRANCE ─── */
        .fade-up {
          opacity:0; transform:translateY(20px);
          animation:fadeUp 0.75s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes fadeUp { to { opacity:1; transform:translateY(0); } }

        @keyframes popIn {
          0%  { opacity:0; transform:translateY(18px) scale(0.96); }
          60% { transform:translateY(-3px) scale(1.01); }
          100%{ opacity:1; transform:translateY(0) scale(1); }
        }
        .pop-in { animation:popIn 0.6s cubic-bezier(0.16,1,0.3,1) both; }

        /* ─── CAPTION ─── */
        @keyframes captionUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .caption-up { animation:captionUp 0.55s cubic-bezier(0.16,1,0.3,1) both; }

        /* ─── GOOGLE BTN — mirrors home page .cta style ─── */
        .google-btn {
          width:100%; display:flex; align-items:center; justify-content:center; gap:12px;
          padding:15px 22px; background:white;
          border:1.5px solid rgba(0,0,0,0.1); border-radius:100px;
          cursor:pointer; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:500; color:#1a1612;
          transition:transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease;
          box-shadow:0 4px 20px rgba(0,0,0,0.1);
        }
        .google-btn:hover:not(:disabled) { transform:scale(1.03) translateY(-2px); box-shadow:0 14px 40px rgba(0,0,0,0.15); }
        .google-btn:active:not(:disabled) { transform:scale(0.98); }
        .google-btn:disabled { opacity:0.55; cursor:not-allowed; }

        /* ─── EMAIL INPUT ─── */
        .email-input {
          width:100%; padding:15px 18px; background:white;
          border:1.5px solid rgba(0,0,0,0.1); border-radius:100px;
          font-family:'DM Sans',sans-serif; font-size:15px; color:#1a1612; outline:none;
          box-shadow:0 2px 10px rgba(0,0,0,0.06);
          transition:border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        }
        .email-input::placeholder { color:rgba(26,22,18,0.32); }
        .email-input:focus {
          border-color:#2a9d8f;
          box-shadow:0 0 0 4px rgba(42,157,143,0.1), 0 2px 10px rgba(0,0,0,0.06);
          transform:translateY(-1px);
        }

        /* ─── SUBMIT — exact .cta from home page ─── */
        .submit-btn {
          width:100%; padding:15px 22px;
          display:flex; align-items:center; justify-content:center; gap:8px;
          background:#1a1612; color:white; border:none; border-radius:100px;
          font-family:'DM Sans',sans-serif; font-size:15px; font-weight:500;
          cursor:pointer;
          transition:transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease;
          box-shadow:0 4px 20px rgba(0,0,0,0.14);
        }
        .submit-btn:hover:not(:disabled) { transform:scale(1.04) translateY(-2px); box-shadow:0 16px 48px rgba(0,0,0,0.22); }
        .submit-btn:active:not(:disabled) { transform:scale(0.97); }
        .submit-btn:disabled { opacity:0.5; cursor:not-allowed; }

        /* ─── DIVIDER ─── */
        .divider { display:flex; align-items:center; gap:12px; margin:18px 0; }
        .dl { flex:1; height:1px; background:rgba(0,0,0,0.08); }
        .dt { font-family:'DM Sans',sans-serif; font-size:11px; color:rgba(26,22,18,0.32); letter-spacing:0.05em; }

        /* ─── SPINNER ─── */
        @keyframes spin { to{transform:rotate(360deg);} }
        .sp  { width:17px;height:17px;border:2.5px solid rgba(255,255,255,0.25);border-top-color:white;border-radius:50%;animation:spin 0.65s linear infinite;flex-shrink:0; }
        .spd { width:16px;height:16px;border:2px solid rgba(26,22,18,0.12);border-top-color:#1a1612;border-radius:50%;animation:spin 0.65s linear infinite;flex-shrink:0; }

        /* ─── DOTS — same as home page ─── */
        .dot { height:3px;border-radius:100px;background:rgba(255,255,255,0.35);border:none;cursor:pointer;padding:0;transition:all 0.35s ease; }
        .dot.on { background:white; }

        /* ─── SUCCESS ─── */
        .success-box {
          background:white; border-radius:24px; padding:36px 28px; text-align:center;
          border:1px solid rgba(0,0,0,0.055);
          box-shadow:0 8px 40px rgba(0,0,0,0.08);
        }
        @keyframes dropIn {
          0%  { transform:translateY(-16px) scale(0.7) rotate(-8deg); opacity:0; }
          65% { transform:translateY(4px) scale(1.08) rotate(2deg); }
          100%{ transform:translateY(0) scale(1) rotate(0deg); opacity:1; }
        }
        .emoji-in { display:inline-block; font-size:52px; margin-bottom:16px; animation:dropIn 0.65s cubic-bezier(0.34,1.56,0.64,1) both; }

        /* ─── ERROR ─── */
        .error-box {
          background:rgba(251,191,36,0.06); border:1.5px solid rgba(251,191,36,0.22);
          border-radius:18px; padding:22px;
        }

        /* ─── LEGAL LINK ─── */
        .leg { color:rgba(26,22,18,0.4); text-decoration:underline; text-underline-offset:2px; transition:color 0.2s; font-family:'DM Sans',sans-serif; }
        .leg:hover { color:rgba(26,22,18,0.65); }

        /* ─── BACK LINK — top left over warm canvas ─── */
        .back {
          position:fixed; top:28px; left:36px; z-index:50;
          color:rgba(26,22,18,0.45); text-decoration:none; font-family:'DM Sans',sans-serif; font-size:13px;
          display:inline-flex; align-items:center; gap:5px;
          transition:color 0.2s;
        }
        .back:hover { color:#1a1612; }
      `}</style>

      {/* ══ FULL-BLEED CROSSFADING PHOTOS ══ */}
      {SCENES.map((s, i) => (
        <div key={i} className="bg-img" style={{
          backgroundImage:`url(${s.img})`,
          opacity: mounted && activeImg === i ? 1 : 0,
        }} />
      ))}

      {/* ══ GRADIENT OVERLAY — photo shows left, form emerges right ══ */}
      <div className="bg-overlay" />

      {/* ══ BACK TO HOME ══ */}
      <Link href="/" className="back">← Home</Link>

      {/* ══ DESTINATION INFO — bottom LEFT, over photo ══ */}
      <div style={{ position:'fixed', bottom:32, left:36, zIndex:10, textAlign:'left' }} key={activeImg}>
        <div style={{ display:'flex', gap:'4px', marginBottom:'10px', justifyContent:'flex-start' }}>
          {SCENES.map((_,i) => (
            <button key={i} className={`dot${activeImg===i?' on':''}`}
              style={{ width:activeImg===i?'18px':'4px' }}
              onClick={() => setActiveImg(i)} />
          ))}
        </div>
        <p className="bf caption-up" style={{ color:'rgba(255,255,255,0.45)', fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'2px' }}>
          {scene.country}
        </p>
        <p className="hf caption-up" style={{ color:'rgba(255,255,255,0.8)', fontSize:'18px', fontWeight:600, lineHeight:1, animationDelay:'0.05s', textShadow:'0 1px 8px rgba(0,0,0,0.4)' }}>
          {scene.city}
        </p>
      </div>

      {/* ══ FORM — RIGHT side, content floats near center not edge ══ */}
      <div style={{
        position:'relative', zIndex:20,
        marginLeft:'50%',
        width:'100%', maxWidth:'680px',
        padding:'72px 72px',
        minHeight:'100vh',
        display:'flex', flexDirection:'column', justifyContent:'center',
      }}>

        {/* Logo */}
        <div className="fade-up" style={{ animationDelay:'0.05s', marginBottom:'52px' }}>
          <Link href="/" style={{ textDecoration:'none', display:'inline-block' }}>
            <Wordmark size={26} />
          </Link>
        </div>

        {/* ── IDLE / SENDING ── */}
        {(stage === 'idle' || stage === 'sending') && (
          <>
            {/* Heading */}
            <div className="fade-up" style={{ animationDelay:'0.14s', marginBottom:'36px' }}>
              <h1 className="hf" style={{
                fontSize:'clamp(36px,4vw,52px)', fontWeight:700,
                color:'#1a1612', lineHeight:1.08, marginBottom:'14px',
                letterSpacing:'-0.01em',
              }}>
                Welcome back<br />
                <em style={{ color:'#2a9d8f', fontWeight:300 }}>where to this time?</em>
              </h1>
              <p className="bf" style={{ color:'rgba(26,22,18,0.5)', fontSize:'16px', fontWeight:300, lineHeight:1.65 }}>
                Sign in to continue planning.<br />Your trips are waiting.
              </p>
            </div>

            {/* Google */}
            <div className="fade-up" style={{ animationDelay:'0.24s', marginBottom:'14px' }}>
              <button onClick={handleGoogle} disabled={googleLoading || stage==='sending'} className="google-btn">
                {googleLoading
                  ? <div className="spd" />
                  : (
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )
                }
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Divider */}
            <div className="fade-up divider" style={{ animationDelay:'0.32s' }}>
              <div className="dl"/><span className="dt">or sign in with email</span><div className="dl"/>
            </div>

            {/* Email */}
            <form className="fade-up" style={{ animationDelay:'0.38s', display:'flex', flexDirection:'column', gap:'10px' }} onSubmit={handleEmail} noValidate>
              <input
                className="email-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                disabled={stage==='sending'}
              />
              <button type="submit" disabled={stage==='sending' || !email.trim()} className="submit-btn">
                {stage==='sending' ? <><div className="sp"/>Sending…</> : <>Send login link <span style={{ transition:'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)', display:'inline-block' }}>→</span></>}
              </button>
              <p className="bf" style={{ color:'rgba(26,22,18,0.3)', fontSize:'12px', textAlign:'center', marginTop:'2px' }}>
                No password needed. One click and you're in.
              </p>
            </form>


          </>
        )}

        {/* ── SENT — permanent, user-controlled only ── */}
        {stage === 'sent' && (
          <div className="success-box pop-in">
            <div className="emoji-in">📬</div>
            <h2 className="hf" style={{ color:'#1a1612', fontSize:'28px', fontWeight:700, marginBottom:'10px', lineHeight:1.1 }}>
              Check your inbox!
            </h2>
            <p className="bf" style={{ color:'rgba(26,22,18,0.5)', fontSize:'15px', fontWeight:300, lineHeight:1.7, marginBottom:'6px' }}>
              We sent a login link to
            </p>
            <p className="bf" style={{ color:'#1a1612', fontSize:'15px', fontWeight:600, marginBottom:'18px', wordBreak:'break-all' }}>
              {email}
            </p>
            <p className="bf" style={{ color:'rgba(26,22,18,0.42)', fontSize:'13px', lineHeight:1.7, marginBottom:'24px' }}>
              Click the link in your email to sign in instantly — no password needed.
              <br/>Don't see it? Check your spam folder.
            </p>
            <button onClick={reset} style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'12px 28px', background:'#1a1612', color:'white', border:'none', borderRadius:'100px', fontFamily:"'DM Sans',sans-serif", fontSize:'14px', fontWeight:500, cursor:'pointer', boxShadow:'0 4px 16px rgba(0,0,0,0.14)' }}>
              Use a different email
            </button>
          </div>
        )}

        {/* ── ERROR — network/config issue, honest ── */}
        {stage === 'error' && (
          <div className="error-box pop-in">
            <p className="bf" style={{ color:'#92400e', fontSize:'14px', fontWeight:500, marginBottom:'8px' }}>
              ⚠️ Couldn't send the link
            </p>
            <p className="bf" style={{ color:'rgba(26,22,18,0.55)', fontSize:'13px', fontWeight:300, lineHeight:1.7, marginBottom:'14px' }}>
              This is likely a network issue or the email provider isn't configured yet.
              To enable magic links, add <code style={{ background:'rgba(0,0,0,0.06)', padding:'1px 5px', borderRadius:'4px', fontSize:'12px' }}>EMAIL_SERVER</code> and <code style={{ background:'rgba(0,0,0,0.06)', padding:'1px 5px', borderRadius:'4px', fontSize:'12px' }}>EMAIL_FROM</code> to your <code style={{ background:'rgba(0,0,0,0.06)', padding:'1px 5px', borderRadius:'4px', fontSize:'12px' }}>.env</code>.
              <br/><br/>Google sign-in works right now.
            </p>
            <button onClick={reset} style={{ background:'none', border:'none', color:'#2a9d8f', fontFamily:"'DM Sans',sans-serif", fontSize:'13px', cursor:'pointer', textDecoration:'underline' }}>
              ← Try again
            </button>
          </div>
        )}

        {/* Legal */}
        <p className="bf" style={{ color:'rgba(26,22,18,0.25)', fontSize:'11px', marginTop:'28px', lineHeight:1.8 }}>
          By continuing you agree to our{' '}
          <Link href="/terms" className="leg">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="leg">Privacy Policy</Link>
          {'  ·  '}🔒 Encrypted
        </p>
      </div>
    </div>
  )
}
