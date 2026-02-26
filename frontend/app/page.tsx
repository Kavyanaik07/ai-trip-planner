'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

function useScrollDirection() {
  const [show, setShow] = useState(true)
  const lastY = useRef(0)
  
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      
      if (y < 80) {
        setShow(true)
      } else if (y > lastY.current) {
        setShow(false)
      } else {
        setShow(true)
      }
      
      lastY.current = y
    }
    
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  
  return show
}

// ── Hero destinations (4)
const HERO_DESTINATIONS = [
  { name: 'Bali', country: 'Indonesia', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&q=85' },
  { name: 'Kyoto', country: 'Japan', img: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1400&q=85' },
  { name: 'Santorini', country: 'Greece', img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&q=85' },
  { name: 'Patagonia', country: 'Argentina', img: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1400&q=85' },
]

// ── Showcase destinations (DIFFERENT set — breadth signal)
const SHOWCASE_DESTINATIONS = [
  { name: 'Morocco', country: 'Marrakech', img: 'https://images.unsplash.com/photo-1553603227-2358aabe821e?w=800&q=80' },
  { name: 'Iceland', country: 'Reykjavik', img: 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=800&q=80' },
  { name: 'Vietnam', country: 'Hội An', img: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=800&q=80' },
  { name: 'India', country: 'Kerala', img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80' },
  { name: 'Portugal', country: 'Lisbon', img: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Tell us a few things.',
    desc: 'Where you\'re headed, when you land, how much energy you\'ve got. Takes two minutes. No forms, no spreadsheets — just a conversation.',
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    emoji: '💬',
  },
  {
    step: '02',
    title: 'We shape the days around you.',
    desc: 'Arriving at night? Day 1 is a rest day. Low energy? We space things out. Tight budget? We find the gems, not the tourist traps.',
    img: 'https://images.unsplash.com/photo-1524850011238-e3d235c7d4c9?w=800&q=80',
    emoji: '🗓️',
  },
  {
    step: '03',
    title: 'You get a plan that feels doable.',
    desc: 'Not a 6am-to-midnight schedule. Not a generic list. A real itinerary with breathing room — one that makes you want to actually go.',
    img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
    emoji: '✈️',
  },
]

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } }, { threshold })
      obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      ...style,
    }}>
    {children}
    </div>
  )
}

// ── Wordmark: "this·Way" — Cormorant Garamond, light italic + bold
function Wordmark({ size = 24, light = false }: { size?: number; light?: boolean }) {
  const ink = light ? 'white' : '#1a1612'
  const sep = light ? 'rgba(255,255,255,0.4)' : '#2a9d8f'
  return (
    <span style={{ display:'inline-flex', alignItems:'baseline', lineHeight:1, userSelect:'none' }}>
    <span style={{
      fontFamily:"'Cormorant Garamond', Georgia, serif",
      fontWeight:300, fontStyle:'italic',
      fontSize:`${size}px`, color:ink, letterSpacing:'0.01em',
    }}>this</span>
    <span style={{
      fontFamily:"'Cormorant Garamond', Georgia, serif",
      fontWeight:300, fontStyle:'italic',
      fontSize:`${size * 0.55}px`, color:sep,
      margin:`0 ${size * 0.06}px`, alignSelf:'center',
    }}>·</span>
    <span style={{
      fontFamily:"'Cormorant Garamond', Georgia, serif",
      fontWeight:700, fontStyle:'normal',
      fontSize:`${size}px`, color:ink, letterSpacing:'-0.02em',
    }}>Way</span>
    </span>
  )
}

