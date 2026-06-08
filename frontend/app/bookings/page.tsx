'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import {
  MapPin, Phone, Clock, CheckCircle2, XCircle,
  AlertCircle, Loader2, Home, CalendarCheck,
  UsersRound, Copy, Check, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Booking, GroupBooking } from '../../types';
import Link from 'next/link';

type Status = 'pending' | 'confirmed' | 'contact_released' | 'cancelled' | 'completed' | 'no_show';

const STATUS: Record<Status, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; desc: string }> = {
  pending:          { label: 'Awaiting payment',        color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', icon: <Clock size={16} />,        desc: 'Complete your payment to confirm this booking' },
  confirmed:        { label: 'Confirmed — under review', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', icon: <CheckCircle2 size={16} />, desc: 'Admin is confirming availability with the landlord' },
  contact_released: { label: 'Contact released!',        color: '#059669', bg: '#ECFDF5', border: '#6EE7B7', icon: <CheckCircle2 size={16} />, desc: 'Call the landlord to schedule your viewing' },
  cancelled:        { label: 'Cancelled',                color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5', icon: <XCircle size={16} />,      desc: 'This booking was cancelled' },
  completed:        { label: 'Completed',                color: '#059669', bg: '#ECFDF5', border: '#6EE7B7', icon: <CheckCircle2 size={16} />, desc: 'Viewing completed' },
  no_show:          { label: 'No show',                  color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', icon: <AlertCircle size={16} />,  desc: 'You did not attend the viewing' },
};

const TIMELINE_STEPS = ['Paid', 'Verified', 'Contact Released', 'Moved In'];
const STATUS_STEP: Record<string, number> = {
  pending: 1, confirmed: 2, contact_released: 3, completed: 4,
};

function BookingTimeline({ status }: { status: string }) {
  const step = STATUS_STEP[status] ?? 1;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20 }}>
      {TIMELINE_STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < TIMELINE_STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, border: `2px solid ${done || active ? 'var(--blue)' : 'var(--border)'}`,
                background: done ? 'var(--blue)' : active ? 'white' : 'var(--surface)',
                color: done ? 'white' : active ? 'var(--blue)' : '#94A3B8',
                flexShrink: 0,
              }}>
                {done ? '✓' : n}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: done || active ? 'var(--blue)' : '#94A3B8', whiteSpace: 'nowrap', textAlign: 'center' }}>
                {label}
              </span>
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: n < step ? 'var(--blue)' : 'var(--border)', margin: '0 4px', marginBottom: 18 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const TABS = [
  { key: 'all',    label: 'All bookings' },
  { key: 'active', label: 'Active' },
  { key: 'past',   label: 'Past' },
  { key: 'groups', label: 'Groups' },
] as const;
type TabKey = typeof TABS[number]['key'];

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings,      setBookings]      = useState<Booking[]>([]);
  const [groupBookings, setGroupBookings] = useState<GroupBooking[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<TabKey>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    Promise.all([api.get('/bookings/my-bookings'), api.get('/bookings/group/my')])
      .then(([s, g]) => { setBookings(s.data); setGroupBookings(g.data); })
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const filtered = bookings.filter(b => {
    if (tab === 'active') return ['pending', 'confirmed', 'contact_released'].includes(b.booking_status);
    if (tab === 'past')   return ['cancelled', 'completed', 'no_show'].includes(b.booking_status);
    return true;
  });
  const activeCount = bookings.filter(b => ['pending', 'confirmed', 'contact_released'].includes(b.booking_status)).length;
  const totalSpent  = bookings.filter(b => b.payment_ref).length * 50;

  const copyCode = (id: number) => {
    navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ── Shared styles ─────────────────────────────── */
  const card: React.CSSProperties = { background: 'white', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--sh-sm)' };

  /* ── Empty state ─────────────────────────────────── */
  const Empty = ({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) => (
    <div style={{ ...card, padding: '72px 40px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>{title}</h3>
      <p style={{ fontSize: 16, color: '#64748B', marginBottom: 32, lineHeight: 1.7 }}>{sub}</p>
      <Link href="/hostels"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: 'var(--blue)', color: 'white', borderRadius: 12, fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>
        Browse hostels <ArrowRight size={16} />
      </Link>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />

      {/* ── Header ── */}
      <div className="r-bookings-header" style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '40px 32px 0' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarCheck size={26} style={{ color: 'var(--blue)' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', letterSpacing: '-1px' }}>My Bookings</h1>
              <p style={{ fontSize: 16, color: '#64748B', marginTop: 2 }}>Track your viewing requests and landlord contacts</p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total bookings', value: bookings.length,            color: '#1D4ED8', bg: '#EFF6FF' },
              { label: 'Active',         value: activeCount,                 color: '#059669', bg: '#ECFDF5' },
              { label: 'Total spent',    value: `GHS ${totalSpent}`,         color: '#7C3AED', bg: '#F5F3FF' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: 16, padding: '20px 24px', textAlign: 'center', border: `1px solid ${bg}` }}>
                <p style={{ fontSize: 30, fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 14, color: '#64748B', marginTop: 6, fontWeight: 500 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="r-tabs-row" style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)', marginTop: 4 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className="r-tab"
                style={{ padding: '14px 24px', fontSize: 15, fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? 'var(--blue)' : '#64748B', background: 'none', border: 'none', cursor: 'pointer', borderBottom: `3px solid ${tab === t.key ? 'var(--blue)' : 'transparent'}`, transition: 'all 0.15s', marginBottom: -1, display: 'flex', alignItems: 'center', gap: 8 }}>
                {t.label}
                {t.key === 'active' && activeCount > 0 && (
                  <span style={{ background: 'var(--blue)', color: 'white', fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 99 }}>{activeCount}</span>
                )}
                {t.key === 'groups' && groupBookings.length > 0 && (
                  <span style={{ background: '#F3F4F6', color: '#374151', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>{groupBookings.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="r-bookings-body" style={{ maxWidth: 960, margin: '0 auto', padding: '36px 32px 80px' }}>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <Loader2 size={36} style={{ color: 'var(--blue)' }} className="animate-spin" />
          </div>
        ) : tab === 'groups' ? (
          /* ── GROUP BOOKINGS ── */
          groupBookings.length === 0 ? (
            <Empty icon={<UsersRound size={40} style={{ color: '#D1D5DB' }} />}
              title="No group bookings yet"
              sub='Use "Book with friends" on any hostel listing to create a group viewing.' />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {groupBookings.map(gb => {
                const gc: Record<string, { color: string; bg: string; border: string }> = {
                  open:      { color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
                  full:      { color: '#059669', bg: '#ECFDF5', border: '#6EE7B7' },
                  cancelled: { color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5' },
                };
                const g = gc[gb.status] || gc.open;
                const pct = ((gb.member_count ?? 0) / gb.max_members) * 100;
                return (
                  <div key={gb.id} style={card}>
                    {/* Status banner */}
                    <div style={{ padding: '14px 24px', background: g.bg, borderBottom: `1px solid ${g.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: g.color }}>
                        <UsersRound size={17} />
                        Group #{gb.id} · {gb.status.charAt(0).toUpperCase() + gb.status.slice(1)}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: g.color }}>{gb.member_count ?? 0} / {gb.max_members} members paid</span>
                    </div>

                    <div style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>{gb.hostel_name}</h3>
                      <p style={{ fontSize: 15, color: '#64748B', marginBottom: 20 }}>{gb.room_type} · GHS {Number(gb.price || 0).toLocaleString()}/yr</p>

                      {/* Progress bar */}
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#64748B', marginBottom: 8 }}>
                          <span>Members joined</span>
                          <span style={{ fontWeight: 700 }}>{gb.member_count ?? 0} of {gb.max_members}</span>
                        </div>
                        <div style={{ height: 10, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 99, background: g.color, width: `${pct}%`, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>

                      {/* Share code */}
                      {gb.status === 'open' && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderRadius: 14, background: 'var(--blue-light)', border: '1.5px solid var(--blue-mid)', marginBottom: 16 }}>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Share this code with friends</p>
                            <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--blue)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>#{gb.id}</p>
                          </div>
                          <button onClick={() => copyCode(gb.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'var(--blue)', color: 'white', borderRadius: 12, fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                            {copiedId === gb.id ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
                          </button>
                        </div>
                      )}

                      <p style={{ fontSize: 14, color: '#94A3B8' }}>
                        My status: <span style={{ fontWeight: 700, color: '#374151', textTransform: 'capitalize' }}>{gb.my_status}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : filtered.length === 0 ? (
          <Empty icon={<Home size={40} style={{ color: '#D1D5DB' }} />}
            title="No bookings yet"
            sub="Browse verified hostels near your university and book your first viewing." />
        ) : (
          /* ── SOLO BOOKINGS ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {filtered.map(booking => {
              const s = STATUS[booking.booking_status as Status] || STATUS.pending;
              return (
                <div key={booking.id} style={card}>

                  {/* Status banner */}
                  <div style={{ padding: '14px 24px', background: s.bg, borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: s.color }}>
                      {s.icon} {s.label}
                    </div>
                    <p style={{ fontSize: 14, color: s.color, fontWeight: 500 }}>{s.desc}</p>
                  </div>

                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
                      <div>
                        <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>{booking.hostel_name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, color: '#64748B' }}>
                          <MapPin size={15} style={{ flexShrink: 0 }} />
                          {booking.hostel_address}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>Booking #{booking.id}</p>
                        <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 3 }}>
                          {booking.booked_at ? new Date(booking.booked_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Timeline — only for non-cancelled/no_show */}
                    {!['cancelled', 'no_show'].includes(booking.booking_status) && (
                      <BookingTimeline status={booking.booking_status} />
                    )}

                    {/* Detail chips */}
                    <div className="r-chips-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                      {[
                        { label: 'Room type',    value: booking.room_type || '—' },
                        { label: 'Annual rent',  value: `GHS ${Number(booking.price || 0).toLocaleString()}` },
                        { label: 'Viewing fee',  value: `GHS ${booking.viewing_fee || 50}` },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)' }}>
                          <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</p>
                          <p style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Contact released — prominent */}
                    {booking.booking_status === 'contact_released' && booking.landlord_phone && (
                      <div style={{ background: '#ECFDF5', border: '1.5px solid #6EE7B7', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Phone size={22} style={{ color: '#059669' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Landlord contact released</p>
                          <p style={{ fontSize: 20, fontWeight: 900, color: '#064E3B' }}>
                            {booking.landlord_name} · {booking.landlord_phone}
                          </p>
                        </div>
                        <a href={`tel:${booking.landlord_phone}`}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', background: '#059669', color: 'white', borderRadius: 12, fontWeight: 700, fontSize: 16, textDecoration: 'none', flexShrink: 0 }}>
                          <Phone size={18} /> Call now
                        </a>
                      </div>
                    )}

                    {/* Pending payment notice */}
                    {booking.booking_status === 'pending' && !booking.payment_ref && (
                      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <p style={{ fontSize: 15, color: '#92400E', fontWeight: 500 }}>Complete your payment to confirm this booking</p>
                        <Link href="/"
                          style={{ padding: '10px 20px', background: '#D97706', color: 'white', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                          Pay GHS 50
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
