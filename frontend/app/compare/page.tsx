'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import api from '../../lib/api';
import {
  MapPin, Star, ShieldCheck, Check, X, Loader2, Plus, BedDouble,
  ArrowLeft, LayoutGrid, Users, GraduationCap, Navigation2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Hostel } from '../../types';

function StarRow({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={12}
          fill={i < Math.round(rating) ? '#F59E0B' : 'none'}
          color={i < Math.round(rating) ? '#F59E0B' : '#D1D5DB'} />
      ))}
    </div>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [all, setAll]         = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding]   = useState(false);
  const [addHover, setAddHover] = useState(false);

  const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [cmpRes, allRes] = await Promise.all([
          ids.length > 0
            ? api.get(`/search/compare?ids=${ids.join(',')}`)
            : Promise.resolve({ data: { hostels: [] } }),
          api.get('/search'),
        ]);
        setHostels(cmpRes.data.hostels || []);
        setAll(allRes.data.hostels || []);
      } catch { toast.error('Failed to load comparison'); }
      finally { setLoading(false); }
    };
    load();
  }, [searchParams]);

  const addHostel = (id: number) => {
    if (hostels.length >= 3) { toast.error('Max 3 hostels at a time'); return; }
    if (ids.includes(String(id))) { toast.error('Already in comparison'); return; }
    router.push(`/compare?ids=${[...ids, String(id)].join(',')}`);
    setAdding(false);
  };

  const removeHostel = (id: number) => {
    const next = ids.filter(i => i !== String(id));
    router.push(next.length > 0 ? `/compare?ids=${next.join(',')}` : '/compare');
  };

  const available = all.filter(h => !ids.includes(String(h.id)));
  const minPrice  = hostels.length > 0
    ? Math.min(...hostels.map(h => Number(h.min_price || 0)))
    : 0;
  const cols      = hostels.length + (hostels.length < 3 ? 1 : 0);
  const gridCols  = `160px repeat(${Math.max(cols, 1)}, minmax(185px, 1fr))`;
  const minW      = 160 + Math.max(cols, 1) * 185;

  const ROWS: Array<{ label: string; icon: React.ReactNode; render: (h: Hostel) => React.ReactNode }> = [
    {
      label: 'Starting price',
      icon: <span style={{ fontSize: 10, fontWeight: 800 }}>GHS</span>,
      render: (h) => {
        const price  = Number(h.min_price || 0);
        const isBest = hostels.length > 1 && price === minPrice && price > 0;
        return (
          <div>
            <p style={{ fontSize: 18, fontWeight: 900, color: isBest ? '#059669' : 'var(--blue)', letterSpacing: '-0.3px', lineHeight: 1 }}>
              {price.toLocaleString()}
              <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>/yr</span>
            </p>
            {isBest && (
              <span style={{ display: 'inline-block', marginTop: 5, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#DCFCE7', color: '#15803D' }}>
                ✓ Best price
              </span>
            )}
          </div>
        );
      },
    },
    {
      label: 'University',
      icon: <GraduationCap size={13} />,
      render: (h) => <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>🎓 {h.university}</span>,
    },
    {
      label: 'Rating',
      icon: <Star size={13} />,
      render: (h) => h.avg_rating ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>{Number(h.avg_rating).toFixed(1)}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({h.total_reviews || 0})</span>
          </div>
          <StarRow rating={Number(h.avg_rating)} />
        </div>
      ) : <span style={{ fontSize: 12, color: '#94A3B8' }}>No reviews yet</span>,
    },
    {
      label: 'Available rooms',
      icon: <BedDouble size={13} />,
      render: (h) => {
        const n = Number(h.available_rooms || 0);
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: n > 0 ? '#059669' : '#DC2626' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: n > 0 ? '#22C55E' : '#EF4444', flexShrink: 0 }} />
            {n} room{n !== 1 ? 's' : ''}
          </span>
        );
      },
    },
    {
      label: 'Verified',
      icon: <ShieldCheck size={13} />,
      render: (h) => h.is_verified
        ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#059669' }}><Check size={13} /> Verified</span>
        : <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#94A3B8' }}><X size={13} /> Not verified</span>,
    },
    {
      label: 'Distance',
      icon: <Navigation2 size={13} />,
      render: (h) => h.distance_km
        ? <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{h.distance_km} km</span>
        : <span style={{ fontSize: 12, color: '#94A3B8' }}>—</span>,
    },
    {
      label: 'Room types',
      icon: <LayoutGrid size={13} />,
      render: (h) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {((h as any).room_types || []).map((t: string) => (
            <span key={t} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'var(--blue-light)', color: 'var(--blue)', fontWeight: 600 }}>{t}</span>
          ))}
        </div>
      ),
    },
    {
      label: 'Gender policy',
      icon: <Users size={13} />,
      render: (h) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {((h as any).gender_policies || []).map((g: string) => (
            <span key={g} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'var(--surface)', color: '#64748B', border: '1px solid var(--border)', fontWeight: 600 }}>
              {g === 'Both' ? 'Mixed' : `${g} only`}
            </span>
          ))}
        </div>
      ),
    },
    {
      label: 'Address',
      icon: <MapPin size={13} />,
      render: (h) => (
        <p style={{ display: 'flex', alignItems: 'flex-start', gap: 5, fontSize: 12, color: '#64748B', lineHeight: 1.55 }}>
          <MapPin size={11} style={{ flexShrink: 0, marginTop: 1, color: '#9CA3AF' }} />
          {h.hostel_address}
        </p>
      ),
    },
  ];

  /* ── Hostel header card ── */
  const HostelCol = ({ hostel }: { hostel: Hostel }) => (
    <div style={{ padding: '16px 16px 18px', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', position: 'relative' }}>
      <button onClick={() => removeHostel(hostel.id)}
        style={{ position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, transition: 'all 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEE2E2'; (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = ''; }}>
        <X size={12} />
      </button>

      <div style={{ height: 140, borderRadius: 12, overflow: 'hidden', background: 'var(--blue-light)', marginBottom: 12 }}>
        {hostel.images?.[0]
          ? <img src={hostel.images[0]} alt={hostel.hostel_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BedDouble size={32} style={{ color: 'var(--blue)', opacity: 0.2 }} /></div>}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 7, flexWrap: 'wrap' }}>
        {hostel.is_verified && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'var(--blue-light)', color: 'var(--blue)' }}>
            <ShieldCheck size={9} /> Verified
          </span>
        )}
        {hostel.track && (
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            Track {hostel.track}
          </span>
        )}
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', lineHeight: 1.35, marginBottom: 5, paddingRight: 18 }}>
        {hostel.hostel_name}
      </h3>
      <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--blue)', marginBottom: 8, letterSpacing: '-0.3px' }}>
        GHS {Number(hostel.min_price || 0).toLocaleString()}
        <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>/yr</span>
      </p>
      <Link href={`/hostels/${hostel.id}`}
        style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', textDecoration: 'none' }}>
        View details →
      </Link>
    </div>
  );

  /* ── Add-hostel picker (in-column) ── */
  const AddCol = () => (
    <div style={{ padding: 16, borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 230 }}>
      {adding ? (
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Select a hostel</p>
            <button onClick={() => setAdding(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 200, overflowY: 'auto' }}>
            {available.slice(0, 12).map(h => (
              <button key={h.id} onClick={() => addHostel(h.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--blue)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--blue-light)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.background = 'white'; }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.hostel_name}</p>
                  <p style={{ fontSize: 10, color: '#94A3B8' }}>{h.university?.split(' ').pop()}</p>
                </div>
                <Plus size={12} style={{ color: 'var(--blue)', flexShrink: 0 }} />
              </button>
            ))}
            {available.length === 0 && <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', padding: '10px 0' }}>No more hostels</p>}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          onMouseEnter={() => setAddHover(true)}
          onMouseLeave={() => setAddHover(false)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', color: addHover ? 'var(--blue)' : 'var(--text-muted)', transition: 'color 0.15s' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: `2px dashed ${addHover ? 'var(--blue)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.15s' }}>
            <Plus size={20} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Add hostel</span>
        </button>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />

      {/* ── Page header ── */}
      <div style={{ background: 'linear-gradient(135deg, #EBF3FF 0%, white 65%)', borderBottom: '1px solid var(--border)', padding: 'clamp(20px,4vw,32px) clamp(16px,3vw,24px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.4px', marginBottom: 4 }}>
              Compare hostels
            </h1>
            <p style={{ fontSize: 14, color: '#64748B' }}>
              Side-by-side comparison · up to 3 hostels
            </p>
          </div>
          <Link href="/hostels"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'white', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#374151', textDecoration: 'none', boxShadow: 'var(--sh-sm)' }}>
            <ArrowLeft size={14} /> Browse hostels
          </Link>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(16px,3vw,28px) clamp(16px,3vw,24px) 60px' }}>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--blue)' }} />
          </div>

        ) : hostels.length === 0 && !adding ? (
          /* ── Empty state ── */
          <div style={{ textAlign: 'center', padding: 'clamp(48px,8vw,80px) 20px', background: 'white', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <LayoutGrid size={30} style={{ color: 'var(--blue)', opacity: 0.7 }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>No hostels selected</h2>
            <p style={{ fontSize: 14, color: '#64748B', maxWidth: 320, margin: '0 auto 28px', lineHeight: 1.65 }}>
              Add up to 3 hostels to compare them side by side — price, rating, availability and more.
            </p>
            <button onClick={() => setAdding(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--sh-blue)' }}>
              <Plus size={16} /> Add your first hostel
            </button>
          </div>

        ) : hostels.length === 0 && adding ? (
          /* ── Full-width picker (no hostels yet) ── */
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A' }}>Select a hostel to compare</h2>
              <button onClick={() => setAdding(false)}
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={15} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
              {available.slice(0, 20).map(h => (
                <button key={h.id} onClick={() => addHostel(h.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--blue)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--blue-light)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.background = 'white'; }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: 'var(--surface)', flexShrink: 0 }}>
                    {h.images?.[0]
                      ? <img src={h.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BedDouble size={18} style={{ color: 'var(--blue)', opacity: 0.25 }} /></div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.hostel_name}</p>
                    <p style={{ fontSize: 11, color: '#64748B' }}>🎓 {h.university} · GHS {Number(h.min_price || 0).toLocaleString()}/yr</p>
                  </div>
                  <Plus size={14} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                </button>
              ))}
              {available.length === 0 && (
                <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '24px 0', gridColumn: '1 / -1' }}>No hostels available</p>
              )}
            </div>
          </div>

        ) : (
          /* ── Comparison table ── */
          <>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: 20 }}>
              <div style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)', overflow: 'hidden', minWidth: minW }}>

                {/* Header row */}
                <div style={{ display: 'grid', gridTemplateColumns: gridCols }}>
                  {/* Top-left */}
                  <div style={{ padding: '16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'flex-end', position: 'sticky', left: 0, zIndex: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {hostels.length} / 3 hostels
                    </span>
                  </div>
                  {hostels.map(h => <HostelCol key={h.id} hostel={h} />)}
                  {hostels.length < 3 && <AddCol />}
                </div>

                {/* Data rows */}
                {ROWS.map((row, ri) => {
                  const isLast  = ri === ROWS.length - 1;
                  const rowBg   = ri % 2 === 0 ? 'white' : 'var(--surface)';
                  const labelBg = ri % 2 === 0 ? '#FAFAFA' : '#F3F4F6';
                  return (
                    <div key={row.label} style={{ display: 'grid', gridTemplateColumns: gridCols, background: rowBg }}>
                      {/* Label — sticky */}
                      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8, borderRight: '1px solid var(--border)', borderBottom: isLast ? 'none' : '1px solid var(--border)', background: labelBg, position: 'sticky', left: 0, zIndex: 1 }}>
                        <span style={{ color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>{row.icon}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                          {row.label}
                        </span>
                      </div>
                      {/* Values */}
                      {hostels.map(h => (
                        <div key={h.id} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', borderRight: '1px solid var(--border)', borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
                          {row.render(h)}
                        </div>
                      ))}
                      {/* Filler */}
                      {hostels.length < 3 && (
                        <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)', background: 'var(--surface)' }} />
                      )}
                    </div>
                  );
                })}

                {/* CTA row */}
                <div style={{ display: 'grid', gridTemplateColumns: gridCols, borderTop: '2px solid var(--border)', background: 'var(--surface)' }}>
                  <div style={{ padding: 16, borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', position: 'sticky', left: 0, zIndex: 1, background: 'var(--surface)' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</span>
                  </div>
                  {hostels.map(h => (
                    <div key={h.id} style={{ padding: '14px 16px', borderRight: '1px solid var(--border)' }}>
                      <Link href={`/hostels/${h.id}`}
                        style={{ display: 'block', textAlign: 'center', padding: '11px 16px', borderRadius: 12, background: 'var(--blue)', color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: 'var(--sh-blue)', transition: 'opacity 0.15s' }}
                        onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = '0.88')}
                        onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = '1')}>
                        Book viewing
                      </Link>
                    </div>
                  ))}
                  {hostels.length < 3 && <div style={{ background: 'var(--surface)' }} />}
                </div>
              </div>
            </div>

            {/* Mobile scroll hint */}
            {hostels.length > 1 && (
              <p className="md:hidden" style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 10 }}>
                ← Swipe to compare →
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--blue)' }} />
        </div>
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
