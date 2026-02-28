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

const DAY_COLORS = ['#2a9d8f','#e76f51','#f4a261','#264653','#a78bfa','#457b9d','#e9c46a','#06b6d4','#84cc16']

const toRoman = (n: number) => {
  const vals = [10,9,5,4,1]
  const syms = ['X','IX','V','IV','I']
  let result = ''
  vals.forEach((v,i) => { while (n >= v) { result += syms[i]; n -= v } })
  return result
}

// ── Rate-limit helper: Nominatim allows max 1 request/second ─────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', lineHeight: 1, userSelect: 'none' }}>
      <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 300, fontStyle: 'italic', fontSize: `${size}px`, color: '#1a1612', letterSpacing: '0.01em' }}>this</span>
      <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 300, fontStyle: 'italic', fontSize: `${size * 0.55}px`, color: '#2a9d8f', margin: `0 ${size * 0.06}px`, alignSelf: 'center' }}>·</span>
      <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 700, fontStyle: 'normal', fontSize: `${size}px`, color: '#1a1612', letterSpacing: '-0.02em' }}>Way</span>
    </span>
  )
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ fontWeight: 600, color: '#1a1612' }}>{part.slice(2, -2)}</strong>
    return <span key={i}>{part}</span>
  })
}

function formatChatMessage(text: string): React.ReactNode {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^\s*[\*\-]\s+/.test(line)) {
      const bullets: string[] = []
      while (i < lines.length && /^\s*[\*\-]\s+/.test(lines[i]))
        bullets.push(lines[i++].replace(/^\s*[\*\-]\s+/, '').trim())
      elements.push(
        <div key={`b${i}`} style={{ display: 'flex', flexDirection: 'column', gap: '5px', margin: '4px 0' }}>
          {bullets.map((b, bi) => (
            <div key={bi} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ color: '#2a9d8f', flexShrink: 0, fontWeight: 700, lineHeight: '1.6', fontSize: '15px' }}>·</span>
              <span style={{ lineHeight: '1.6' }}>{renderInline(b)}</span>
            </div>
          ))}
        </div>
      )
    } else if (line.trim() === '') {
      elements.push(<div key={`g${i++}`} style={{ height: '6px' }} />)
    } else {
      elements.push(<div key={`l${i++}`} style={{ lineHeight: '1.65' }}>{renderInline(line)}</div>)
    }
  }
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>{elements}</div>
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
  const [reviewModal, setReviewModal] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewDone, setReviewDone] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [regenerating, setRegenerate] = useState(false)
  const dayRefs = useRef<(HTMLDivElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Map state ─────────────────────────────────────────────────────────────
  const [mapOpen, setMapOpen] = useState(false)
  const [mapDay, setMapDay] = useState(0)
  const [geocoding, setGeocoding] = useState(false)
  const mapDivRef = useRef<HTMLDivElement>(null)
  const lMapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const polylineRef = useRef<any>(null)
  const geocacheRef = useRef<Record<string, { lat: number; lng: number }>>({})

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && id) loadData()
  }, [status, id])

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = dayRefs.current.findIndex(r => r === e.target)
          if (idx !== -1) setActiveDay(idx)
        }
      }),
      { threshold: 0.3, rootMargin: '-20% 0px -60% 0px' }
    )
    dayRefs.current.forEach(r => r && obs.observe(r))
    return () => obs.disconnect()
  }, [itinerary])

  // ── Init Leaflet map when panel opens ─────────────────────────────────────
  useEffect(() => {
    if (!mapOpen) return
    let cancelled = false

    async function init() {
      const L = (await import('leaflet')).default

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (cancelled || !mapDivRef.current) return

      if (!lMapRef.current) {
        lMapRef.current = L.map(mapDivRef.current, {
          zoomControl: true,
          scrollWheelZoom: true,
        })
        // Voyager tiles: shows place names, roads and landmarks at all zoom levels
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '© <a href="https://carto.com/">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(lMapRef.current)
      }

      await plotDay(mapDay)
    }

    init().catch(console.error)
    return () => { cancelled = true }
  }, [mapOpen])

  // ── Re-plot when day tab changes ──────────────────────────────────────────
  useEffect(() => {
    if (!mapOpen || !lMapRef.current) return
    plotDay(mapDay)
  }, [mapDay])

  // ── geocodeQuery: single Nominatim request returning [lat,lng] or null ──────
  const geocodeQuery = async (query: string): Promise<[number,number] | null> => {
    if (geocacheRef.current[query]) {
      const c = geocacheRef.current[query]
      return [c.lat, c.lng]
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'thisWay-travel-planner/1.0' } }
      )
      const data = await res.json()
      if (data?.[0]) {
        const pos = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
        geocacheRef.current[query] = pos
        return [pos.lat, pos.lng]
      }
    } catch { /* ignore */ }
    return null
  }

  // ── cleanLocation: strip AI verbosity so Nominatim can find the place ────────
  // e.g. "Departing from Broome Airport (BME) and Hotel" → "Broome Airport"
  //      "Town Beach or Chinatown, Broome"               → "Town Beach, Broome"
  //      "Broome Town to Broome Airport"                 → "Broome Airport"
  const cleanLocation = (raw: string): string[] => {
    let s = raw.trim()

    // Extract airport codes like "(BME)" — try them as queries too
    const airportCode = s.match(/\(([A-Z]{3})\)/)

    // If "X to Y" pattern, take Y (the destination)
    if (/ to /i.test(s)) s = s.split(/ to /i).pop()!.trim()

    // If "X or Y" pattern, take X (the first/primary)
    if (/ or /i.test(s)) s = s.split(/ or /i)[0].trim()

    // If "X and Y" pattern, take X (the first/primary)
    if (/ and /i.test(s)) s = s.split(/ and /i)[0].trim()

    // Strip leading "Departing from", "Starting at", "Located at", "At ", etc.
    s = s.replace(/^(departing from|starting at|located at|departs from|at |from )/i, '').trim()

    // Strip parenthetical codes like "(BME)", "(WA)"
    s = s.replace(/\([A-Z]{2,4}\)/g, '').trim()

    // Strip trailing/leading commas and spaces
    s = s.replace(/^,+|,+$/g, '').trim()

    const results = [s]
    // Also try airport code alone if found
    if (airportCode) results.push(airportCode[1] + ' Airport')

    return results.filter(r => r.length > 2)
  }

  const plotDay = async (dayIdx: number) => {
    if (!lMapRef.current) return
    const L = (await import('leaflet')).default

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null }

    const days = itinerary?.days || []
    const acts: any[] = days[dayIdx]?.activities || []
    if (!acts.length) return

    setGeocoding(true)
    const dest = trip?.destination || ''
    const color = DAY_COLORS[dayIdx % DAY_COLORS.length]

    // ── Step 1: get destination bounding box so we can reject off-map results ──
    let destCenter: [number,number] | null = null
    const destPos = await geocodeQuery(dest)
    if (destPos) destCenter = destPos

    const isNearDest = (lat: number, lng: number) => {
      if (!destCenter) return true // can't validate, allow it
      const dlat = Math.abs(lat - destCenter[0])
      const dlng = Math.abs(lng - destCenter[1])
      return dlat < 5 && dlng < 5 // within ~500km — rejects results in wrong country
    }

    // ── Step 2: debug log so we can see what the AI gave us ──────────────────
    console.log('[thisWay map] activities for day', dayIdx + 1, acts.map((a:any) => ({
      title: a.title, location: a.location
    })))

    // ── Step 3: geocode each activity with multiple query strategies ──────────
    // Strategy: location field → "title, dest" → "title" alone
    // Each strategy is tried before moving to the next activity
    const plotItems: { pos: [number, number]; act: any }[] = []
    let reqCount = 0

    for (let i = 0; i < acts.length; i++) {
      const act = acts[i]
      const queries: string[] = []

      if (act.location?.trim()) {
        // Generate cleaned variants of the location string
        const cleaned = cleanLocation(act.location)
        for (const c of cleaned) {
          queries.push(`${c}, ${dest}`)   // cleaned + city
          queries.push(c)                  // cleaned alone
        }
        queries.push(`${act.location.trim()}, ${dest}`)  // raw fallback
      }
      if (act.title?.trim()) queries.push(`${act.title.trim()}, ${dest}`)

      let found: [number,number] | null = null

      for (const q of queries) {
        const cached = geocacheRef.current[q]
        if (cached) {
          if (isNearDest(cached.lat, cached.lng)) { found = [cached.lat, cached.lng]; break }
          continue
        }
        if (reqCount > 0) await sleep(1100)
        reqCount++
        const pos = await geocodeQuery(q)
        if (pos && isNearDest(pos[0], pos[1])) { found = pos; break }
        await sleep(300) // small pause between strategies
      }

      if (found) plotItems.push({ pos: found, act })
    }

    console.log('[thisWay map] plotItems:', plotItems.length, 'of', acts.length, 'geocoded')
    setGeocoding(false)

    // ── If nothing geocoded, just centre on destination ───────────────────────
    if (!plotItems.length) {
      if (destCenter && lMapRef.current) {
        lMapRef.current.setView(destCenter, 12)
        setTimeout(() => lMapRef.current?.invalidateSize(), 150)
      }
      return
    }

    if (!lMapRef.current) return

    // ── Place numbered circle markers ─────────────────────────────────────────
    plotItems.forEach(({ pos, act }, i) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-family:sans-serif;font-size:13px;font-weight:700;border:2.5px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.28);">${i + 1}</div>`,
        iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -18],
      })
      const marker = L.marker(pos, { icon })
        .addTo(lMapRef.current!)
        .bindPopup(`
          <div style="font-family:'DM Sans',sans-serif;padding:4px 2px;min-width:160px;max-width:220px">
            <p style="font-size:13px;font-weight:600;color:#1a1612;margin:0 0 5px;line-height:1.3">${act.title}</p>
            ${act.start_time ? `<p style="font-size:11px;color:${color};margin:0 0 3px;font-weight:500">${act.start_time}${act.end_time ? ' – ' + act.end_time : ''}</p>` : ''}
            ${act.location ? `<p style="font-size:11px;color:rgba(26,22,18,0.45);margin:0">${act.location}</p>` : ''}
          </div>`, { maxWidth: 240 })
      markersRef.current.push(marker)
    })

    // ── Route polyline ────────────────────────────────────────────────────────
    const allPos = plotItems.map(p => p.pos)
    if (allPos.length > 1) {
      polylineRef.current = L.polyline(allPos, {
        color, weight: 2.5, opacity: 0.65, dashArray: '7, 7',
      }).addTo(lMapRef.current)
    }

    // ── Fit bounds ────────────────────────────────────────────────────────────
    if (allPos.length === 1) {
      lMapRef.current.setView(allPos[0], 15)
    } else {
      lMapRef.current.fitBounds(L.latLngBounds(allPos), { padding: [64, 64] })
    }
    setTimeout(() => lMapRef.current?.invalidateSize(), 150)
  }

  const openMap = (dayIdx?: number) => {
    setMapDay(dayIdx !== undefined ? dayIdx : activeDay)
    setMapOpen(true)
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  const loadData = async () => {
    try {
      const { data: tripData } = await supabase.from('trips').select('*').eq('id', id).maybeSingle()
      if (tripData) {
        setTrip({ ...tripData, startDate: tripData.start_date, endDate: tripData.end_date })
        const { data: itin } = await supabase.from('itineraries').select('*').eq('trip_id', id).maybeSingle()
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
      const res = await fetch(`/api/trips/${id}/itinerary/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      await supabase.from('itineraries').upsert({ trip_id: id, ...newItin, updated_at: new Date().toISOString() })
      await supabase.from('trips').update({
        start_date: editForm.startDate, end_date: editForm.endDate,
        travelers: Number(editForm.travelers),
        budget: editForm.budget ? Number(editForm.budget) : null,
        currency: editForm.currency,
      }).eq('id', id)
      setItinerary(newItin)
      setTrip((prev: any) => ({ ...prev, ...editForm, startDate: editForm.startDate, endDate: editForm.endDate }))
      geocacheRef.current = {}
      if (lMapRef.current) { lMapRef.current.remove(); lMapRef.current = null }
      setEditModal(false)
    } catch {
      alert('Regeneration failed. Please try again.')
    } finally {
      setRegenerate(false)
    }
  }

  const submitReview = async () => {
    if (!session?.user || !reviewText.trim() || reviewText.trim().length < 10) return
    setReviewSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: session.user.name, user_email: session.user.email,
          user_image: session.user.image, destination: trip?.destination || '',
          review_text: reviewText.trim(), rating: reviewRating, trip_id: id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setReviewDone(true)
    } catch (err: any) {
      alert(err.message || 'Could not submit review')
    } finally {
      setReviewSubmitting(false)
    }
  }

  const sendChat = async () => {
    const msg = chatInput.trim()
    if (!msg || chatLoading) return
    const newMessages = [...chatMessages, { role: 'user' as const, content: msg }]
    setChatMessages(newMessages)
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await fetch(`/api/trips/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          trip_context: {
            destination: trip?.destination || '',
            startDate: trip?.startDate || trip?.start_date || '',
            endDate: trip?.endDate || trip?.end_date || '',
            travelers: trip?.travelers || 1,
            currency: trip?.currency || 'USD',
          },
          current_itinerary: itinerary,
          history: chatMessages.slice(-10),
        }),
      })
      const data = await res.json()
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.response || 'Sorry, something went wrong.' }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Could not connect. Make sure the AI service is running.' }])
    } finally {
      setChatLoading(false)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  const scrollToDay = (i: number) => dayRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf8f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '18px' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(42,157,143,0.15)', borderTopColor: '#2a9d8f', animation: 'spin 0.9s linear infinite' }} />
        <p style={{ fontFamily: "'DM Sans',sans-serif", color: 'rgba(26,22,18,0.32)', fontSize: '14px', fontWeight: 300 }}>Assembling your journey…</p>
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
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        :root {
          --canvas: #faf8f4; --ink: #1a1612; --teal: #2a9d8f; --teal-deep: #1a6a63;
          --muted: rgba(26,22,18,0.42); --border: rgba(26,22,18,0.08);
        }
        html { scroll-behavior: smooth; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .bf { font-family: 'DM Sans', sans-serif; }
        .hf { font-family: 'Cormorant Garamond', Georgia, serif; }
        .nav-link { color: var(--muted); font-family: 'DM Sans', sans-serif; font-size: 13px; text-decoration: none; transition: color 0.2s; display: flex; align-items: center; gap: 6px; font-weight: 400; }
        .nav-link:hover { color: var(--ink); }
        .sidebar { position: fixed; left: 40px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 0; z-index: 40; }
        .sidebar-item { display: flex; align-items: center; gap: 10px; padding: 7px 0; cursor: pointer; border: none; background: none; }
        .sidebar-dot { width: 6px; height: 6px; border-radius: 50%; border: 1px solid rgba(26,22,18,0.18); transition: all 0.3s ease; flex-shrink: 0; }
        .sidebar-item.active .sidebar-dot { background: var(--teal); border-color: var(--teal); box-shadow: 0 0 8px rgba(42,157,143,0.35); transform: scale(1.4); }
        .sidebar-label { font-family: 'DM Sans', sans-serif; font-size: 11px; letter-spacing: 0.05em; color: rgba(26,22,18,0.22); transition: color 0.3s; font-weight: 500; }
        .sidebar-item.active .sidebar-label { color: var(--teal); }
        .sidebar-connector { width: 1px; height: 22px; background: var(--border); margin: 0 0 0 2.5px; }
        .hero-text { opacity: 0; transform: translateY(28px); animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        .day-section { padding: 88px 0 72px; border-top: 1px solid var(--border); position: relative; scroll-margin-top: 80px; }
        .day-ordinal-wrap { position: absolute; top: 52px; right: -48px; height: 155px; overflow: hidden; pointer-events: none; user-select: none; }
        .day-ordinal { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 700; font-size: clamp(80px,12vw,150px); color: rgba(26,22,18,0.055); line-height: 1; letter-spacing: -0.04em; font-style: italic; display: block; padding-right: 48px; }
        .act-card { border: 1px solid rgba(0,0,0,0.05); border-radius: 18px; background: #fff; box-shadow: 0 1px 6px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04); transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease; overflow: hidden; }
        .act-card:hover { border-color: rgba(42,157,143,0.22); box-shadow: 0 4px 18px rgba(0,0,0,0.09); transform: translateY(-2px); }
        .tip-callout { padding: 12px 16px; border-radius: 10px; background: rgba(138,106,64,0.06); border-left: 2px solid rgba(138,106,64,0.25); }
        .meta-pill { display: inline-flex; align-items: center; gap: 7px; padding: 6px 14px; border-radius: 100px; border: 1px solid var(--border); background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.04); font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--muted); font-weight: 400; }
        .cta-btn { display: inline-flex; align-items: center; gap: 10px; padding: 14px 36px; border-radius: 100px; border: none; background: var(--ink); color: white; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; text-decoration: none; box-shadow: 0 4px 18px rgba(0,0,0,0.14); transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease; }
        .cta-btn:hover { transform: scale(1.04) translateY(-2px); box-shadow: 0 14px 44px rgba(0,0,0,0.2); }
        .cta-arr { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .cta-btn:hover .cta-arr { transform: translateX(6px); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: var(--canvas); }
        ::-webkit-scrollbar-thumb { background: rgba(26,22,18,0.12); border-radius: 2px; }
        .edit-overlay { position: fixed; inset: 0; z-index: 500; background: rgba(26,22,18,0.55); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; padding: 24px; animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .edit-box { background: white; border: 1px solid rgba(26,22,18,0.08); border-radius: 24px; padding: 40px; max-width: 520px; width: 100%; box-shadow: 0 40px 120px rgba(0,0,0,0.18); animation: slideUp 0.28s cubic-bezier(0.16,1,0.3,1); max-height: 90vh; overflow-y: auto; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .edit-label { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; color: rgba(26,22,18,0.38); display: block; margin-bottom: 6px; }
        .edit-input { width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid rgba(26,22,18,0.12); background: #faf8f4; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #1a1612; outline: none; transition: border-color 0.2s; }
        .edit-input:focus { border-color: rgba(42,157,143,0.4); background: white; }
        .edit-select { width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid rgba(26,22,18,0.12); background: #faf8f4; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #1a1612; outline: none; cursor: pointer; appearance: none; }
        .regen-btn { width: 100%; padding: 14px; border-radius: 100px; background: #1a1612; border: none; color: white; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; transition: opacity 0.2s, transform 0.2s; }
        .regen-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .regen-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .edit-cancel { width: 100%; padding: 12px; border-radius: 100px; margin-top: 8px; background: transparent; border: 1px solid rgba(26,22,18,0.1); color: rgba(26,22,18,0.45); cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 14px; transition: all 0.2s; }
        .edit-cancel:hover { background: rgba(26,22,18,0.04); color: rgba(26,22,18,0.7); }
        .chat-bubble { position: fixed; bottom: 28px; right: 28px; z-index: 150; width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg,#2a9d8f,#1a6a63); border: none; cursor: pointer; box-shadow: 0 8px 28px rgba(42,157,143,0.38); display: flex; align-items: center; justify-content: center; transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease; color: white; }
        .chat-bubble:hover { transform: scale(1.12); box-shadow: 0 12px 36px rgba(42,157,143,0.45); }
        .chat-panel { position: fixed; bottom: 92px; right: 28px; z-index: 150; width: 360px; background: white; border-radius: 20px; box-shadow: 0 24px 64px rgba(0,0,0,0.18); display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgba(0,0,0,0.07); }
        .chat-msg-user { align-self: flex-end; background: linear-gradient(135deg,#2a9d8f,#1a6a63); color: white; border-radius: 16px 16px 4px 16px; padding: 10px 14px; max-width: 80%; font-family: 'DM Sans',sans-serif; font-size: 13px; line-height: 1.6; }
        .chat-msg-ai { align-self: flex-start; background: #f3f0eb; color: #1a1612; border-radius: 16px 16px 16px 4px; padding: 10px 14px; max-width: 85%; font-family: 'DM Sans',sans-serif; font-size: 13px; line-height: 1.6; }
        .chat-input { flex: 1; border: none; outline: none; font-family: 'DM Sans',sans-serif; font-size: 14px; color: #1a1612; background: transparent; padding: 0; }
        .chat-input::placeholder { color: rgba(26,22,18,0.3); }
        @keyframes chatIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .chat-anim { animation: chatIn 0.2s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .trip-action-btn { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; color: rgba(26,22,18,0.45); background: none; border: 1px solid rgba(26,22,18,0.1); border-radius: 100px; padding: 7px 14px; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-flex; align-items: center; gap: 5px; }
        .trip-action-btn:hover { color: #1a1612; border-color: rgba(26,22,18,0.25); background: rgba(26,22,18,0.03); }
        .trip-action-btn.active { background: #1a1612; color: white; border-color: #1a1612; }
        .trip-action-btn.active:hover { background: #2a2a20; }
        .map-panel { background: white; border-bottom: 1px solid var(--border); animation: slideDown 0.3s cubic-bezier(0.16,1,0.3,1); }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        .map-day-tab { padding: 7px 16px; border-radius: 100px; border: 1px solid rgba(26,22,18,0.1); background: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; color: rgba(26,22,18,0.5); transition: all 0.18s; white-space: nowrap; }
        .map-day-tab:hover { border-color: rgba(26,22,18,0.2); color: #1a1612; }
        .map-day-tab.active { color: white; border-color: transparent; }
        .leaflet-popup-content-wrapper { border-radius: 12px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.12) !important; padding: 0 !important; border: 1px solid rgba(0,0,0,0.06) !important; }
        .leaflet-popup-content { margin: 10px 14px !important; }
        .leaflet-popup-tip-container { display: none !important; }
        .leaflet-control-attribution { font-size: 9px !important; }
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .act-row { flex-direction: column !important; gap: 8px !important; }
          .act-timeline { flex-direction: row !important; align-items: center !important; padding-top: 0 !important; }
          .act-timeline-connector { display: none !important; }
          .map-tabs-bar { padding: 10px 16px !important; }
        }
        @media (max-width: 600px) { .day-ordinal { font-size: 72px !important; } }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, padding: '18px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(250,248,244,0.92)', backdropFilter: 'blur(24px)', borderBottom: '1px solid var(--border)' }}>
        <Link href="/dashboard" className="nav-link">← Trips</Link>
        <Link href="/" style={{ textDecoration: 'none' }}><Wordmark size={22} /></Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className={`trip-action-btn${mapOpen ? ' active' : ''}`} onClick={() => mapOpen ? setMapOpen(false) : openMap()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
              <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
            </svg>
            {mapOpen ? 'Close map' : 'Map view'}
          </button>
          <button className="trip-action-btn" onClick={openEdit}>✎ Edit & regenerate</button>
          <Link href={`/trip/${id}/print`} target="_blank" className="trip-action-btn">↓ Export PDF</Link>
          <button className="trip-action-btn" onClick={() => { setReviewModal(true); setReviewDone(false) }} style={{ color: '#2a9d8f', borderColor: 'rgba(42,157,143,0.3)' }}>★ Leave a review</button>
        </div>
      </nav>

      {/* ── MAP PANEL ── */}
      {mapOpen && days.length > 0 && (
        <div className="map-panel">
          <div className="map-tabs-bar" style={{ padding: '12px 48px', borderBottom: '1px solid rgba(26,22,18,0.06)', display: 'flex', gap: '6px', overflowX: 'auto', alignItems: 'center' }}>
            {days.map((day: any, i: number) => (
              <button
                key={i}
                className={`map-day-tab${mapDay === i ? ' active' : ''}`}
                style={mapDay === i ? { background: DAY_COLORS[i % DAY_COLORS.length] } : {}}
                onClick={() => setMapDay(i)}
              >
                Day {i + 1}
                {day.theme && <span style={{ opacity: 0.7, marginLeft: '5px', fontWeight: 400 }}>· {day.theme.substring(0, 22)}{day.theme.length > 22 ? '…' : ''}</span>}
              </button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {geocoding && (
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '11px', color: '#2a9d8f', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', border: '1.5px solid rgba(42,157,143,0.2)', borderTopColor: '#2a9d8f', animation: 'spin 0.8s linear infinite' }} />
                  Locating stops…
                </span>
              )}
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '11px', color: 'rgba(26,22,18,0.3)' }}>
                {days[mapDay]?.activities?.length || 0} stops
              </span>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div ref={mapDivRef} style={{ height: '480px', width: '100%', zIndex: 0 }} />
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', zIndex: 1000, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.06)', fontFamily: "'DM Sans',sans-serif", fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '5px', maxWidth: '200px' }}>
              {(days[mapDay]?.activities || []).slice(0, 6).map((act: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'rgba(26,22,18,0.7)' }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, background: DAY_COLORS[mapDay % DAY_COLORS.length], color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700' }}>{i + 1}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.title}</span>
                </div>
              ))}
              {(days[mapDay]?.activities?.length || 0) > 6 && (
                <span style={{ color: 'rgba(26,22,18,0.35)', fontSize: '10px', paddingLeft: '25px' }}>+{(days[mapDay]?.activities?.length || 0) - 6} more</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CHAT BUBBLE ── */}
      <button className="chat-bubble" onClick={() => setChatOpen(o => !o)} title="Ask about your trip">
        {chatOpen
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        }
        {!chatOpen && chatMessages.length === 0 && (
          <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', border: '2px solid white' }} />
        )}
      </button>

      {/* ── CHAT PANEL ── */}
      {chatOpen && (
        <div className="chat-panel">
          <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg,#2a9d8f,#1a6a63)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>✦</div>
            <div>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '14px', fontWeight: 600, color: 'white', margin: 0 }}>Trip Assistant</p>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{trip?.destination?.split(',')[0]}</p>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '200px', maxHeight: '340px' }}>
            {chatMessages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: 'rgba(26,22,18,0.4)', marginBottom: '12px' }}>Ask anything about your trip</p>
                {['Best local food to try?', 'What to pack?', 'Hidden gems nearby?'].map(q => (
                  <button key={q} onClick={() => setChatInput(q)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', marginBottom: '6px', background: 'rgba(42,157,143,0.06)', border: '1px solid rgba(42,157,143,0.15)', borderRadius: '10px', fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#2a9d8f', cursor: 'pointer' }}>{q}</button>
                ))}
              </div>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className={`${m.role === 'user' ? 'chat-msg-user' : 'chat-msg-ai'} chat-anim`}>
                {m.role === 'assistant' ? formatChatMessage(m.content) : m.content}
              </div>
            ))}
            {chatLoading && (
              <div className="chat-msg-ai chat-anim" style={{ display: 'flex', gap: '5px', alignItems: 'center', padding: '12px 14px' }}>
                {[0,1,2].map(i => <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(26,22,18,0.25)', display: 'inline-block', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: '8px', background: '#faf8f4' }}>
            <input className="chat-input" placeholder="Ask about your trip…" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }} />
            <button onClick={sendChat} disabled={!chatInput.trim() || chatLoading} style={{ width: '34px', height: '34px', borderRadius: '50%', background: chatInput.trim() ? '#1a1612' : 'rgba(26,22,18,0.1)', border: 'none', cursor: chatInput.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.18s' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={chatInput.trim() ? 'white' : 'rgba(26,22,18,0.3)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* ── REVIEW MODAL ── */}
      {reviewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '36px', maxWidth: '460px', width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }}>
            {reviewDone ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '24px', fontWeight: 700, color: '#1a1612', marginBottom: '8px' }}>Thank you!</h3>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '14px', color: 'rgba(26,22,18,0.5)', marginBottom: '24px' }}>Your review helps other travellers plan better trips.</p>
                <button onClick={() => setReviewModal(false)} style={{ padding: '11px 28px', background: '#1a1612', color: 'white', border: 'none', borderRadius: '100px', fontFamily: "'DM Sans',sans-serif", fontSize: '14px', cursor: 'pointer' }}>Close</button>
              </div>
            ) : (
              <>
                <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '22px', fontWeight: 700, color: '#1a1612', marginBottom: '4px' }}>How was your trip to {trip?.destination?.split(',')[0]}?</h3>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '13px', color: 'rgba(26,22,18,0.45)', marginBottom: '24px' }}>Your honest review helps others plan better.</p>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(26,22,18,0.4)', marginBottom: '8px' }}>Rating</p>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
                  {[1,2,3,4,5].map(star => (
                    <button key={star} onClick={() => setReviewRating(star)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '28px', color: star <= reviewRating ? '#f59e0b' : 'rgba(26,22,18,0.15)', transition: 'color 0.15s, transform 0.15s', transform: star <= reviewRating ? 'scale(1.1)' : 'scale(1)' }}>★</button>
                  ))}
                </div>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(26,22,18,0.4)', marginBottom: '8px' }}>Your experience</p>
                <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="What did you love? What surprised you? Was the itinerary realistic?..." rows={4}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid rgba(26,22,18,0.1)', borderRadius: '12px', fontFamily: "'DM Sans',sans-serif", fontSize: '14px', color: '#1a1612', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#2a9d8f'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(26,22,18,0.1)'}
                />
                {reviewText.trim().length > 0 && reviewText.trim().length < 10 && (
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>Please write at least 10 characters</p>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => setReviewModal(false)} style={{ flex: 1, padding: '11px', background: 'none', border: '1.5px solid rgba(26,22,18,0.1)', borderRadius: '100px', fontFamily: "'DM Sans',sans-serif", fontSize: '14px', cursor: 'pointer', color: 'rgba(26,22,18,0.5)' }}>Cancel</button>
                  <button onClick={submitReview} disabled={reviewSubmitting || reviewText.trim().length < 10}
                    style={{ flex: 2, padding: '11px', background: reviewText.trim().length >= 10 ? '#1a1612' : 'rgba(26,22,18,0.1)', color: reviewText.trim().length >= 10 ? 'white' : 'rgba(26,22,18,0.3)', border: 'none', borderRadius: '100px', fontFamily: "'DM Sans',sans-serif", fontSize: '14px', fontWeight: 500, cursor: reviewText.trim().length >= 10 ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                    {reviewSubmitting ? 'Submitting…' : 'Submit review ✦'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editModal && editForm && (
        <div className="edit-overlay" onClick={() => !regenerating && setEditModal(false)}>
          <div className="edit-box" onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: '28px' }}>
              <p className="bf" style={{ color: '#2a9d8f', fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Edit trip</p>
              <h3 className="hf" style={{ fontSize: '26px', fontWeight: 700, fontStyle: 'italic', color: '#1a1612', lineHeight: 1.1 }}>Regenerate {trip?.destination}</h3>
              <p className="bf" style={{ color: 'rgba(26,22,18,0.4)', fontSize: '13px', marginTop: '6px', lineHeight: 1.6 }}>Adjust any details below and we'll rebuild the itinerary from scratch.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label className="edit-label">Start date</label><input type="date" className="edit-input" value={editForm.startDate} onChange={e => setEditForm((f: any) => ({ ...f, startDate: e.target.value }))} /></div>
                <div><label className="edit-label">End date</label><input type="date" className="edit-input" value={editForm.endDate} onChange={e => setEditForm((f: any) => ({ ...f, endDate: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label className="edit-label">Travelers</label><input type="number" min={1} max={50} className="edit-input" value={editForm.travelers} onChange={e => setEditForm((f: any) => ({ ...f, travelers: e.target.value }))} /></div>
                <div><label className="edit-label">Budget</label><input type="number" min={0} className="edit-input" placeholder="Leave blank for flexible" value={editForm.budget} onChange={e => setEditForm((f: any) => ({ ...f, budget: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="edit-label">Currency</label>
                  <select className="edit-select" value={editForm.currency} onChange={e => setEditForm((f: any) => ({ ...f, currency: e.target.value }))}>
                    {['USD','INR','EUR','GBP','JPY','AUD','CAD','SGD'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="edit-label">Travel style</label>
                  <select className="edit-select" value={editForm.travelStyle} onChange={e => setEditForm((f: any) => ({ ...f, travelStyle: e.target.value }))}>
                    <option value="relaxed">Relaxed</option>
                    <option value="balanced">Balanced</option>
                    <option value="intensive">Intensive</option>
                    <option value="budget">Budget</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
              </div>
            </div>
            <button className="regen-btn" onClick={regenerate} disabled={regenerating}>{regenerating ? '✦ Regenerating your itinerary…' : '✦ Regenerate itinerary'}</button>
            <button className="edit-cancel" onClick={() => setEditModal(false)} disabled={regenerating}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      {days.length > 0 && (
        <div className="sidebar">
          {days.map((_: any, i: number) => (
            <React.Fragment key={i}>
              <button className={`sidebar-item${activeDay === i ? ' active' : ''}`} onClick={() => scrollToDay(i)}>
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

        {/* HERO */}
        <div style={{ padding: '72px 0 52px' }}>
          <div className="hero-text">
            <p className="bf" style={{ color: 'rgba(26,22,18,0.3)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Your itinerary</p>
            <h1 className="hf" style={{ fontSize: 'clamp(56px,8vw,104px)', fontWeight: 700, color: '#1a1612', lineHeight: 0.92, letterSpacing: '-0.02em', marginBottom: '28px', fontStyle: 'italic', maxWidth: '680px' }}>{destination}</h1>
            {itinerary?.summary && (
              <p className="hf" style={{ color: 'rgba(26,22,18,0.45)', fontSize: '20px', lineHeight: 1.75, fontWeight: 300, fontStyle: 'italic', maxWidth: '560px', marginBottom: '28px' }}>{itinerary.summary}</p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '48px', marginTop: '18px' }}>
              {startDate && <span className="meta-pill"><span style={{ color: '#2a9d8f', fontSize: '12px' }}>◈</span>{fmt(startDate)} – {fmt(endDate)}</span>}
              {totalDays > 0 && <span className="meta-pill"><span style={{ color: '#2a9d8f', fontSize: '12px' }}>◆</span>{totalDays} {totalDays === 1 ? 'day' : 'days'}</span>}
              {trip?.travelers && <span className="meta-pill"><span style={{ color: '#2a9d8f', fontSize: '12px' }}>◉</span>{trip.travelers} traveler{trip.travelers !== 1 ? 's' : ''}</span>}
              {trip?.budget && <span className="meta-pill"><span style={{ color: '#2a9d8f', fontSize: '12px' }}>◧</span>{sym}{Number(trip.budget).toLocaleString()} {currency}</span>}
              {itinerary?.estimated_cost > 0 && <span className="meta-pill" style={{ borderColor: 'rgba(42,157,143,0.2)', color: '#2a9d8f' }}><span style={{ fontSize: '12px' }}>◎</span>Est. {sym}{Number(itinerary.estimated_cost).toLocaleString()}</span>}
            </div>
          </div>
          <div style={{ height: '1px', background: 'linear-gradient(to right, #2a9d8f, rgba(42,157,143,0.15), transparent)' }} />
        </div>

        {/* DAYS */}
        {days.length > 0 ? (
          <>
            {days.map((day: any, di: number) => {
              const acts = day.activities || []
              const dayCost = acts.reduce((s: number, a: any) => s + (a.estimated_cost || 0), 0)
              return (
                <div key={di} className="day-section" ref={el => { dayRefs.current[di] = el }}>
                  <div className="day-ordinal-wrap"><span className="day-ordinal">{toRoman(di + 1)}</span></div>
                  <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                      <div>
                        <p className="bf" style={{ color: '#2a9d8f', fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                          Day {di + 1}
                          {day.date && <span style={{ color: 'rgba(26,22,18,0.28)', fontWeight: 300, marginLeft: '10px', fontSize: '10px' }}>{fmtFull(day.date)}</span>}
                        </p>
                        <h2 className="hf" style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700, color: '#1a1612', lineHeight: 1.05, letterSpacing: '-0.015em', fontStyle: 'italic' }}>{day.theme}</h2>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                        <span className="bf" style={{ color: 'rgba(26,22,18,0.28)', fontSize: '12px', fontWeight: 300 }}>{acts.length} activit{acts.length !== 1 ? 'ies' : 'y'}</span>
                        {dayCost > 0 && <span className="bf" style={{ color: '#2a9d8f', fontSize: '13px', fontWeight: 500 }}>~{sym}{dayCost.toLocaleString()}</span>}
                        <button
                          onClick={() => openMap(di)}
                          style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(26,22,18,0.3)', fontFamily: "'DM Sans',sans-serif", fontSize: '11px', padding: '0', transition: 'color 0.18s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#2a9d8f')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(26,22,18,0.3)')}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
                          Map
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {acts.map((act: any, ai: number) => {
                      const cat = CAT_CONFIG[act.category] || CAT_CONFIG.default
                      return (
                        <div key={ai} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }} className="act-row">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: '18px' }} className="act-timeline">
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: `1.5px solid ${cat.hue}30`, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                              <span style={{ color: cat.hue, fontSize: '13px', lineHeight: 1 }}>{cat.mark}</span>
                            </div>
                            {ai < acts.length - 1 && (
                              <div className="act-timeline-connector" style={{ width: '1px', flex: 1, minHeight: '20px', background: `linear-gradient(to bottom, rgba(42,157,143,0.3), transparent)`, marginTop: '4px' }} />
                            )}
                          </div>
                          <div className="act-card" style={{ flex: 1 }}>
                            <div style={{ height: '2px', background: `linear-gradient(90deg, ${cat.hue}50, transparent)` }} />
                            <div style={{ padding: '18px 22px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                {act.start_time && <span className="bf" style={{ color: cat.hue, fontSize: '12px', fontWeight: 500, letterSpacing: '0.04em' }}>{act.start_time}{act.end_time ? ` – ${act.end_time}` : ''}</span>}
                                <span style={{ padding: '2px 10px', borderRadius: '100px', background: cat.bg, color: cat.hue, fontFamily: "'DM Sans',sans-serif", fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', border: `1px solid ${cat.hue}20` }}>{cat.label}</span>
                              </div>
                              <h3 className="hf" style={{ fontSize: '19px', fontWeight: 700, color: '#1a1612', lineHeight: 1.2, marginBottom: act.location ? '5px' : '10px', fontStyle: 'italic' }}>{act.title}</h3>
                              {act.location && <p className="bf" style={{ color: 'rgba(26,22,18,0.32)', fontSize: '12px', marginBottom: '12px', fontWeight: 300 }}>{act.location}</p>}
                              {act.description && <p className="bf" style={{ color: 'rgba(26,22,18,0.55)', fontSize: '14px', lineHeight: 1.85, fontWeight: 300, marginBottom: act.tips ? '14px' : '0' }}>{act.description}</p>}
                              {act.tips && (
                                <div className="tip-callout">
                                  <p className="bf" style={{ color: 'rgba(138,106,64,0.85)', fontSize: '13px', lineHeight: 1.7, fontWeight: 300 }}>
                                    <span className="bf" style={{ fontWeight: 500, marginRight: '8px', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(138,106,64,0.65)' }}>Tip</span>
                                    {act.tips}
                                  </p>
                                </div>
                              )}
                              {act.estimated_cost > 0 && <p className="bf" style={{ color: 'rgba(26,22,18,0.38)', fontSize: '12px', marginTop: '12px', fontWeight: 400 }}>~{sym}{Number(act.estimated_cost).toLocaleString()} {currency}</p>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* FINALE */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '80px', paddingBottom: '40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <p className="hf" style={{ fontSize: 'clamp(48px,10vw,120px)', fontWeight: 700, fontStyle: 'italic', color: 'rgba(26,22,18,0.03)', lineHeight: 1, letterSpacing: '-0.03em', pointerEvents: 'none', userSelect: 'none', position: 'absolute', top: '64px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>{destination}</p>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '28px' }}>
                  <div style={{ width: '40px', height: '1px', background: 'rgba(42,157,143,0.35)' }} />
                  <span className="bf" style={{ color: '#2a9d8f', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500 }}>{destination} awaits</span>
                  <div style={{ width: '40px', height: '1px', background: 'rgba(42,157,143,0.35)' }} />
                </div>
                <h2 className="hf" style={{ fontSize: 'clamp(32px,5vw,58px)', fontWeight: 700, fontStyle: 'italic', color: '#1a1612', lineHeight: 1.1, letterSpacing: '-0.015em', marginBottom: '18px' }}>Go have the trip of your life.</h2>
                <p className="hf" style={{ color: 'rgba(26,22,18,0.55)', fontSize: '18px', fontStyle: 'italic', lineHeight: 1.8, maxWidth: '400px', margin: '0 auto 40px', fontWeight: 300 }}>{totalDays} days, every moment planned.<br />The only thing left is to show up.</p>
                <Link href="/plan" className="cta-btn">Plan another trip <span className="cta-arr">→</span></Link>
              </div>
            </div>
          </>
        ) : (
          <div style={{ paddingTop: '80px', textAlign: 'center' }}>
            <h2 className="hf" style={{ color: '#1a1612', fontSize: '36px', fontStyle: 'italic', fontWeight: 700, marginBottom: '14px' }}>No itinerary found</h2>
            <p className="bf" style={{ color: 'var(--muted)', fontSize: '15px', fontWeight: 300, marginBottom: '32px' }}>Something went wrong loading your trip.</p>
            <Link href="/plan" className="cta-btn">Start fresh →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
