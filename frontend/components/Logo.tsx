'use client'

import { useEffect, useRef, useState } from 'react'

// ─── THE LOGO COMPONENT ──────────────────────────────────────────────────────
// Usage: <ThisWayLogo size="md" variant="dark" animated />

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type LogoVariant = 'dark' | 'light' | 'color' | 'minimal'

const SIZES: Record<LogoSize, { width: number; height: number; fontSize: number }> = {
  xs:  { width: 80,  height: 22, fontSize: 14 },
  sm:  { width: 110, height: 30, fontSize: 19 },
  md:  { width: 155, height: 42, fontSize: 27 },
  lg:  { width: 220, height: 60, fontSize: 38 },
  xl:  { width: 320, height: 88, fontSize: 56 },
}

export function ThisWayLogo({
  size = 'md',
  variant = 'dark',
  animated = false,
  className = '',
}: {
  size?: LogoSize
  variant?: LogoVariant
  animated?: boolean
  className?: string
}) {
  const [played, setPlayed] = useState(false)
  const s = SIZES[size]

  useEffect(() => {
    if (animated) setTimeout(() => setPlayed(true), 100)
  }, [animated])

  const textColor = variant === 'light' ? '#ffffff'
    : variant === 'color' ? '#1a1612'
    : '#1a1612'

  const accentColor = variant === 'light' ? '#ffffff'
    : '#2a9d8f'

  const dotColor = variant === 'light' ? '#f4c842'
    : '#f4c842'  // always golden yellow — the sun dot

  const scale = s.fontSize / 27  // base at md

  return (
    <svg
      width={s.width}
      height={s.height}
      viewBox={`0 0 155 42`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <style>{`
        .tw-letter {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 900;
          font-size: 34px;
        }
        .tw-this {
          fill: ${textColor};
          ${animated ? `
            opacity: 0;
            animation: twSlideIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
            animation-delay: ${played ? '0s' : '999s'};
          ` : 'opacity:1;'}
        }
        .tw-way {
          fill: ${textColor};
          ${animated ? `
            opacity: 0;
            animation: twSlideIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.12s forwards;
            animation-delay: ${played ? '0.12s' : '999s'};
          ` : 'opacity:1;'}
        }
        .tw-dot {
          fill: ${dotColor};
          ${animated ? `
            opacity: 0;
            transform-origin: 33px 5px;
            animation: twDotPop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.35s forwards;
            animation-delay: ${played ? '0.35s' : '999s'};
          ` : 'opacity:1;'}
        }
        .tw-arrow {
          stroke: ${accentColor};
          stroke-width: 2.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
          ${animated ? `
            stroke-dasharray: 28;
            stroke-dashoffset: ${played ? '0' : '28'};
            transition: stroke-dashoffset 0.45s cubic-bezier(0.16,1,0.3,1) 0.5s;
          ` : ''}
        }
        .tw-underline {
          stroke: ${accentColor};
          stroke-width: 2;
          stroke-linecap: round;
          ${animated ? `
            stroke-dasharray: 60;
            stroke-dashoffset: ${played ? '0' : '60'};
            transition: stroke-dashoffset 0.5s cubic-bezier(0.16,1,0.3,1) 0.55s;
          ` : ''}
        }
        @keyframes twSlideIn {
          from { opacity:0; transform:translateX(-6px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes twDotPop {
          from { opacity:0; transform:scale(0); }
          to   { opacity:1; transform:scale(1); }
        }
      `}</style>

      {/* "This" — using text element for font rendering */}
      <text x="0" y="36" className="tw-letter tw-this" letterSpacing="-0.5">This</text>

      {/* "Way" — slightly offset for the arrow gap */}
      <text x="68" y="36" className="tw-letter tw-way" letterSpacing="-0.5">Way</text>

      {/* Sunny yellow dot replacing the "i" dot — positioned above the i */}
      <circle cx="33.5" cy="5" r="4.5" className="tw-dot" />

      {/* Arrow → drawn between This and Way */}
      <g className="tw-arrow">
        <line x1="55" y1="20" x2="66" y2="20" />
        <polyline points="61,15 67,20 61,25" />
      </g>

      {/* Subtle teal underline beneath "Way" — the path/road metaphor */}
      <line x1="68" y1="40" x2="128" y2="40" className="tw-underline" />
    </svg>
  )
}

// ─── ANIMATED COMPASS MARK ───────────────────────────────────────────────────
export function CompassMark({ size = 32, spin = false }: { size?: number; spin?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <style>{`
        @keyframes compassSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .needle { transform-origin: 16px 16px; ${spin ? 'animation: compassSpin 8s linear infinite;' : ''} }
        @keyframes compassBob { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }
        .needle-bob { transform-origin: 16px 16px; animation: compassBob 3.5s ease-in-out infinite; }
      `}</style>

      {/* Outer ring */}
      <circle cx="16" cy="16" r="14.5" stroke="#1a1612" strokeWidth="1.5" fill="rgba(250,248,244,0.9)" />
      {/* Inner ring */}
      <circle cx="16" cy="16" r="10" stroke="rgba(26,22,18,0.1)" strokeWidth="1" fill="none" />

      {/* Cardinal marks */}
      {[0,90,180,270].map(deg => (
        <line
          key={deg}
          x1="16" y1="3.5" x2="16" y2="6"
          stroke="rgba(26,22,18,0.25)" strokeWidth="1.5" strokeLinecap="round"
          transform={`rotate(${deg} 16 16)`}
        />
      ))}

      {/* Compass needle */}
      <g className={spin ? 'needle' : 'needle-bob'}>
        {/* North — teal */}
        <polygon points="16,6 18,16 16,14 14,16" fill="#2a9d8f" />
        {/* South — warm dark */}
        <polygon points="16,26 18,16 16,18 14,16" fill="rgba(26,22,18,0.35)" />
      </g>

      {/* Center dot */}
      <circle cx="16" cy="16" r="2" fill="#1a1612" />
      <circle cx="16" cy="16" r="1" fill="#faf8f4" />

      {/* N mark */}
      <text x="16" y="13" textAnchor="middle" fontSize="5" fontWeight="700" fontFamily="DM Sans, sans-serif" fill="#2a9d8f" opacity="0.7">N</text>
    </svg>
  )
}

// ─── SHOWCASE PAGE ────────────────────────────────────────────────────────────
export default function LogoShowcase() {
  const [darkBg, setDarkBg] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: darkBg ? '#1a1612' : '#faf8f4', transition: 'background 0.4s ease', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }

        .toggle-bg {
          padding: 10px 20px; border-radius: 100px; border: 1.5px solid;
          border-color: ${darkBg ? 'rgba(255,255,255,0.2)' : 'rgba(26,22,18,0.15)'};
          background: transparent; cursor: pointer; font-family: 'DM Sans', sans-serif;
          font-size: 13px; color: ${darkBg ? 'rgba(255,255,255,0.6)' : 'rgba(26,22,18,0.5)'};
          transition: all 0.2s ease;
        }
        .toggle-bg:hover {
          background: ${darkBg ? 'rgba(255,255,255,0.08)' : 'rgba(26,22,18,0.06)'};
        }

        .swatch-label {
          font-size: 11px; color: rgba(26,22,18,0.4);
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-top: 8px; text-align: center;
          font-family: 'DM Sans', sans-serif;
        }

        .variant-box {
          padding: 28px 36px; border-radius: 20px;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
        }

        .size-row {
          display: flex; align-items: center; gap: 24px;
          flex-wrap: wrap; padding: 24px 0;
          border-bottom: 1px solid rgba(26,22,18,0.06);
        }
        .size-row:last-child { border-bottom: none; }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '64px' }}>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2a9d8f', marginBottom: '8px', fontWeight: 500 }}>
              Brand Identity
            </p>
            <h1 style={{
              fontFamily: "'Playfair Display', serif", fontSize: '40px', fontWeight: 900,
              color: darkBg ? 'white' : '#1a1612', marginBottom: '10px', lineHeight: 1.1,
            }}>
              ThisWay Logo System
            </h1>
            <p style={{ color: darkBg ? 'rgba(255,255,255,0.4)' : 'rgba(26,22,18,0.45)', fontSize: '15px', fontWeight: 300 }}>
              Wordmark · Compass mark · Variants · Animation guide
            </p>
          </div>
          <button className="toggle-bg" onClick={() => setDarkBg(b => !b)}>
            {darkBg ? '☀️ Light bg' : '🌙 Dark bg'}
          </button>
        </div>

        {/* ── PRIMARY WORDMARK ── */}
        <section style={{ marginBottom: '60px' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: darkBg ? 'rgba(255,255,255,0.3)' : 'rgba(26,22,18,0.35)', marginBottom: '20px', fontWeight: 600 }}>
            Primary wordmark
          </p>

          <div style={{
            background: darkBg ? 'rgba(255,255,255,0.04)' : 'white',
            border: `1px solid ${darkBg ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            borderRadius: '24px', padding: '56px',
            display: 'flex', justifyContent: 'center',
            marginBottom: '20px',
          }}>
            <ThisWayLogo size="xl" variant={darkBg ? 'light' : 'dark'} animated />
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px', marginBottom: '20px',
          }}>
            {/* Anatomy callouts */}
            {[
              { label: 'Yellow dot', desc: 'Replaces the "i" dot. The sun. The destination. Joy.', color: '#f4c842' },
              { label: 'Teal arrow →', desc: 'Draws itself on load. "This → Way". Movement encoded.', color: '#2a9d8f' },
              { label: 'Underline', desc: 'The road beneath "Way". Path, journey, direction.', color: '#2a9d8f' },
            ].map(a => (
              <div key={a.label} style={{
                padding: '16px', borderRadius: '14px',
                background: darkBg ? 'rgba(255,255,255,0.04)' : 'rgba(26,22,18,0.03)',
                border: `1px solid ${darkBg ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
              }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: a.color, marginBottom: '8px' }} />
                <p style={{ fontSize: '13px', fontWeight: 600, color: darkBg ? 'white' : '#1a1612', marginBottom: '4px' }}>{a.label}</p>
                <p style={{ fontSize: '12px', color: darkBg ? 'rgba(255,255,255,0.4)' : 'rgba(26,22,18,0.45)', lineHeight: 1.5, fontWeight: 300 }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── VARIANTS ── */}
        <section style={{ marginBottom: '60px' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: darkBg ? 'rgba(255,255,255,0.3)' : 'rgba(26,22,18,0.35)', marginBottom: '20px', fontWeight: 600 }}>
            Colour variants
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
            {[
              { variant: 'dark' as const, bg: '#faf8f4', label: 'On light' },
              { variant: 'light' as const, bg: '#1a1612', label: 'On dark' },
              { variant: 'light' as const, bg: '#2a9d8f', label: 'On teal' },
              { variant: 'light' as const, bg: 'linear-gradient(135deg,#2a9d8f,#1a6a63)', label: 'On gradient' },
            ].map(v => (
              <div key={v.label}>
                <div className="variant-box" style={{ background: v.bg, border: '1px solid rgba(0,0,0,0.08)' }}>
                  <ThisWayLogo size="sm" variant={v.variant} />
                </div>
                <p className="swatch-label" style={{ color: darkBg ? 'rgba(255,255,255,0.4)' : 'rgba(26,22,18,0.4)' }}>{v.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── COMPASS MARK ── */}
        <section style={{ marginBottom: '60px' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: darkBg ? 'rgba(255,255,255,0.3)' : 'rgba(26,22,18,0.35)', marginBottom: '20px', fontWeight: 600 }}>
            Compass mark (icon / app icon)
          </p>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            {[16,24,32,48,64,96].map(sz => (
              <div key={sz} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <CompassMark size={sz} />
                <p style={{ fontSize: '11px', color: darkBg ? 'rgba(255,255,255,0.3)' : 'rgba(26,22,18,0.35)', fontFamily: 'DM Sans,sans-serif' }}>{sz}px</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ padding: '20px', borderRadius: '16px', background: '#1a1612', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <CompassMark size={40} />
              <span style={{ fontFamily: "'Playfair Display',serif", color: 'white', fontSize: '20px', fontWeight: 700 }}>ThisWay</span>
            </div>
            <div style={{ padding: '20px', borderRadius: '16px', background: '#2a9d8f', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <CompassMark size={40} />
              <span style={{ fontFamily: "'Playfair Display',serif", color: 'white', fontSize: '20px', fontWeight: 700 }}>ThisWay</span>
            </div>
          </div>
        </section>

        {/* ── SIZE SCALE ── */}
        <section style={{ marginBottom: '60px' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: darkBg ? 'rgba(255,255,255,0.3)' : 'rgba(26,22,18,0.35)', marginBottom: '20px', fontWeight: 600 }}>
            Size scale
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(['xl','lg','md','sm','xs'] as LogoSize[]).map(sz => (
              <div key={sz} className="size-row" style={{ borderBottomColor: darkBg ? 'rgba(255,255,255,0.05)' : 'rgba(26,22,18,0.06)' }}>
                <span style={{ width: '40px', fontSize: '12px', color: darkBg ? 'rgba(255,255,255,0.3)' : 'rgba(26,22,18,0.35)', fontFamily: 'DM Sans,sans-serif', flexShrink: 0 }}>{sz}</span>
                <ThisWayLogo size={sz} variant={darkBg ? 'light' : 'dark'} />
                <span style={{ fontSize: '12px', color: darkBg ? 'rgba(255,255,255,0.25)' : 'rgba(26,22,18,0.3)', fontFamily: 'DM Sans,sans-serif' }}>
                  {SIZES[sz].width}×{SIZES[sz].height}px — {sz === 'xl' ? 'Hero/splash' : sz === 'lg' ? 'Section headers' : sz === 'md' ? 'Nav default' : sz === 'sm' ? 'Mobile nav, emails' : 'Favicon companion'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── ANIMATION SPEC ── */}
        <section style={{ marginBottom: '60px' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: darkBg ? 'rgba(255,255,255,0.3)' : 'rgba(26,22,18,0.35)', marginBottom: '20px', fontWeight: 600 }}>
            Animation — on-load sequence
          </p>
          <div style={{
            background: darkBg ? 'rgba(255,255,255,0.03)' : 'rgba(26,22,18,0.03)',
            border: `1px solid ${darkBg ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            borderRadius: '20px', padding: '28px',
          }}>
            <div style={{ display: 'flex', gap: '0', marginBottom: '24px', overflow: 'hidden', borderRadius: '12px' }}>
              {[
                { label: '"This" slides in', time: '0ms', color: '#2a9d8f' },
                { label: '"Way" follows', time: '120ms', color: '#2a9d8f' },
                { label: 'Yellow dot pops', time: '350ms', color: '#f4c842' },
                { label: 'Arrow draws', time: '500ms', color: '#2a9d8f' },
                { label: 'Underline sweeps', time: '550ms', color: '#2a9d8f' },
              ].map((step, i) => (
                <div key={i} style={{
                  flex: 1, padding: '12px 10px',
                  background: i % 2 === 0
                    ? (darkBg ? 'rgba(255,255,255,0.04)' : 'rgba(26,22,18,0.04)')
                    : (darkBg ? 'rgba(255,255,255,0.02)' : 'rgba(26,22,18,0.02)'),
                  borderRight: i < 4 ? `1px solid ${darkBg ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` : 'none',
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: step.color, marginBottom: '6px' }} />
                  <p style={{ fontSize: '11px', fontWeight: 600, color: darkBg ? 'rgba(255,255,255,0.7)' : '#1a1612', marginBottom: '2px' }}>{step.label}</p>
                  <p style={{ fontSize: '10px', color: step.color, fontFamily: 'monospace' }}>{step.time}</p>
                </div>
              ))}
            </div>

            {/* Live replay */}
            <LogoReplay darkBg={darkBg} />
          </div>
        </section>

        {/* ── DO/DON'T ── */}
        <section style={{ marginBottom: '60px' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: darkBg ? 'rgba(255,255,255,0.3)' : 'rgba(26,22,18,0.35)', marginBottom: '20px', fontWeight: 600 }}>
            Usage rules
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(42,157,143,0.06)', border: '1px solid rgba(42,157,143,0.15)' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a7a6e', marginBottom: '14px' }}>✅ Do</p>
              {['Use on warm white #faf8f4 backgrounds', 'Use animated version on page load / hero only', 'Keep minimum clear space = compass height on all sides', 'Use CompassMark solo for favicons and app icons', 'Let the arrow animate on hero load — never loop it'].map(r => (
                <p key={r} style={{ fontSize: '13px', color: darkBg ? 'rgba(255,255,255,0.55)' : 'rgba(26,22,18,0.6)', marginBottom: '6px', display: 'flex', gap: '8px', lineHeight: 1.5, fontWeight: 300 }}>
                  <span>·</span>{r}
                </p>
              ))}
            </div>
            <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626', marginBottom: '14px' }}>❌ Don't</p>
              {["Add drop shadows or gradients to the wordmark", "Stretch or skew the logo", "Use on busy photo backgrounds without overlay", "Add outline stroke around the letters", "Change the font — Playfair Display 900 is the typeface"].map(r => (
                <p key={r} style={{ fontSize: '13px', color: darkBg ? 'rgba(255,255,255,0.55)' : 'rgba(26,22,18,0.6)', marginBottom: '6px', display: 'flex', gap: '8px', lineHeight: 1.5, fontWeight: 300 }}>
                  <span>·</span>{r}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* ── COLOUR TOKENS ── */}
        <section>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: darkBg ? 'rgba(255,255,255,0.3)' : 'rgba(26,22,18,0.35)', marginBottom: '20px', fontWeight: 600 }}>
            Brand colour tokens
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { name: '--brand-ink', hex: '#1a1612', label: 'Ink' },
              { name: '--brand-canvas', hex: '#faf8f4', label: 'Canvas' },
              { name: '--brand-teal', hex: '#2a9d8f', label: 'Teal' },
              { name: '--brand-teal-deep', hex: '#1a6a63', label: 'Teal deep' },
              { name: '--brand-sun', hex: '#f4c842', label: 'Sun' },
              { name: '--brand-sand', hex: '#f3f0eb', label: 'Sand' },
            ].map(c => (
              <div key={c.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '14px', background: c.hex, border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} />
                <p style={{ fontSize: '12px', fontWeight: 600, color: darkBg ? 'rgba(255,255,255,0.7)' : '#1a1612', fontFamily: 'DM Sans,sans-serif' }}>{c.label}</p>
                <p style={{ fontSize: '11px', color: darkBg ? 'rgba(255,255,255,0.3)' : 'rgba(26,22,18,0.4)', fontFamily: 'monospace' }}>{c.hex}</p>
                <p style={{ fontSize: '10px', color: darkBg ? 'rgba(255,255,255,0.2)' : 'rgba(26,22,18,0.25)', fontFamily: 'monospace' }}>{c.name}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}

// ─── REPLAY BUTTON ────────────────────────────────────────────────────────────
function LogoReplay({ darkBg }: { darkBg: boolean }) {
  const [key, setKey] = useState(0)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
      <div key={key} style={{ background: darkBg ? 'rgba(255,255,255,0.04)' : 'white', padding: '20px 28px', borderRadius: '14px', border: `1px solid ${darkBg ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}` }}>
        <ThisWayLogo size="lg" variant={darkBg ? 'light' : 'dark'} animated />
      </div>
      <button
        onClick={() => setKey(k => k + 1)}
        style={{
          padding: '10px 20px', borderRadius: '100px',
          background: 'rgba(42,157,143,0.1)',
          border: '1px solid rgba(42,157,143,0.25)',
          color: '#1a7a6e', fontFamily: 'DM Sans,sans-serif',
          fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        ↻ Replay animation
      </button>
    </div>
  )
}
