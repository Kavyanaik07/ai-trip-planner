'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', INR: '₹', EUR: '€', GBP: '£',
  JPY: '¥', AUD: 'A$', CAD: 'C$', SGD: 'S$',
}

const CAT_CONFIG: Record<string, { mark: string; label: string; hue: string; bg: string }> = {
  food:          { mark: '◉', label: 'Dining',       hue: '#b85c35', bg: 'rgba(184,92,53,0.07)'  },
  attraction:    { mark: '◈', label: 'Attraction',   hue: '#2a9d8f', bg: 'rgba(42,157,143,0.07)' },
  accommodation: { mark: '◧', label: 'Stay',         hue: '#8a6a40', bg: 'rgba(138,106,64,0.07)' },
  transport:     { mark: '◎', label: 'Transit',      hue: '#4a7a8a', bg: 'rgba(74,122,138,0.07)' },
  photography:   { mark: '◉', label: 'Photography',  hue: '#7a52a0', bg: 'rgba(122,82,160,0.07)' },
  default:       { mark: '◆', label: 'Activity',     hue: '#2a9d8f', bg: 'rgba(42,157,143,0.07)' },
}

const toRoman = (n: number) => {
  const vals = [10,9,5,4,1]
  const syms = ['X','IX','V','IV','I']
  let result = ''
  vals.forEach((v,i) => { while (n >= v) { result += syms[i]; n -= v } })
  return result
}

function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', lineHeight: 1, userSelect: 'none' }}>
      <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 300, fontStyle: 'italic', fontSize: `${size}px`, color: '#1a1612', letterSpacing: '0.01em' }}>this</span>
      <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 300, fontStyle: 'italic', fontSize: `${size * 0.55}px`, color: '#2a9d8f', margin: `0 ${size * 0.06}px`, alignSelf: 'center' }}>·</span>
      <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 700, fontStyle: 'normal', fontSize: `${size}px`, color: '#1a1612', letterSpacing: '-0.02em' }}>Way</span>
    </span>
  )
}

