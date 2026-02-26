'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Head from 'next/head'
import { supabase } from '@/lib/supabase'

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', INR: '₹', EUR: '€', GBP: '£',
  JPY: '¥', AUD: 'A$', CAD: 'C$', SGD: 'S$',
}

const CAT_LABELS: Record<string, string> = {
  food: 'Dining', attraction: 'Attraction', accommodation: 'Stay',
  transport: 'Transit', photography: 'Photography', default: 'Activity',
}

export default function TripPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trip, setTrip] = useState<any>(null)
  const [itinerary, setItinerary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [printed, setPrinted] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && id) loadData()
  }, [status, id])

  useEffect(() => {
    if (!loading && itinerary && !printed) {
      setPrinted(true)
      const dest = trip?.destination || 'Your Trip'
      document.title = `${dest} — thisWay`
      setTimeout(() => window.print(), 600)
    }
  }, [loading, itinerary, printed, trip])

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

  const fmt = (d: string) => {
    if (!d) return ''
    try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) }
    catch { return d }
  }

  const fmtShort = (d: string) => {
    if (!d) return ''
    try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }
    catch { return d }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', color: '#1a1612' }}>
        <p style={{ fontSize: '14px', color: 'rgba(26,22,18,0.4)' }}>Preparing your itinerary…</p>
      </div>
    )
  }

  const days = itinerary?.days || []
  const currency = itinerary?.currency || trip?.currency || 'USD'
  const sym = CURRENCY_SYMBOLS[currency] || '$'
  const destination = trip?.destination || ''
  const startDate = trip?.startDate || trip?.start_date || ''
  const endDate = trip?.endDate || trip?.end_date || ''

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,700&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: white;
          font-family: 'DM Sans', sans-serif;
          color: #1a1612;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .page {
          max-width: 780px;
          margin: 0 auto;
          padding: 60px 56px;
        }

        /* ── SCREEN-ONLY HEADER BAR ── */
        .screen-bar {
          background: #1a1612;
          color: white;
          padding: 14px 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
        }
        .print-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 22px; border-radius: 100px;
          background: #2a9d8f; color: white; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          transition: opacity 0.2s;
        }
        .print-btn:hover { opacity: 0.88; }
        .back-btn {
          color: rgba(255,255,255,0.6); text-decoration: none;
          font-size: 13px; display: flex; align-items: center; gap: 5px;
          transition: color 0.2s;
        }
        .back-btn:hover { color: white; }

        /* ── COVER ── */
        .cover { padding-bottom: 48px; border-bottom: 2px solid #1a1612; margin-bottom: 48px; }
        .cover-eyebrow {
          font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase; color: #2a9d8f;
          margin-bottom: 12px;
        }
        .cover-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 72px; font-weight: 700; font-style: italic;
          color: #1a1612; line-height: 0.9; letter-spacing: -0.02em;
          margin-bottom: 24px;
        }
        .cover-summary {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 18px; font-weight: 400; font-style: italic;
          color: rgba(26,22,18,0.48); line-height: 1.7;
          max-width: 540px; margin-bottom: 28px;
        }
        .cover-meta { display: flex; flex-wrap: wrap; gap: 24px; }
        .meta-item { display: flex; flex-direction: column; gap: 2px; }
        .meta-label {
          font-size: 9px; font-weight: 500; letter-spacing: 0.1em;
          text-transform: uppercase; color: rgba(26,22,18,0.35);
        }
        .meta-value { font-size: 14px; font-weight: 400; color: #1a1612; }

        /* ── TEAL ACCENT LINE ── */
        .teal-line {
          height: 2px;
          background: linear-gradient(to right, #2a9d8f, rgba(42,157,143,0.1), transparent);
          margin-bottom: 48px;
        }

        /* ── DAY HEADER ── */
        .day-block { margin-bottom: 40px; }
        .day-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500; letter-spacing: 0.12em;
          text-transform: uppercase; color: #2a9d8f; margin-bottom: 6px;
        }
        .day-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 36px; font-weight: 700; font-style: italic;
          color: #1a1612; line-height: 1.1; letter-spacing: -0.01em;
          margin-bottom: 4px;
        }
        .day-subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; color: rgba(26,22,18,0.35); font-weight: 300;
          margin-bottom: 20px;
        }

        /* ── ACTIVITY ── */
        .activity {
          border: 1px solid rgba(26,22,18,0.08);
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 10px;
          background: #faf8f4;
          page-break-inside: avoid;
        }
        .act-top {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 8px;
        }
        .act-time {
          font-size: 11px; font-weight: 500;
          color: #2a9d8f; letter-spacing: 0.04em;
        }
        .act-badge {
          font-size: 9px; font-weight: 500; letter-spacing: 0.07em;
          text-transform: uppercase; color: rgba(26,22,18,0.4);
          border: 1px solid rgba(26,22,18,0.1);
          padding: 2px 8px; border-radius: 100px;
        }
        .act-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 20px; font-weight: 700; font-style: italic;
          color: #1a1612; line-height: 1.2; margin-bottom: 3px;
        }
        .act-location {
          font-size: 11px; color: rgba(26,22,18,0.32);
          font-weight: 300; margin-bottom: 8px;
        }
        .act-desc {
          font-size: 13px; color: rgba(26,22,18,0.6);
          line-height: 1.75; font-weight: 300; margin-bottom: 8px;
        }
        .act-tip {
          background: rgba(138,106,64,0.07);
          border-left: 2px solid rgba(138,106,64,0.3);
          border-radius: 0 8px 8px 0;
          padding: 8px 12px; margin-top: 8px;
          font-size: 12px; color: rgba(138,106,64,0.85);
          line-height: 1.65; font-weight: 300;
        }
        .act-tip strong {
          font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase;
          margin-right: 6px; font-weight: 500;
        }
        .act-cost {
          font-size: 11px; color: rgba(26,22,18,0.35);
          font-weight: 400; margin-top: 8px;
        }

        /* ── DAY DIVIDER ── */
        .day-divider {
          border: none; border-top: 1px solid rgba(26,22,18,0.08);
          margin: 40px 0;
        }

        /* ── FOOTER ── */
        .doc-footer {
          margin-top: 60px; padding-top: 24px;
          border-top: 1px solid rgba(26,22,18,0.1);
          display: flex; justify-content: space-between; align-items: center;
        }
        .footer-brand {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 16px; font-style: italic; color: rgba(26,22,18,0.4);
          letter-spacing: 0.01em;
        }
        .footer-note {
          font-size: 11px; color: rgba(26,22,18,0.28); font-weight: 300;
        }

        /* ── PRINT STYLES ── */
        @media print {
          .screen-bar { display: none !important; }
          .page { padding: 40px 48px; max-width: 100%; }
          .cover-title { font-size: 56px; }
          .activity { background: #faf8f4 !important; }
          @page {
            size: A4;
            margin: 12mm 15mm;
          }
        }

        @media screen {
          .screen-bar { display: flex; }
        }
      `}</style>

      {/* ── SCREEN-ONLY TOP BAR ── */}
      <div className="screen-bar">
        <a href={`/trip/${id}`} className="back-btn">← Back to itinerary</a>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>thisWay · PDF Preview — {destination}</span>
        <button className="print-btn" onClick={() => window.print()}>
          ↓ Save as PDF
        </button>
      </div>

      {/* ── DOCUMENT ── */}
      <div className="page">

        {/* Cover */}
        <div className="cover">
          <p className="cover-eyebrow">thisWay · letsgo · Your Itinerary</p>
          <h1 className="cover-title">{destination}</h1>
          {itinerary?.summary && (
            <p className="cover-summary">{itinerary.summary}</p>
          )}
          <div className="cover-meta">
            {startDate && (
              <div className="meta-item">
                <span className="meta-label">Dates</span>
                <span className="meta-value">{fmt(startDate)} – {fmt(endDate)}</span>
              </div>
            )}
            {days.length > 0 && (
              <div className="meta-item">
                <span className="meta-label">Duration</span>
                <span className="meta-value">{days.length} day{days.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            {trip?.travelers && (
              <div className="meta-item">
                <span className="meta-label">Travelers</span>
                <span className="meta-value">{trip.travelers} person{trip.travelers !== 1 ? 's' : ''}</span>
              </div>
            )}
            {itinerary?.estimated_cost > 0 && (
              <div className="meta-item">
                <span className="meta-label">Est. Cost</span>
                <span className="meta-value">{sym}{Number(itinerary.estimated_cost).toLocaleString()} {currency}</span>
              </div>
            )}
          </div>
        </div>

        <div className="teal-line" />

        {/* Days */}
        {days.map((day: any, di: number) => {
          const acts = day.activities || []
          const dayCost = acts.reduce((s: number, a: any) => s + (a.estimated_cost || 0), 0)

          return (
            <div key={di} className="day-block">
              {/* Day header */}
              <p className="day-label">
                Day {di + 1}{day.date ? ` · ${fmtShort(day.date)}` : ''}
                {dayCost > 0 && ` · ~${sym}${dayCost.toLocaleString()} ${currency}`}
              </p>
              <h2 className="day-title">{day.theme}</h2>
              <p className="day-subtitle">{acts.length} activit{acts.length !== 1 ? 'ies' : 'y'}</p>

              {/* Activities */}
              {acts.map((act: any, ai: number) => (
                <div key={ai} className="activity">
                  <div className="act-top">
                    {act.start_time && (
                      <span className="act-time">
                        {act.start_time}{act.end_time ? ` – ${act.end_time}` : ''}
                      </span>
                    )}
                    <span className="act-badge">
                      {CAT_LABELS[act.category] || CAT_LABELS.default}
                    </span>
                  </div>

                  <h3 className="act-title">{act.title}</h3>

                  {act.location && (
                    <p className="act-location">{act.location}</p>
                  )}

                  {act.description && (
                    <p className="act-desc">{act.description}</p>
                  )}

                  {act.tips && (
                    <div className="act-tip">
                      <strong>Tip</strong>{act.tips}
                    </div>
                  )}

                  {act.estimated_cost > 0 && (
                    <p className="act-cost">~{sym}{Number(act.estimated_cost).toLocaleString()} {currency}</p>
                  )}
                </div>
              ))}

              {di < days.length - 1 && <hr className="day-divider" />}
            </div>
          )
        })}

        {/* Footer */}
        <div className="doc-footer">
          <span className="footer-brand">thisWay · letsgo</span>
          <span className="footer-note">thiswayletsgo.com · Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>
    </>
  )
}
