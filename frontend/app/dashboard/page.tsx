'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', INR: '₹', EUR: '€', GBP: '£',
  JPY: '¥', AUD: 'A$', CAD: 'C$', SGD: 'S$',
}

function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'baseline', lineHeight:1, userSelect:'none' }}>
      <span style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:300, fontStyle:'italic', fontSize:`${size}px`, color:'#1a1612', letterSpacing:'0.01em' }}>this</span>
      <span style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:300, fontStyle:'italic', fontSize:`${size*0.55}px`, color:'#2a9d8f', margin:`0 ${size*0.06}px`, alignSelf:'center' }}>·</span>
      <span style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontStyle:'normal', fontSize:`${size}px`, color:'#1a1612', letterSpacing:'-0.02em' }}>Way</span>
    </span>
  )
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<{ id: string; destination: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      fetchTrips()
    }
  }, [status, session])

  const fetchTrips = async () => {
    try {
      const res = await fetch(`/api/trips?email=${encodeURIComponent(session?.user?.email || '')}`)
      const data = await res.json()
      setTrips(Array.isArray(data) ? data : [])
    } catch (_e) {
      setTrips([])
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteModal) return
    setDeleting(true)
    try {
      await fetch(`/api/trips/${deleteModal.id}`, { method: 'DELETE' })
      setTrips(prev => prev.filter(t => t.id !== deleteModal.id))
      setDeleteModal(null)
    } catch {
      alert('Failed to delete. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const firstName = session?.user?.name?.split(' ')[0] || 'there'

  if (status === 'loading' || loading) {
    return (
      <div style={{ minHeight:'100vh', background:'#faf8f4', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'18px' }}>
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
        <div style={{ width:'36px', height:'36px', borderRadius:'50%', border:'2px solid rgba(42,157,143,0.15)', borderTopColor:'#2a9d8f', animation:'spin 0.9s linear infinite' }} />
        <p style={{ fontFamily:"'DM Sans',sans-serif", color:'rgba(26,22,18,0.32)', fontSize:'14px', fontWeight:300 }}>
          Getting your trips ready…
        </p>
      </div>
    )
  }

  const sorted = [...trips].sort((a, b) =>
    new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime()
  )
  const featured = sorted[0]
  const rest = sorted.slice(1)

  return (
    <div style={{ minHeight:'100vh', background:'#faf8f4', overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        :root {
          --ink: #1a1612;
          --canvas: #faf8f4;
          --teal: #2a9d8f;
          --teal-deep: #1a6a63;
          --muted: rgba(26,22,18,0.42);
          --border: rgba(26,22,18,0.08);
        }
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        .bf { font-family:'DM Sans',sans-serif; }
        .hf { font-family:'Cormorant Garamond',Georgia,serif; }

        .up { opacity:0; transform:translateY(22px); animation:up 0.75s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes up { to { opacity:1; transform:translateY(0); } }

        .nav-so {
          font-family:'DM Sans',sans-serif; font-size:13px; color:var(--muted);
          background:none; border:1.5px solid var(--border); border-radius:100px;
          padding:7px 16px; cursor:pointer; transition:all 0.2s ease;
        }
        .nav-so:hover { color:var(--ink); border-color:rgba(26,22,18,0.18); background:rgba(26,22,18,0.03); }

        .cta {
          display:inline-flex; align-items:center; gap:9px;
          padding:13px 28px; background:var(--ink); color:white;
          font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500;
          border-radius:100px; text-decoration:none; border:none; cursor:pointer;
          transition:transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease;
          box-shadow:0 4px 18px rgba(0,0,0,0.13);
        }
        .cta:hover { transform:scale(1.04) translateY(-2px); box-shadow:0 14px 40px rgba(0,0,0,0.2); }
        .cta-arr { transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .cta:hover .cta-arr { transform:translateX(5px); }

        .feat {
          display:block; text-decoration:none;
          background:white; border-radius:28px;
          border:1.5px solid rgba(42,157,143,0.2);
          box-shadow:0 0 0 5px rgba(42,157,143,0.05), 0 20px 56px rgba(0,0,0,0.08);
          padding:44px 48px; position:relative; overflow:hidden;
          transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease;
        }
        .feat::before {
          content:''; position:absolute; top:0; left:0; right:0; height:3px;
          background:linear-gradient(90deg, var(--teal) 0%, #7ab8f5 50%, var(--teal) 100%);
          background-size:200% 100%; animation:shimmer 3s linear infinite;
        }
        @keyframes shimmer { to { background-position:200% 0; } }
        .feat:hover { transform:translateY(-5px) scale(1.003); box-shadow:0 0 0 5px rgba(42,157,143,0.08), 0 32px 80px rgba(0,0,0,0.11); }

        .card {
          display:block; text-decoration:none;
          background:white; border-radius:22px;
          border:1px solid rgba(0,0,0,0.055);
          box-shadow:0 2px 12px rgba(0,0,0,0.04);
          padding:28px 30px;
          transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .card:hover { transform:translateY(-6px) scale(1.01); box-shadow:0 20px 52px rgba(0,0,0,0.1); border-color:rgba(42,157,143,0.2); }

        .add {
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          text-decoration:none; border-radius:22px; min-height:200px;
          border:1.5px dashed rgba(26,22,18,0.1);
          transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .add:hover { border-color:var(--teal); background:rgba(42,157,143,0.025); transform:translateY(-5px); }

        .empty {
          display:block; text-decoration:none;
          background:white; border-radius:28px;
          border:1px solid rgba(0,0,0,0.055);
          box-shadow:0 4px 24px rgba(0,0,0,0.06);
          padding:88px 64px; text-align:center;
          transition:transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .empty:hover { transform:translateY(-4px); border-color:rgba(42,157,143,0.22); box-shadow:0 0 0 4px rgba(42,157,143,0.06), 0 20px 56px rgba(0,0,0,0.08); }

        .badge-r {
          display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:100px;
          font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500; letter-spacing:0.04em;
          background:rgba(42,157,143,0.09); color:var(--teal-deep); border:1px solid rgba(42,157,143,0.18);
        }
        .badge-s {
          display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:100px;
          font-family:'DM Sans',sans-serif; font-size:11px; font-weight:400; letter-spacing:0.03em;
          background:rgba(26,22,18,0.05); color:var(--muted); border:1px solid var(--border);
        }

        .teal-rule { height:1px; background:linear-gradient(to right, rgba(42,157,143,0.2), transparent); margin:18px 0; }
        .meta { display:flex; align-items:center; gap:7px; }
        .dot-t { width:5px; height:5px; border-radius:50%; background:var(--teal); flex-shrink:0; }
        .dot-m { width:5px; height:5px; border-radius:50%; background:rgba(26,22,18,0.15); flex-shrink:0; }
        .ml { font-family:'DM Sans',sans-serif; font-size:13px; font-weight:300; color:var(--muted); }

        .av { width:32px; height:32px; border-radius:50%; object-fit:cover; border:2px solid rgba(42,157,143,0.25); }
        .av-fb {
          width:32px; height:32px; border-radius:50%;
          background:linear-gradient(135deg,var(--teal),var(--teal-deep));
          display:flex; align-items:center; justify-content:center;
          color:white; font-size:13px; font-weight:600; font-family:'DM Sans',sans-serif;
          border:2px solid rgba(42,157,143,0.25);
        }

        /* ── DELETE BUTTON ── */
        .del-btn {
          position:absolute; top:14px; right:14px; z-index:10;
          width:28px; height:28px; border-radius:50%;
          background:rgba(26,22,18,0.04); border:1px solid rgba(26,22,18,0.1);
          color:rgba(26,22,18,0.28); cursor:pointer; font-size:13px;
          display:flex; align-items:center; justify-content:center;
          transition:all 0.2s ease;
        }
        .del-btn:hover { background:rgba(200,50,50,0.08); border-color:rgba(200,50,50,0.22); color:rgba(190,45,45,0.85); transform:scale(1.1); }

        /* ── DELETE MODAL ── */
        .modal-overlay {
          position:fixed; inset:0; z-index:500;
          background:rgba(26,22,18,0.4); backdrop-filter:blur(10px);
          display:flex; align-items:center; justify-content:center; padding:24px;
          animation:fadeIn 0.18s ease;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .modal-box {
          background:white; border:1px solid rgba(26,22,18,0.08);
          border-radius:24px; padding:40px; max-width:420px; width:100%;
          box-shadow:0 40px 100px rgba(0,0,0,0.14);
          animation:slideUp 0.25s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .modal-del-btn {
          flex:1; padding:12px; border-radius:100px;
          background:rgba(200,50,50,0.07); border:1px solid rgba(200,50,50,0.18);
          color:rgba(175,40,40,0.85); font-family:'DM Sans',sans-serif;
          font-size:13px; font-weight:500; cursor:pointer; transition:all 0.2s;
        }
        .modal-del-btn:hover:not(:disabled) { background:rgba(200,50,50,0.13); border-color:rgba(200,50,50,0.3); }
        .modal-del-btn:disabled { opacity:0.45; cursor:not-allowed; }
        .modal-cancel-btn {
          flex:1; padding:12px; border-radius:100px;
          background:rgba(26,22,18,0.04); border:1px solid rgba(26,22,18,0.1);
          color:rgba(26,22,18,0.5); font-family:'DM Sans',sans-serif;
          font-size:13px; font-weight:400; cursor:pointer; transition:all 0.2s;
        }
        .modal-cancel-btn:hover { background:rgba(26,22,18,0.07); color:rgba(26,22,18,0.75); }

        @keyframes breathe { 0%,100%{transform:scale(1);opacity:0.7} 50%{transform:scale(1.07);opacity:1} }
        .breathe { animation:breathe 3.5s ease-in-out infinite; display:inline-block; }

        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#faf8f4; }
        ::-webkit-scrollbar-thumb { background:rgba(26,22,18,0.1); border-radius:2px; }
      `}</style>

      {/* ── DELETE MODAL ── */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom:'24px' }}>
              <p className="bf" style={{ color:'rgba(190,45,45,0.6)', fontSize:'10px', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'12px' }}>
                Delete trip
              </p>
              <h3 className="hf" style={{ color:'var(--ink)', fontSize:'24px', fontWeight:700, marginBottom:'10px', lineHeight:1.15 }}>
                Delete "{deleteModal.destination}"?
              </h3>
              <p className="bf" style={{ color:'var(--muted)', fontSize:'14px', lineHeight:1.7, fontWeight:300 }}>
                This will permanently remove the trip and its entire itinerary. This cannot be undone.
              </p>
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button className="modal-cancel-btn" onClick={() => setDeleteModal(null)} disabled={deleting}>Cancel</button>
              <button className="modal-del-btn" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NAV ── */}
      <nav style={{
        position:'sticky', top:0, zIndex:100,
        padding:'16px 56px', display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'rgba(250,248,244,0.92)', backdropFilter:'blur(24px)',
        borderBottom:'1px solid rgba(0,0,0,0.055)',
      }}>
        <Link href="/" style={{ textDecoration:'none' }}><Wordmark size={22} /></Link>
        <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
          {session?.user?.image
            ? <img src={session.user.image} alt="" className="av" />
            : <div className="av-fb">{firstName[0]}</div>
          }
          <span className="bf" style={{ color:'var(--muted)', fontSize:'14px', fontWeight:300 }}>{session?.user?.name}</span>
          <button onClick={() => signOut({ callbackUrl:'/' })} className="nav-so">Sign out</button>
        </div>
      </nav>

      <main style={{ maxWidth:'1160px', margin:'0 auto', padding:'64px 56px 120px' }}>

        {/* ── HEADER ── */}
        <div className="up" style={{ animationDelay:'0.06s', marginBottom:'52px' }}>
          <p className="bf" style={{ color:'rgba(26,22,18,0.3)', fontSize:'11px', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'10px' }}>
            Your trips
          </p>
          <h1 className="hf" style={{ fontSize:'clamp(42px,5.5vw,68px)', fontWeight:700, color:'var(--ink)', lineHeight:1.02, letterSpacing:'-0.015em', marginBottom:'24px' }}>
            Alright, {firstName}.<br />
            <em style={{ color:'var(--teal)', fontWeight:300 }}>Where to next?</em>
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap' }}>
            <Link href="/plan" className="cta">+ New trip <span className="cta-arr">→</span></Link>
            {trips.length > 0 && (
              <span className="bf" style={{ color:'rgba(26,22,18,0.3)', fontSize:'14px', fontWeight:300 }}>
                {trips.length} trip{trips.length !== 1 ? 's' : ''} planned. Ready for another?
              </span>
            )}
          </div>
        </div>

        {/* ── EMPTY ── */}
        {trips.length === 0 && (
          <Link href="/plan" className="empty up" style={{ animationDelay:'0.2s' }}>
            <div className="breathe" style={{ fontSize:'58px', marginBottom:'28px' }}>🗺️</div>
            <h2 className="hf" style={{ fontSize:'36px', fontWeight:700, color:'var(--ink)', marginBottom:'14px', lineHeight:1.08 }}>
              We're packed.<br /><em style={{ color:'var(--teal)', fontWeight:300 }}>Where to first?</em>
            </h2>
            <p className="bf" style={{ color:'var(--muted)', fontSize:'16px', fontWeight:300, lineHeight:1.75, maxWidth:'440px', margin:'0 auto 40px' }}>
              Trips you plan will live here — ready whenever you are. Takes about 2 minutes to build your first itinerary.
            </p>
            <span className="cta" style={{ display:'inline-flex' }}>Let's go <span className="cta-arr">→</span></span>
            <div style={{ display:'flex', justifyContent:'center', gap:'56px', marginTop:'52px', paddingTop:'32px', borderTop:'1px solid rgba(0,0,0,0.06)' }}>
              {[{ n:'2 min', l:'to plan a trip' }, { n:'30+', l:'days supported' }, { n:'100%', l:'free to start' }].map(s => (
                <div key={s.l} style={{ textAlign:'center' }}>
                  <p className="hf" style={{ color:'var(--teal)', fontSize:'26px', fontWeight:700, marginBottom:'4px' }}>{s.n}</p>
                  <p className="bf" style={{ color:'rgba(26,22,18,0.28)', fontSize:'13px', fontWeight:300 }}>{s.l}</p>
                </div>
              ))}
            </div>
          </Link>
        )}

        {/* ── TRIPS ── */}
        {trips.length > 0 && (
          <>
            {/* Featured */}
            <div className="up" style={{ animationDelay:'0.16s', marginBottom:'24px', position:'relative' }}>
              <button className="del-btn" onClick={() => setDeleteModal({ id: featured.id, destination: featured.destination })} title="Delete trip">✕</button>
              <Link href={`/trip/${featured.id}`} className="feat">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'20px' }}>
                  <div style={{ flex:1, minWidth:'220px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'18px' }}>
                      <span className="badge-r">✦ Most recent</span>
                      {featured.status && <span className="badge-s">{featured.status}</span>}
                    </div>
                    <h2 className="hf" style={{ fontSize:'clamp(30px,3.5vw,48px)', fontWeight:700, color:'var(--ink)', lineHeight:1.05, letterSpacing:'-0.01em', marginBottom:'10px' }}>
                      {featured.destination}
                    </h2>
                    <p className="bf" style={{ color:'rgba(26,22,18,0.36)', fontSize:'14px', fontWeight:300, lineHeight:1.65 }}>
                      Your most recent trip — pick up right where you left off.
                    </p>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px', minWidth:'200px', paddingTop:'4px' }}>
                    <div className="meta"><span className="dot-t" /><span className="ml">{featured.start_date || featured.startDate} → {featured.end_date || featured.endDate}</span></div>
                    <div className="meta"><span className="dot-m" /><span className="ml">{featured.travelers} traveler{featured.travelers !== 1 ? 's' : ''}</span></div>
                    {featured.budget && (
                      <div className="meta"><span className="dot-m" /><span className="ml">{CURRENCY_SYMBOLS[featured.currency || 'USD'] || '$'}{Number(featured.budget).toLocaleString()} {featured.currency}</span></div>
                    )}
                    <span className="bf" style={{ color:'var(--teal)', fontSize:'14px', fontWeight:500, marginTop:'8px' }}>Open itinerary →</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Rest grid */}
            {rest.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))', gap:'18px' }}>
                {rest.map((trip, i) => {
                  const sym = CURRENCY_SYMBOLS[trip.currency || 'USD'] || '$'
                  return (
                    <div key={trip.id} style={{ position:'relative' }}>
                      <button className="del-btn" onClick={() => setDeleteModal({ id: trip.id, destination: trip.destination })} title="Delete trip">✕</button>
                      <Link href={`/trip/${trip.id}`} className="card up" style={{ animationDelay:`${0.24 + i * 0.07}s` }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'4px' }}>
                          <div>
                            {trip.status && <span className="badge-s" style={{ marginBottom:'8px', display:'inline-flex' }}>{trip.status}</span>}
                            <h3 className="hf" style={{ fontSize:'24px', fontWeight:700, color:'var(--ink)', lineHeight:1.08, marginTop: trip.status ? '6px' : '0' }}>
                              {trip.destination}
                            </h3>
                          </div>
                        </div>
                        <div className="teal-rule" />
                        <div style={{ display:'flex', flexDirection:'column', gap:'7px', marginBottom:'18px' }}>
                          <div className="meta"><span className="dot-t" /><span className="ml">{trip.start_date || trip.startDate} → {trip.end_date || trip.endDate}</span></div>
                          <div className="meta"><span className="dot-m" /><span className="ml">{trip.travelers} traveler{trip.travelers !== 1 ? 's' : ''}</span></div>
                          {trip.budget && (
                            <div className="meta"><span className="dot-m" /><span className="ml">{sym}{Number(trip.budget).toLocaleString()} {trip.currency}</span></div>
                          )}
                        </div>
                        <span className="bf" style={{ color:'var(--teal)', fontSize:'13px', fontWeight:500 }}>View itinerary →</span>
                      </Link>
                    </div>
                  )
                })}

                <Link href="/plan" className="add up" style={{ animationDelay:`${0.24 + rest.length * 0.07}s` }}>
                  <div style={{ width:'44px', height:'44px', borderRadius:'50%', border:'1.5px dashed rgba(26,22,18,0.14)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'12px' }}>
                    <span className="hf" style={{ fontSize:'24px', color:'rgba(26,22,18,0.18)', fontWeight:300, lineHeight:1 }}>+</span>
                  </div>
                  <p className="hf" style={{ color:'rgba(26,22,18,0.34)', fontSize:'17px', fontWeight:600, marginBottom:'4px' }}>Plan another trip</p>
                  <p className="bf" style={{ color:'rgba(26,22,18,0.2)', fontSize:'12px', fontWeight:300 }}>Ready when you are</p>
                </Link>
              </div>
            )}

            {rest.length === 0 && (
              <div className="up" style={{ animationDelay:'0.28s' }}>
                <Link href="/plan" className="add" style={{ minHeight:'110px' }}>
                  <p className="hf" style={{ color:'rgba(26,22,18,0.34)', fontSize:'17px', fontWeight:600, marginBottom:'4px' }}>Plan another trip</p>
                  <p className="bf" style={{ color:'rgba(26,22,18,0.2)', fontSize:'12px', fontWeight:300 }}>Ready when you are</p>
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