export default function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trip, setTrip] = useState<any>(null)
  const [itinerary, setItinerary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState(0)
  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)
  const [regenerating, setRegenerate] = useState(false)
  const dayRefs = useRef<(HTMLDivElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && id) loadData()
  }, [status, id])

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const idx = dayRefs.current.findIndex(r => r === e.target)
            if (idx !== -1) setActiveDay(idx)
          }
        })
      },
      { threshold: 0.3, rootMargin: '-20% 0px -60% 0px' }
    )
    dayRefs.current.forEach(r => r && obs.observe(r))
    return () => obs.disconnect()
  }, [itinerary])

  const loadData = async () => {
    try {
      const { data: tripData } = await supabase.from('trips').select('*').eq('id', id).single()
      if (tripData) {
        setTrip({ ...tripData, startDate: tripData.start_date, endDate: tripData.end_date })
        const { data: itin } = await supabase.from('itineraries').select('*').eq('trip_id', id).single()
        if (itin) { setItinerary(itin); return }
      } else {
        const t = localStorage.getItem(`trip_${id}`)
        if (t) setTrip(JSON.parse(t))
      }
      const i = localStorage.getItem(`itinerary_${id}`)
      if (i) setItinerary(JSON.parse(i))
    } catch {
      const t = localStorage.getItem(`trip_${id}`)
      const i = localStorage.getItem(`itinerary_${id}`)
      if (t) setTrip(JSON.parse(t))
      if (i) setItinerary(JSON.parse(i))
    } finally {
      setLoading(false)
    }
  }

  const openEdit = () => {
    setEditForm({
      startDate: trip?.startDate || trip?.start_date || '',
      endDate: trip?.endDate || trip?.end_date || '',
      travelers: trip?.travelers || 1,
      budget: trip?.budget || '',
      currency: trip?.currency || 'USD',
      travelStyle: trip?.travel_style || trip?.travelStyle || 'balanced',
      interests: trip?.interests || [],
    })
    setEditModal(true)
  }

  const regenerate = async () => {
    if (!editForm || !trip) return
    setRegenerate(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'}/generate-itinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': 'abc123',
        },
        body: JSON.stringify({
          destination: trip.destination,
          startDate: editForm.startDate,
          endDate: editForm.endDate,
          travelers: Number(editForm.travelers),
          budget: editForm.budget ? Number(editForm.budget) : null,
          currency: editForm.currency,
          travelStyle: editForm.travelStyle,
          interests: editForm.interests,
          fromLocation: trip.from_location || trip.fromLocation || '',
          alreadyThere: trip.already_there || trip.alreadyThere || false,
          arrivalTime: trip.arrival_time || trip.arrivalTime || 'unknown',
          energyLevel: trip.energy_level || trip.energyLevel || 'medium',
        }),
      })
      const newItin = await res.json()
      if (newItin.error) throw new Error(newItin.error)

      // Save updated itinerary to supabase
      await supabase
        .from('itineraries')
        .upsert({ trip_id: id, ...newItin, updated_at: new Date().toISOString() })

      // Update trip dates/travelers if changed
      await supabase
        .from('trips')
        .update({
          start_date: editForm.startDate,
          end_date: editForm.endDate,
          travelers: Number(editForm.travelers),
          budget: editForm.budget ? Number(editForm.budget) : null,
          currency: editForm.currency,
        })
        .eq('id', id)

      setItinerary(newItin)
      setTrip((prev: any) => ({ ...prev, ...editForm, startDate: editForm.startDate, endDate: editForm.endDate }))
      setEditModal(false)
    } catch (err) {
      alert('Regeneration failed. Please try again.')
    } finally {
      setRegenerate(false)
    }
   }

  const scrollToDay = (i: number) => {
    dayRefs.current[i]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }
  

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf8f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '18px' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(42,157,143,0.15)', borderTopColor: '#2a9d8f', animation: 'spin 0.9s linear infinite' }} />
        <p style={{ fontFamily: "'DM Sans',sans-serif", color: 'rgba(26,22,18,0.32)', fontSize: '14px', fontWeight: 300 }}>
          Assembling your journey…
        </p>
      </div>
    )
  }

  const days = itinerary?.days || []
  const currency = itinerary?.currency || trip?.currency || 'USD'
  const sym = CURRENCY_SYMBOLS[currency] || '$'
  const destination = trip?.destination || ''
  const startDate = trip?.startDate || trip?.start_date || ''
  const endDate = trip?.endDate || trip?.end_date || ''
  const totalDays = days.length

  const fmt = (d: string) => {
    if (!d) return ''
    try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) }
    catch { return d }
  }

  const fmtFull = (d: string) => {
    if (!d) return ''
    try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }
    catch { return d }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4', color: '#1a1612', fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        :root {
          --canvas: #faf8f4;
          --ink: #1a1612;
          --teal: #2a9d8f;
          --teal-deep: #1a6a63;
          --muted: rgba(26,22,18,0.42);
          --faint: rgba(26,22,18,0.04);
          --border: rgba(26,22,18,0.08);
          --border-med: rgba(26,22,18,0.12);
        }

        html { scroll-behavior: smooth; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .bf { font-family: 'DM Sans', sans-serif; }
        .hf { font-family: 'Cormorant Garamond', Georgia, serif; }

        /* ── NAV ── */
        .nav-link {
          color: var(--muted); font-family: 'DM Sans', sans-serif; font-size: 13px;
          text-decoration: none; transition: color 0.2s;
          display: flex; align-items: center; gap: 6px; font-weight: 400;
        }
        .nav-link:hover { color: var(--ink); }

        /* ── SIDEBAR ── */
        .sidebar {
          position: fixed; left: 40px; top: 50%; transform: translateY(-50%);
          display: flex; flex-direction: column; gap: 0; z-index: 40;
        }
        .sidebar-item {
          display: flex; align-items: center; gap: 10px;
          padding: 7px 0; cursor: pointer; border: none; background: none;
        }
        .sidebar-dot {
          width: 6px; height: 6px; border-radius: 50%;
          border: 1px solid rgba(26,22,18,0.18);
          transition: all 0.3s ease; flex-shrink: 0;
        }
        .sidebar-item.active .sidebar-dot {
          background: var(--teal); border-color: var(--teal);
          box-shadow: 0 0 8px rgba(42,157,143,0.35);
          transform: scale(1.4);
        }
        .sidebar-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; letter-spacing: 0.05em;
          color: rgba(26,22,18,0.22); transition: color 0.3s; font-weight: 500;
        }
        .sidebar-item.active .sidebar-label { color: var(--teal); }
        .sidebar-connector {
          width: 1px; height: 22px; background: var(--border);
          margin: 0 0 0 2.5px;
        }

        /* ── HERO ENTRANCE ── */
        .hero-text {
          opacity: 0; transform: translateY(28px);
          animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

        /* ── DAY SECTION ── */
        .day-section {
          padding: 88px 0 72px;
          border-top: 1px solid var(--border);
          position: relative;
          scroll-margin-top: 80px;
        }

        /* Watermark wrapper — clips only vertically, breaks out of container padding */
        .day-ordinal-wrap {
          position: absolute; top: 52px; right: -48px;
          height: 155px; 
          overflow: hidden;
          pointer-events: none; user-select: none;
        }

        /* Watermark ordinal */
        .day-ordinal {
          font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 700;
          font-size: clamp(80px, 12vw, 150px);
          color: rgba(26,22,18,0.055);
          line-height: 1; letter-spacing: -0.04em;
          font-style: italic; display: block;
          padding-right: 48px;
        }

        /* ── ACTIVITY CARD ── */
        .act-card {
          border: 1px solid rgba(0,0,0,0.05); border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 1px 6px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04);
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
          overflow: hidden;
        }
        .act-card:hover {
          border-color: rgba(42,157,143,0.22);
          box-shadow: 0 4px 18px rgba(0,0,0,0.09);
          transform: translateY(-2px);
        }

        /* ── TIP CALLOUT ── */
        .tip-callout {
          padding: 12px 16px; border-radius: 10px;
          background: rgba(138,106,64,0.06);
          border-left: 2px solid rgba(138,106,64,0.25);
        }

        /* ── META PILL ── */
        .meta-pill {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 6px 14px; border-radius: 100px;
          border: 1px solid var(--border); background: white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          font-family: 'DM Sans', sans-serif; font-size: 12px;
          color: var(--muted); font-weight: 400;
        }

        /* ── CTA BUTTON ── */
        .cta-btn {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 14px 36px; border-radius: 100px;
          border: none; background: var(--ink); color: white;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
          cursor: pointer; text-decoration: none;
          box-shadow: 0 4px 18px rgba(0,0,0,0.14);
          transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease;
        }
        .cta-btn:hover {
          transform: scale(1.04) translateY(-2px);
          box-shadow: 0 14px 44px rgba(0,0,0,0.2);
        }
        .cta-arr { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .cta-btn:hover .cta-arr { transform: translateX(6px); }

        /* ── SCROLLBAR ── */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: var(--canvas); }
        ::-webkit-scrollbar-thumb { background: rgba(26,22,18,0.12); border-radius: 2px; }

        /* ── EDIT MODAL ── */
        .edit-overlay {
          position: fixed; inset: 0; z-index: 500;
          background: rgba(26,22,18,0.55); backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center; padding: 24px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .edit-box {
          background: white; border: 1px solid rgba(26,22,18,0.08);
          border-radius: 24px; padding: 40px; max-width: 520px; width: 100%;
          box-shadow: 0 40px 120px rgba(0,0,0,0.18);
          animation: slideUp 0.28s cubic-bezier(0.16,1,0.3,1);
          max-height: 90vh; overflow-y: auto;
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .edit-label {
          font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 500;
          letter-spacing: 0.09em; text-transform: uppercase;
          color: rgba(26,22,18,0.38); display: block; margin-bottom: 6px;
        }
        .edit-input {
          width: 100%; padding: 11px 14px; border-radius: 10px;
          border: 1px solid rgba(26,22,18,0.12); background: #faf8f4;
          font-family: 'DM Sans', sans-serif; font-size: 14px; color: #1a1612;
          outline: none; transition: border-color 0.2s;
        }
        .edit-input:focus { border-color: rgba(42,157,143,0.4); background: white; }
        .edit-select {
          width: 100%; padding: 11px 14px; border-radius: 10px;
          border: 1px solid rgba(26,22,18,0.12); background: #faf8f4;
          font-family: 'DM Sans', sans-serif; font-size: 14px; color: #1a1612;
          outline: none; cursor: pointer; appearance: none;
        }
        .regen-btn {
          width: 100%; padding: 14px; border-radius: 100px;
          background: #1a1612; border: none; color: white; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
          transition: opacity 0.2s, transform 0.2s;
        }
        .regen-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .regen-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .edit-cancel {
          width: 100%; padding: 12px; border-radius: 100px; margin-top: 8px;
          background: transparent; border: 1px solid rgba(26,22,18,0.1);
          color: rgba(26,22,18,0.45); cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 14px;
          transition: all 0.2s;
        }
        .edit-cancel:hover { background: rgba(26,22,18,0.04); color: rgba(26,22,18,0.7); }
        .trip-action-btn {
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
          color: rgba(26,22,18,0.45); background: none; border: 1px solid rgba(26,22,18,0.1);
          border-radius: 100px; padding: 7px 14px; cursor: pointer;
          transition: all 0.2s; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;
        }
        .trip-action-btn:hover { color: #1a1612; border-color: rgba(26,22,18,0.25); background: rgba(26,22,18,0.03); }

        @media (max-width: 768px) {
          .sidebar { display: none; }
          .act-row { flex-direction: column !important; gap: 8px !important; }
          .act-timeline { flex-direction: row !important; align-items: center !important; padding-top: 0 !important; }
          .act-timeline-connector { display: none !important; }
        }

        @media (max-width: 600px) {
          .day-ordinal { font-size: 72px !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        padding: '18px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(250,248,244,0.92)', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <Link href="/dashboard" className="nav-link">← Trips</Link>
        <Link href="/" style={{ textDecoration: 'none' }}><Wordmark size={22} /></Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="trip-action-btn" onClick={openEdit}>✎ Edit & regenerate</button>
          <Link href={`/trip/${id}/print`} target="_blank" className="trip-action-btn">↓ Export PDF</Link>
        </div>
      </nav>

      {/* ── EDIT MODAL ── */}
      {editModal && editForm && (
        <div className="edit-overlay" onClick={() => !regenerating && setEditModal(false)}>
          <div className="edit-box" onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: '28px' }}>
              <p className="bf" style={{ color: '#2a9d8f', fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Edit trip
              </p>
              <h3 className="hf" style={{ fontSize: '26px', fontWeight: 700, fontStyle: 'italic', color: '#1a1612', lineHeight: 1.1 }}>
                Regenerate {trip?.destination}
              </h3>
              <p className="bf" style={{ color: 'rgba(26,22,18,0.4)', fontSize: '13px', marginTop: '6px', lineHeight: 1.6 }}>
                Adjust any details below and we'll rebuild the itinerary from scratch.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '28px' }}>
              {/* Dates row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="edit-label">Start date</label>
                  <input type="date" className="edit-input" value={editForm.startDate}
                    onChange={e => setEditForm((f: any) => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="edit-label">End date</label>
                  <input type="date" className="edit-input" value={editForm.endDate}
                    onChange={e => setEditForm((f: any) => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>

              {/* Travelers + Budget row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="edit-label">Travelers</label>
                  <input type="number" min={1} max={50} className="edit-input" value={editForm.travelers}
                    onChange={e => setEditForm((f: any) => ({ ...f, travelers: e.target.value }))} />
                </div>
                <div>
                  <label className="edit-label">Budget</label>
                  <input type="number" min={0} className="edit-input" placeholder="Leave blank for flexible"
                    value={editForm.budget}
                    onChange={e => setEditForm((f: any) => ({ ...f, budget: e.target.value }))} />
                </div>
              </div>

              {/* Currency + Style row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="edit-label">Currency</label>
                  <select className="edit-select" value={editForm.currency}
                    onChange={e => setEditForm((f: any) => ({ ...f, currency: e.target.value }))}>
                    {['USD','INR','EUR','GBP','JPY','AUD','CAD','SGD'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="edit-label">Travel style</label>
                  <select className="edit-select" value={editForm.travelStyle}
                    onChange={e => setEditForm((f: any) => ({ ...f, travelStyle: e.target.value }))}>
                    <option value="relaxed">Relaxed</option>
                    <option value="balanced">Balanced</option>
                    <option value="intensive">Intensive</option>
                    <option value="budget">Budget</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
              </div>
            </div>

            <button className="regen-btn" onClick={regenerate} disabled={regenerating}>
              {regenerating ? '✦ Regenerating your itinerary…' : '✦ Regenerate itinerary'}
            </button>
            <button className="edit-cancel" onClick={() => setEditModal(false)} disabled={regenerating}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── SIDEBAR DAY NAVIGATOR ── */}
      {days.length > 0 && (
        <div className="sidebar">
          {days.map((_: any, i: number) => (
            <React.Fragment key={i}>
              <button
                className={`sidebar-item${activeDay === i ? ' active' : ''}`}
                onClick={() => scrollToDay(i)}
              >
                <div className="sidebar-dot" />
                <span className="sidebar-label">{i + 1}</span>
              </button>
              {i < days.length - 1 && <div className="sidebar-connector" />}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div ref={containerRef} style={{ maxWidth: '820px', margin: '0 auto', padding: '0 48px 120px', position: 'relative' }}>

        {/* ── HERO ── */}
        <div style={{ padding: '72px 0 52px' }}>
          <div className="hero-text">

            {/* Eyebrow */}
            <p className="bf" style={{
              color: 'rgba(26,22,18,0.3)', fontSize: '11px', fontWeight: 500,
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px',
            }}>
              Your itinerary
            </p>

            {/* Destination headline */}
            <h1 className="hf" style={{
              fontSize: 'clamp(56px,8vw,104px)', fontWeight: 700,
              color: '#1a1612', lineHeight: 0.92,
              letterSpacing: '-0.02em', marginBottom: '28px',
              fontStyle: 'italic', maxWidth: '680px',
            }}>
              {destination}
            </h1>

            {/* Summary */}
            {itinerary?.summary && (
              <p className="hf" style={{
                color: 'rgba(26,22,18,0.45)', fontSize: '20px',
                lineHeight: 1.75, fontWeight: 300, fontStyle: 'italic',
                maxWidth: '560px', marginBottom: '28px',
              }}>
                {itinerary.summary}
              </p>
            )}

            {/* Meta pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '48px', marginTop: '18px' }}>
              {startDate && (
                <span className="meta-pill">
                  <span style={{ color: '#2a9d8f', fontSize: '12px' }}>◈</span>
                  {fmt(startDate)} – {fmt(endDate)}
                </span>
              )}
              {totalDays > 0 && (
                <span className="meta-pill">
                  <span style={{ color: '#2a9d8f', fontSize: '12px' }}>◆</span>
                  {totalDays} {totalDays === 1 ? 'day' : 'days'}
                </span>
              )}
              {trip?.travelers && (
                <span className="meta-pill">
                  <span style={{ color: '#2a9d8f', fontSize: '12px' }}>◉</span>
                  {trip.travelers} traveler{trip.travelers !== 1 ? 's' : ''}
                </span>
              )}
              {trip?.budget && (
                <span className="meta-pill">
                  <span style={{ color: '#2a9d8f', fontSize: '12px' }}>◧</span>
                  {sym}{Number(trip.budget).toLocaleString()} {currency}
                </span>
              )}
              {itinerary?.estimated_cost > 0 && (
                <span className="meta-pill" style={{ borderColor: 'rgba(42,157,143,0.2)', color: '#2a9d8f' }}>
                  <span style={{ fontSize: '12px' }}>◎</span>
                  Est. {sym}{Number(itinerary.estimated_cost).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Teal rule */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(to right, #2a9d8f, rgba(42,157,143,0.15), transparent)',
          }} />
        </div>

        {/* ── DAYS ── */}
        {days.length > 0 ? (
          <>
            {days.map((day: any, di: number) => {
              const acts = day.activities || []
              const dayCost = acts.reduce((s: number, a: any) => s + (a.estimated_cost || 0), 0)

              return (
                <div
                  key={di}
                  className="day-section"
                  ref={el => { dayRefs.current[di] = el }}
                >
                  {/* Watermark — wrapper clips bottom so it never overlaps cards */}
                  <div className="day-ordinal-wrap">
                    <span className="day-ordinal">{toRoman(di + 1)}</span>
                  </div>

                  {/* Day header */}
                  <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                      <div>
                        <p className="bf" style={{
                          color: '#2a9d8f', fontSize: '11px', fontWeight: 500,
                          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px',
                        }}>
                          Day {di + 1}
                          {day.date && (
                            <span style={{ color: 'rgba(26,22,18,0.28)', fontWeight: 300, marginLeft: '10px', fontSize: '10px' }}>
                              {fmtFull(day.date)}
                            </span>
                          )}
                        </p>
                        <h2 className="hf" style={{
                          fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700,
                          color: '#1a1612', lineHeight: 1.05,
                          letterSpacing: '-0.015em', fontStyle: 'italic',
                        }}>
                          {day.theme}
                        </h2>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                        <span className="bf" style={{ color: 'rgba(26,22,18,0.28)', fontSize: '12px', fontWeight: 300 }}>
                          {acts.length} activit{acts.length !== 1 ? 'ies' : 'y'}
                        </span>
                        {dayCost > 0 && (
                          <span className="bf" style={{ color: '#2a9d8f', fontSize: '13px', fontWeight: 500 }}>
                            ~{sym}{dayCost.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── ACTIVITY LIST ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {acts.map((act: any, ai: number) => {
                      const cat = CAT_CONFIG[act.category] || CAT_CONFIG.default

                      return (
                        <div key={ai} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }} className="act-row">

                          {/* Timeline column */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: '18px' }} className="act-timeline">
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '50%',
                              border: `1.5px solid ${cat.hue}30`,
                              background: cat.bg,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              position: 'relative', zIndex: 1,
                            }}>
                              <span style={{ color: cat.hue, fontSize: '13px', lineHeight: 1 }}>{cat.mark}</span>
                            </div>
                            {ai < acts.length - 1 && (
                              <div className="act-timeline-connector" style={{ width: '1px', flex: 1, minHeight: '20px', background: `linear-gradient(to bottom, rgba(42,157,143,0.3), transparent)`, marginTop: '4px' }} />
                            )}
                          </div>

                          {/* Card */}
                          <div className="act-card" style={{ flex: 1 }}>
                            {/* Category color bar */}
                            <div style={{ height: '2px', background: `linear-gradient(90deg, ${cat.hue}50, transparent)` }} />

                            <div style={{ padding: '18px 22px' }}>
                              {/* Top row */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                {act.start_time && (
                                  <span className="bf" style={{
                                    color: cat.hue, fontSize: '12px', fontWeight: 500,
                                    letterSpacing: '0.04em',
                                  }}>
                                    {act.start_time}{act.end_time ? ` – ${act.end_time}` : ''}
                                  </span>
                                )}
                                <span style={{
                                  padding: '2px 10px', borderRadius: '100px',
                                  background: cat.bg, color: cat.hue,
                                  fontFamily: "'DM Sans',sans-serif", fontSize: '10px',
                                  fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
                                  border: `1px solid ${cat.hue}20`,
                                }}>
                                  {cat.label}
                                </span>
                              </div>

                              {/* Title */}
                              <h3 className="hf" style={{
                                fontSize: '19px', fontWeight: 700,
                                color: '#1a1612', lineHeight: 1.2,
                                marginBottom: act.location ? '5px' : '10px',
                                fontStyle: 'italic',
                              }}>
                                {act.title}
                              </h3>

                              {/* Location */}
                              {act.location && (
                                <p className="bf" style={{
                                  color: 'rgba(26,22,18,0.32)', fontSize: '12px',
                                  marginBottom: '12px', fontWeight: 300,
                                }}>
                                  {act.location}
                                </p>
                              )}

                              {/* Description */}
                              {act.description && (
                                <p className="bf" style={{
                                  color: 'rgba(26,22,18,0.55)', fontSize: '14px',
                                  lineHeight: 1.85, fontWeight: 300,
                                  marginBottom: act.tips ? '14px' : '0',
                                }}>
                                  {act.description}
                                </p>
                              )}

                              {/* Tip */}
                              {act.tips && (
                                <div className="tip-callout">
                                  <p className="bf" style={{
                                    color: 'rgba(138,106,64,0.85)', fontSize: '13px',
                                    lineHeight: 1.7, fontWeight: 300,
                                  }}>
                                    <span className="bf" style={{ fontWeight: 500, marginRight: '8px', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(138,106,64,0.65)' }}>Tip</span>
                                    {act.tips}
                                  </p>
                                </div>
                              )}

                              {/* Cost */}
                              {act.estimated_cost > 0 && (
                                <p className="bf" style={{
                                  color: 'rgba(26,22,18,0.38)', fontSize: '12px',
                                  marginTop: '12px', fontWeight: 400,
                                }}>
                                  ~{sym}{Number(act.estimated_cost).toLocaleString()} {currency}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* ── FINALE ── */}
            <div style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '80px', paddingBottom: '40px',
              textAlign: 'center', position: 'relative', overflow: 'hidden',
            }}>
              {/* Ghost destination watermark */}
              <p className="hf" style={{
                fontSize: 'clamp(48px,10vw,120px)', fontWeight: 700, fontStyle: 'italic',
                color: 'rgba(26,22,18,0.03)', lineHeight: 1,
                letterSpacing: '-0.03em', pointerEvents: 'none', userSelect: 'none',
                position: 'absolute', top: '64px', left: '50%', transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
              }}>
                {destination}
              </p>

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Teal rule divider */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '28px' }}>
                  <div style={{ width: '40px', height: '1px', background: 'rgba(42,157,143,0.35)' }} />
                  <span className="bf" style={{ color: '#2a9d8f', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500 }}>
                    {destination} awaits
                  </span>
                  <div style={{ width: '40px', height: '1px', background: 'rgba(42,157,143,0.35)' }} />
                </div>

                <h2 className="hf" style={{
                  fontSize: 'clamp(32px,5vw,58px)', fontWeight: 700, fontStyle: 'italic',
                  color: '#1a1612', lineHeight: 1.1, letterSpacing: '-0.015em',
                  marginBottom: '18px',
                }}>
                  Go have the trip of your life.
                </h2>

                <p className="hf" style={{
                  color: 'rgba(26,22,18,0.55)', fontSize: '18px', fontStyle: 'italic',
                  lineHeight: 1.8, maxWidth: '400px', margin: '0 auto 40px',
                  fontWeight: 300,
                }}>
                  {totalDays} days, every moment planned.
                  <br />The only thing left is to show up.
                </p>

                <Link href="/plan" className="cta-btn">
                  Plan another trip <span className="cta-arr">→</span>
                </Link>
              </div>
            </div>
          </>
        ) : (
          /* ── EMPTY STATE ── */
          <div style={{ paddingTop: '80px', textAlign: 'center' }}>
            <h2 className="hf" style={{ color: '#1a1612', fontSize: '36px', fontStyle: 'italic', fontWeight: 700, marginBottom: '14px' }}>
              No itinerary found
            </h2>
            <p className="bf" style={{ color: 'var(--muted)', fontSize: '15px', fontWeight: 300, marginBottom: '32px' }}>
              Something went wrong loading your trip.
            </p>
            <Link href="/plan" className="cta-btn">Start fresh →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