export default function HomePage() {
  const [activeImg, setActiveImg] = useState(0)
  const [mounted, setMounted] = useState(false)
  const showNav = useScrollDirection()
  
  useEffect(() => {
    setMounted(true)
    const t = setInterval(() => setActiveImg(i => (i + 1) % HERO_DESTINATIONS.length), 4500)
    return () => clearInterval(t)
  }, [])
  
  return (
    <div style={{ minHeight:'100vh', background:'#faf8f4', overflowX:'hidden' }}>
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        .bf { font-family:'DM Sans',sans-serif; }
        .hf { font-family:'Cormorant Garamond',Georgia,serif; }
        html { scroll-behavior:smooth; }
      
        /* hero bg */
        .hero-bg { position:absolute; inset:0; background-size:cover; background-position:center; transition:opacity 1.4s ease; }
      
        /* entrance */
        .fade-up { opacity:0; transform:translateY(22px); animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes fadeUp { to { opacity:1; transform:translateY(0); } }
      
        /* primary CTA */
        .cta {
          display:inline-flex; align-items:center; gap:10px;
          padding:17px 42px; background:#1a1612; color:white;
          font-family:'DM Sans',sans-serif; font-size:16px; font-weight:500;
          border-radius:100px; text-decoration:none; border:none; cursor:pointer;
          transition:transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease;
          box-shadow:0 4px 20px rgba(0,0,0,0.14);
        }
        .cta:hover { transform:scale(1.04) translateY(-2px); box-shadow:0 16px 48px rgba(0,0,0,0.2); }
        .cta-arrow { transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .cta:hover .cta-arrow { transform:translateX(6px); }
      
        .cta-ghost {
          display:inline-flex; align-items:center; gap:8px;
          padding:15px 30px; background:transparent; color:#1a1612;
          font-family:'DM Sans',sans-serif; font-size:15px; font-weight:400;
          border-radius:100px; text-decoration:none;
          border:1.5px solid rgba(26,22,18,0.18); cursor:pointer;
          transition:all 0.2s ease;
        }
        .cta-ghost:hover { background:rgba(26,22,18,0.05); border-color:rgba(26,22,18,0.32); }
      
        /* nav link */
        .nav-a {
          color:rgba(26,22,18,0.5); text-decoration:none;
          font-family:'DM Sans',sans-serif; font-size:14px; font-weight:400;
          transition:color 0.2s ease;
        }
        .nav-a:hover { color:#1a1612; }
      
        /* dest card */
        .dest-card {
          border-radius:18px; overflow:hidden; position:relative;
          cursor:pointer; aspect-ratio:3/4;
          transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease;
          box-shadow:0 4px 20px rgba(0,0,0,0.1);
        }
        .dest-card:hover { transform:scale(1.04) translateY(-5px); box-shadow:0 24px 60px rgba(0,0,0,0.18); }
      
        /* feature card */
        .feat {
          padding:32px; border-radius:22px; background:white;
          border:1px solid rgba(0,0,0,0.055);
          box-shadow:0 2px 12px rgba(0,0,0,0.04);
          transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
          min-height: 260px;
          display: flex;
          flex-direction: column;
        }
        .feat p {flex-grow: 1;}
        .feat:hover { transform:translateY(-8px); box-shadow:0 24px 60px rgba(0,0,0,0.09); }
        .feat-icon { font-size:34px; display:block; margin-bottom:18px; transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        .feat:hover .feat-icon { transform:scale(1.18) rotate(-6deg); }
      
        /* pricing card — equal size, glow on hover only */
        .price-card {
          background:white; border-radius:22px; padding:36px;
          border:1px solid rgba(0,0,0,0.07);
          box-shadow:0 2px 16px rgba(0,0,0,0.05);
          transition:transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
          display:flex; flex-direction:column;
        }
        .price-card:hover {
          transform:translateY(-5px);
          box-shadow:0 0 0 2px rgba(42,157,143,0.25), 0 20px 56px rgba(0,0,0,0.1);
          border-color:#2a9d8f;
        }
      
        /* testimonial — fixed height for grid harmony */
        .tcard {
          background:white; border-radius:20px; padding:28px;
          border:1px solid rgba(0,0,0,0.055);
          box-shadow:0 2px 12px rgba(0,0,0,0.04);
          height:220px; display:flex; flex-direction:column; justify-content:space-between;
          transition:transform 0.3s ease, box-shadow 0.3s ease;
        }
        .tcard:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(0,0,0,0.09); }
      
        /* step image */
        .step-img {
          border-radius:22px; height:320px; background-size:cover; background-position:center;
          box-shadow:0 16px 48px rgba(0,0,0,0.12);
          transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
        }
        .step-img:hover { transform:scale(1.02); }
      
        /* dot indicators */
        .dot { height:3px; border-radius:100px; background:rgba(255,255,255,0.35); border:none; cursor:pointer; padding:0; transition:all 0.35s ease; }
        .dot.on { background:white; }
      
        /* scroll hint */
        @keyframes sinkPulse { 0%,100%{opacity:0.3;transform:translateX(-50%) translateY(0)} 50%{opacity:0.65;transform:translateX(-50%) translateY(7px)} }
        .scroll-hint { animation:sinkPulse 2.4s ease-in-out infinite; }
      
        /* showcase grid mosaic */
        .dest-mosaic { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
        .dest-mosaic .dest-card:first-child { grid-row:span 2; aspect-ratio:unset; }
      
        @keyframes floatSlow {
        0% { transform: translateY(0px); }
        50% { transform: translateY(18px); }
        100% { transform: translateY(0px); }
      }
      
        @keyframes ctaPulse {
          0% { box-shadow: 0 0 0 0 rgba(42,157,143,0.35); }
          100% { box-shadow: 0 0 0 22px rgba(42,157,143,0); }
        }
      `}</style>
      
      {/* ── NAV ── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        padding:'16px 56px', display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'rgba(250,248,244,0.9)', backdropFilter:'blur(24px)',
        borderBottom:'1px solid rgba(0,0,0,0.055)',
        transform: showNav ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
      }}>
      <Link href="/" style={{ textDecoration:'none' }}>
      <Wordmark size={22} />
      </Link>
      <div style={{ display:'flex', gap:'32px', alignItems:'center' }}>
      <a href="#how-it-works" className="nav-a">How it works</a>
      <a href="#destinations" className="nav-a">Destinations</a>
      <a href="#pricing" className="nav-a">Pricing</a>
      <Link href="/auth/signin" style={{
        fontFamily:"'DM Sans',sans-serif", fontSize:'14px', fontWeight:500,
        color:'#1a1612', textDecoration:'none', padding:'8px 20px',
        border:'1.5px solid rgba(26,22,18,0.14)', borderRadius:'100px',
        transition:'all 0.2s ease',
      }}>Sign in</Link>
      </div>
      </nav>
      
      {/* ── HERO ── */}
      <section style={{ position:'relative', minHeight:'100vh', display:'flex', alignItems:'center' }}>
      {/* Crossfading background */}
      <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
      {HERO_DESTINATIONS.map((d, i) => (
        <div key={d.name} className="hero-bg" style={{
          backgroundImage:`url(${d.img})`,
          opacity: mounted && activeImg === i ? 1 : 0,
        }} />
      ))}
      <div style={{
        position:'absolute', inset:0,
        background:'linear-gradient(100deg, rgba(250,248,244,0.97) 0%, rgba(250,248,244,0.93) 36%, rgba(250,248,244,0.5) 65%, rgba(250,248,244,0.12) 100%)',
      }} />
      </div>
      
      <div style={{
        position:'relative', zIndex:2,
        maxWidth:'1200px', margin:'0 auto',
        padding:'140px 56px 100px',
        width:'100%', display:'flex', alignItems:'center', gap:'48px',
      }}>
      {/* Left copy */}
      <div style={{ flex:'0 0 52%' }}>
      <h1 className="hf fade-up" style={{
        animationDelay:'0.08s',
        fontSize:'clamp(52px,6.5vw,86px)',
        fontWeight:700, lineHeight:1.0,
        color:'#1a1612', marginBottom:'24px',
        letterSpacing:'-0.01em',
      }}>
      Take a break.<br />
      Go somewhere.<br />
      <em style={{ color:'#2a9d8f', fontWeight:300 }}>We'll handle the rest.</em>
      </h1>
      
      <p className="bf fade-up" style={{
        animationDelay:'0.22s',
        fontSize:'18px', lineHeight:1.7,
        color:'rgba(26,22,18,0.58)', fontWeight:300, marginBottom:'40px',
        maxWidth:'420px',
      }}>
      Tell us where, when, and how you like to travel —
      we'll build a real itinerary around you. Not around a template.
      </p>
      
      {/* CTAs — "Free to plan" moved HERE as helper text, not badge */}
      <div className="fade-up" style={{ animationDelay:'0.36s' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'14px', flexWrap:'wrap', marginBottom:'14px' }}>
      <Link href="/auth/signin" className="cta">
      Let's go <span className="cta-arrow">→</span>
      </Link>
      <a href="#how-it-works" className="cta-ghost">See how it works</a>
      </div>
      <p className="bf" style={{ color:'rgba(26,22,18,0.35)', fontSize:'13px', marginTop:'2px' }}>
      Free to plan · No credit card needed
      </p>
      </div>
      
      {/* Social proof */}
      <div className="bf fade-up" style={{ animationDelay:'0.52s', marginTop:'44px', display:'flex', alignItems:'center', gap:'12px' }}>
      <div style={{ display:'flex' }}>
      {['#b5936e','#7aab8c','#8c7aab','#ab8c7a'].map((c,i) => (
        <div key={i} style={{
          width:'32px', height:'32px', borderRadius:'50%',
          background:c, border:'2px solid #faf8f4',
          marginLeft:i>0?'-8px':'0',
        }} />
      ))}
      </div>
      <p style={{ color:'rgba(26,22,18,0.48)', fontSize:'13px' }}>
      <strong style={{ color:'#1a1612', fontWeight:600 }}>2,400+</strong> trips planned this month
      </p>
      </div>
      </div>
      
      {/* Right — itinerary preview card */}
      <div className="fade-up" style={{ animationDelay:'0.28s', flex:1, display:'flex', justifyContent:'flex-end' }}>
      <div style={{
        width:'100%', maxWidth:'360px',
        background:'white', borderRadius:'26px', overflow:'hidden',
        boxShadow:'0 24px 80px rgba(0,0,0,0.13)',
        border:'1px solid rgba(0,0,0,0.055)',
      }}>
      <div style={{ height:'185px', position:'relative', overflow:'hidden' }}>
      {HERO_DESTINATIONS.map((d, i) => (
        <div key={d.name} style={{
          position:'absolute', inset:0,
          backgroundImage:`url(${d.img})`,
          backgroundSize:'cover', backgroundPosition:'center',
          opacity: mounted && activeImg === i ? 1 : 0,
          transition:'opacity 1.4s ease',
        }} />
      ))}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, padding:'18px',
        background:'linear-gradient(to top, rgba(0,0,0,0.65), transparent)',
        display:'flex', justifyContent:'space-between', alignItems:'flex-end',
      }}>
      <div>
      <p className="bf" style={{ color:'rgba(255,255,255,0.55)', fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.08em' }}>Your next trip</p>
      <h3 className="hf" style={{ color:'white', fontSize:'20px', fontWeight:700 }}>{HERO_DESTINATIONS[activeImg]?.name}</h3>
      </div>
      <div style={{ display:'flex', gap:'4px' }}>
      {HERO_DESTINATIONS.map((_,i) => (
        <button key={i} onClick={() => setActiveImg(i)} className={`dot${activeImg===i?' on':''}`} style={{ width:activeImg===i?'16px':'5px' }} />
      ))}
      </div>
      </div>
      </div>
      
      <div style={{ padding:'18px 20px' }}>
      <p className="bf" style={{ color:'rgba(26,22,18,0.38)', fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:'10px' }}>Sample plan</p>
      {[
        { day:'Day 1', text:'Arrival — gentle evening start', tag:'🌙 Rest', tc:'rgba(107,70,193,0.1)', tt:'#6b46c1' },
        { day:'Day 2', text:'Morning temples, afternoon market', tag:'🗺️ Explore', tc:'rgba(42,157,143,0.1)', tt:'#1a7a6e' },
        { day:'Day 3', text:'Hike + sunset + local dinner', tag:'⚡ Active', tc:'rgba(214,93,42,0.1)', tt:'#c05c20' },
      ].map((item,i) => (
        <div key={i} style={{
          display:'flex', alignItems:'center', gap:'8px',
          padding:'9px 0', borderBottom:i<2?'1px solid rgba(0,0,0,0.05)':'none',
        }}>
        <span className="bf" style={{ fontSize:'10px', fontWeight:600, color:'#2a9d8f', minWidth:'38px' }}>{item.day}</span>
        <span className="bf" style={{ fontSize:'12px', color:'rgba(26,22,18,0.68)', flex:1 }}>{item.text}</span>
        <span className="bf" style={{ background:item.tc, color:item.tt, padding:'2px 7px', borderRadius:'100px', fontSize:'10px', fontWeight:500, whiteSpace:'nowrap' }}>{item.tag}</span>
        </div>
      ))}
      <Link href="/auth/signin" style={{
        display:'block', marginTop:'12px', textAlign:'center',
        padding:'11px', background:'#1a1612', color:'white',
        borderRadius:'11px', textDecoration:'none',
        fontFamily:"'DM Sans',sans-serif", fontSize:'13px', fontWeight:500,
      }}>
      Plan a trip like this →
      </Link>
      </div>
      </div>
      </div>
      </div>
      
      {/* Scroll hint */}
      <a href="#how-it-works" className="scroll-hint bf" style={{
        position:'absolute', bottom:'28px', left:'50%',
        color:'rgba(26,22,18,0.3)', fontSize:'12px', zIndex:2, textDecoration:'none',
        display:'flex', flexDirection:'column', alignItems:'center', gap:'3px',
      }}>
      <span>this way</span>
      <span style={{ fontSize:'16px' }}>↓</span>
      </a>
      </section>
      
      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background:'#f3f0eb', padding:'120px 56px' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
      
      <Reveal style={{ textAlign:'center', marginBottom:'84px' }}>
      <h2 className="hf" style={{
        fontSize:'clamp(38px,4.5vw,58px)', fontWeight:700,
        color:'#1a1612', lineHeight:1.1, marginBottom:'16px',
        letterSpacing:'-0.01em',
      }}>
      A trip planned around<br />
      <em style={{ color:'#2a9d8f', fontWeight:300 }}>how you actually travel.</em>
      </h2>
      <p className="bf" style={{ color:'rgba(26,22,18,0.48)', fontSize:'17px', fontWeight:300, maxWidth:'500px', margin:'0 auto' }}>
      Not a generic tourist list. Not a template. A plan that fits you.
      </p>
      </Reveal>
      
      <div style={{ display:'flex', flexDirection:'column', gap:'96px' }}>
      {HOW_IT_WORKS.map((step, i) => (
        <Reveal key={step.step} delay={0.08}>
        <div style={{
          display:'grid', gridTemplateColumns:'1fr 1fr',
          gap:'64px', alignItems:'center',
          direction: i % 2 === 1 ? 'rtl' : 'ltr',
        }}>
        <div style={{ direction:'ltr' }}>
        <div className="step-img" style={{ backgroundImage:`url(${step.img})` }} />
        </div>
        <div style={{ direction:'ltr' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', marginBottom:'20px' }}>
        <span className="hf" style={{ fontSize:'56px', fontWeight:700, color:'rgba(42,157,143,0.13)', lineHeight:1 }}>{step.step}</span>
        <span style={{ fontSize:'30px' }}>{step.emoji}</span>
        </div>
        <h3 className="hf" style={{ fontSize:'34px', fontWeight:700, color:'#1a1612', lineHeight:1.15, marginBottom:'14px' }}>
        {step.title}
        </h3>
        <p className="bf" style={{ fontSize:'16px', color:'rgba(26,22,18,0.58)', lineHeight:1.78, fontWeight:300 }}>
        {step.desc}
        </p>
        {i === 2 && (
          <Link href="/auth/signin" className="cta" style={{ marginTop:'28px', display:'inline-flex' }}>
          Try it free <span className="cta-arrow">→</span>
          </Link>
        )}
        </div>
        </div>
        </Reveal>
      ))}
      </div>
      </div>
      </section>
      
      {/* ── DESTINATIONS — different from hero, mosaic layout ── */}
      <section id="destinations" style={{ background:'#faf8f4', padding:'100px 56px' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
      <Reveal style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'36px', flexWrap:'wrap', gap:'16px' }}>
      <div>
      <h2 className="hf" style={{ fontSize:'clamp(32px,4vw,48px)', fontWeight:700, color:'#1a1612', letterSpacing:'-0.01em' }}>
      Anywhere you want to go.
      </h2>
      <p className="bf" style={{ color:'rgba(26,22,18,0.45)', fontSize:'16px', fontWeight:300, marginTop:'8px' }}>
      Popular cities, hidden gems, off-the-beaten-path — we plan it all.
      </p>
      </div>
      <Link href="/auth/signin" className="cta-ghost" style={{ fontSize:'14px', padding:'11px 22px' }}>
      Explore all →
      </Link>
      </Reveal>
      
      {/* Mosaic grid — 3 cols, first card tall */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gridTemplateRows:'auto auto', gap:'14px' }}>
      {SHOWCASE_DESTINATIONS.map((d, i) => (
        <Reveal key={d.name} delay={i * 0.08} style={{ gridRow: i === 0 ? 'span 2' : undefined }}>
        <Link href="/auth/signin" style={{ textDecoration:'none', display:'block', height:'100%' }}>
        <div className="dest-card" style={{ height: i === 0 ? '100%' : undefined, minHeight: i === 0 ? '420px' : '190px', aspectRatio: i > 0 ? '4/3' : undefined }}>
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:`url(${d.img})`,
          backgroundSize:'cover', backgroundPosition:'center',
        }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' }} />
        <div style={{ position:'absolute', bottom:'16px', left:'16px' }}>
        <h3 className="hf" style={{ color:'white', fontSize: i === 0 ? '26px' : '20px', fontWeight:700 }}>{d.name}</h3>
        <p className="bf" style={{ color:'rgba(255,255,255,0.6)', fontSize:'12px' }}>{d.country}</p>
        </div>
        </div>
        </Link>
        </Reveal>
      ))}
      </div>
      </div>
      </section>
      
      {/* ── FEATURE CARDS — rewritten copy ── */}
      <section style={{ background:'#f3f0eb', padding:'96px 56px' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
      <Reveal style={{ textAlign:'center', marginBottom:'56px' }}>
      <h2 className="hf" style={{ fontSize:'clamp(32px,4vw,46px)', fontWeight:700, color:'#1a1612', letterSpacing:'-0.01em' }}>
      Trips that actually make sense.
      </h2>
      </Reveal>
      
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'18px' }}>
      {[
        {
          icon:'🌙',
          title:'Arrival-aware',
          desc:'Landing at 11pm? We don\'t book your first temple tour at 8am. Day 1 starts when you\'re actually ready.',
        },
        {
          icon:'🔋',
          title:'Energy-matched',
          desc:'Tell us your pace — slow mornings, packed days, somewhere in between. Every day reflects how you actually want to feel.',
        },
        {
          icon:'💸',
          title:'Budget-honest',
          desc:'No upsells. No fantasy itineraries. We plan around what you\'re actually spending, including food, transport, and entry fees.',
        },
      ].map((f, i) => (
        <Reveal key={f.title} delay={i * 0.1}>
        <div className="feat">
        <span className="feat-icon">{f.icon}</span>
        <h3 className="hf" style={{ color:'#1a1612', fontSize:'22px', fontWeight:700, marginBottom:'12px', letterSpacing:'-0.01em' }}>{f.title}</h3>
        <p className="bf" style={{ color:'rgba(26,22,18,0.58)', fontSize:'15px', lineHeight:1.72, fontWeight:300 }}>{f.desc}</p>
        </div>
        </Reveal>
      ))}
      </div>
      </div>
      </section>
      
      {/* ── PRICING ── */}
      <section id="pricing" style={{ background:'#faf8f4', padding:'100px 56px' }}>
      <div style={{ maxWidth:'880px', margin:'0 auto' }}>
      <Reveal style={{ textAlign:'center', marginBottom:'52px' }}>
      
      <h2 className="hf" style={{ fontSize:'clamp(32px,4vw,48px)', fontWeight:700, color:'#1a1612', marginBottom:'12px', letterSpacing:'-0.01em' }}>
      Start free. No pressure.
      </h2>
      <p className="bf" style={{ color:'rgba(26,22,18,0.48)', fontSize:'17px', fontWeight:300 }}>
      Plan as many trips as you want — for free. Pay only if you want more.
      </p>
      </Reveal>
      
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'18px', maxWidth:'680px', margin:'0 auto' }}>
      {[
        {
          tier:'Free forever',
          price:'₹0',
          sub:'Always free to plan',
          features:['Unlimited trip planning','Day-by-day itineraries','Budget breakdown','Travel style customization'],
          cta:'Start free →',
          href:'/auth/signin',
          disabled:false,
        },
        {
          tier:'Export',
          price:'₹299',
          sub:'per trip export',
          badge:'Coming soon',
          features:['Everything in Free','PDF itinerary export','Hotel & flight suggestions','Offline trip access','Priority planning'],
          cta:'Notify me →',
          href:'#',
          disabled:true,
        },
      ].map((plan, i) => (
        <Reveal key={plan.tier} delay={i * 0.12}>
        <div className="price-card" style={{ height:'100%' }}>
        <div style={{ marginBottom:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
        <p className="bf" style={{ color:'rgba(26,22,18,0.42)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.09em' }}>{plan.tier}</p>
        {plan.badge && (
          <span className="bf" style={{ background:'rgba(42,157,143,0.1)', color:'#1a7a6e', padding:'3px 10px', borderRadius:'100px', fontSize:'10px', fontWeight:600, letterSpacing:'0.05em' }}>
          {plan.badge}
          </span>
        )}
        </div>
        <p className="hf" style={{ fontSize:'48px', fontWeight:700, color:'#1a1612', lineHeight:1, marginBottom:'4px' }}>{plan.price}</p>
        <p className="bf" style={{ color:'rgba(26,22,18,0.38)', fontSize:'13px', marginBottom:'24px' }}>{plan.sub}</p>
        <div style={{ display:'flex', flexDirection:'column', gap:'9px', marginBottom:'28px' }}>
        {plan.features.map(f => (
          <p key={f} className="bf" style={{ color:'rgba(26,22,18,0.68)', fontSize:'14px', display:'flex', gap:'8px', alignItems:'flex-start' }}>
          <span style={{ color:'#2a9d8f', marginTop:'1px' }}>✓</span> {f}
          </p>
        ))}
        </div>
        </div>
        {plan.disabled
          ? <button disabled style={{ padding:'13px', background:'rgba(26,22,18,0.06)', borderRadius:'12px', border:'none', width:'100%', fontFamily:"'DM Sans',sans-serif", fontSize:'14px', fontWeight:500, color:'rgba(26,22,18,0.35)', cursor:'not-allowed' }}>{plan.cta}</button>
          : <Link href={plan.href} style={{ display:'block', padding:'13px', background:'#1a1612', borderRadius:'12px', textDecoration:'none', textAlign:'center', fontFamily:"'DM Sans',sans-serif", fontSize:'14px', fontWeight:500, color:'white' }}>{plan.cta}</Link>
        }
        </div>
        </Reveal>
      ))}
      </div>
      
      <Reveal style={{ textAlign:'center', marginTop:'28px' }} delay={0.25}>
      <p className="bf" style={{ color:'rgba(26,22,18,0.3)', fontSize:'13px', fontStyle:'italic' }}>
      No subscriptions. No hidden fees. Pay once per export, whenever you're ready.
      </p>
      </Reveal>
      </div>
      </section>
      
      {/* ── TESTIMONIALS — fixed height grid ── */}
      <section style={{ background:'#f3f0eb', padding:'80px 56px' }}>
      <div style={{ maxWidth:'1000px', margin:'0 auto' }}>
      <Reveal style={{ textAlign:'center', marginBottom:'44px' }}>
      <h2 className="hf" style={{ fontSize:'clamp(28px,3.5vw,40px)', fontWeight:700, color:'#1a1612', letterSpacing:'-0.01em' }}>
      Real trips. Real people.
      </h2>
      </Reveal>
      
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px' }}>
      {[
        { q:'It planned Day 1 around my late flight. First AI that ever got that right.', name:'Kavya N.', dest:'Manali', emoji:'🏔️' },
        { q:'Six people, completely different budgets. It balanced everyone without us even asking.', name:'Rohit M.', dest:'Goa', emoji:'🏖️' },
        { q:'The low-energy mode gave us breathing room I didn\'t know I needed. Best trip I\'ve taken.', name:'Sneha P.', dest:'Bali', emoji:'🌴' },
      ].map((t, i) => (
        <Reveal key={i} delay={i * 0.1}>
        <div className="tcard">
        <p className="bf" style={{ color:'rgba(26,22,18,0.7)', fontSize:'14px', lineHeight:1.75, fontWeight:300, fontStyle:'italic', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical' }}>
        "{t.q}"
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginTop:'16px' }}>
        <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'rgba(42,157,143,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0 }}>
        {t.emoji}
        </div>
        <div>
        <p className="bf" style={{ color:'#1a1612', fontSize:'13px', fontWeight:600 }}>{t.name}</p>
        <p className="bf" style={{ color:'rgba(26,22,18,0.38)', fontSize:'12px' }}>{t.dest}</p>
        </div>
        </div>
        </div>
        </Reveal>
      ))}
      </div>
      </div>
      </section>
      
      {/* ── FINAL CTA — calm, motivating, animated ── */}
      <section
  style={{
    position: 'relative',
    padding: '160px 56px',
    overflow: 'hidden',
    textAlign: 'center',
    background: '#faf8f4',
  }}
>
  {/* ── Background travel images (dimmed) ── */}
  <div
    style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
    }}
  >
    {/* Left — warm / arrival */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '40%',
        height: '100%',
        backgroundImage:
          "url('https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1600&q=80')", // Kerala
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(12px) saturate(0.85)',
        opacity: 0.35,
      }}
    />

    {/* Right — cool / freedom */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '40%',
        height: '100%',
        backgroundImage:
          "url('https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&q=85')", // Bali
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(14px) saturate(0.9)',
        opacity: 0.3,
      }}
    />

    {/* Bottom — depth */}
    <div
      style={{
        position: 'absolute',
        bottom: '-20%',
        left: '25%',
        width: '50%',
        height: '60%',
        backgroundImage:
          "url('https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=85')", // Patagonia
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(18px) saturate(0.8)',
        opacity: 0.25,
      }}
    />

    {/* Light overlay for readability */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(180deg, rgba(250,248,244,0.92), rgba(250,248,244,0.96))',
      }}
    />
  </div>

  {/* ── Content ── */}
  <div
    style={{
      position: 'relative',
      maxWidth: '680px',
      margin: '0 auto',
    }}
  >
    <Reveal>
      <p
        className="bf"
        style={{
          color: '#2a9d8f',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          marginBottom: '22px',
        }}
      >
        Ready when you are
      </p>

      <h2
        className="hf"
        style={{
          fontSize: 'clamp(48px,6vw,76px)',
          fontWeight: 700,
          color: '#14110e',
          lineHeight: 1,
          marginBottom: '22px',
          letterSpacing: '-0.02em',
        }}
      >
        Alright.
        <br />
        <em style={{ color: '#2a9d8f', fontWeight: 300 }}>
          Where to next?
        </em>
      </h2>

      <p
        className="bf"
        style={{
          fontSize: '17px',
          color: 'rgba(26,22,18,0.6)',
          marginBottom: '42px',
        }}
      >
        Free to plan. Takes two minutes.
      </p>

      <Link
        href="/auth/signin"
        className="cta"
        style={{
          padding: '18px 48px',
          fontSize: '16px',
          boxShadow: '0 22px 60px rgba(0,0,0,0.28)',
        }}
      >
        Start planning <span className="cta-arrow">→</span>
      </Link>

      <p
        className="bf"
        style={{
          marginTop: '22px',
          fontSize: '12px',
          color: 'rgba(26,22,18,0.25)',
          fontStyle: 'italic',
        }}
      >
        thiswayletsgo.com
      </p>
    </Reveal>
  </div>
</section>
      </div>
    )
  }
  