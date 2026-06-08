'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Loader2, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface CalendarBooking {
  id: number;
  booked_at: string;
  booking_status: string;
  room_type: string;
  room_id: number;
  student_name: string;
}

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  pending:          { bg: '#FEF3C7', color: '#B45309' },
  confirmed:        { bg: '#DBEAFE', color: '#1D4ED8' },
  contact_released: { bg: '#D1FAE5', color: '#065F46' },
  completed:        { bg: '#F3F4F6', color: '#374151' },
  cancelled:        { bg: '#FEE2E2', color: '#B91C1C' },
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function LandlordCalendar() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [today]                 = useState(new Date());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<CalendarBooking[] | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'landlord') { router.push('/'); return; }
    api.get('/bookings/calendar')
      .then(r => setBookings(r.data))
      .catch(() => toast.error('Failed to load calendar'))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const bookingsByDay = bookings.reduce<Record<string, CalendarBooking[]>>((acc, b) => {
    const key = new Date(b.booked_at).toISOString().slice(0, 10);
    acc[key] = acc[key] || [];
    acc[key].push(b);
    return acc;
  }, {});

  const firstDay  = new Date(viewYear, viewMonth, 1).getDay();
  const daysCount = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells     = Array.from({ length: firstDay + daysCount }, (_, i) => {
    if (i < firstDay) return null;
    return i - firstDay + 1;
  });
  while (cells.length % 7 !== 0) cells.push(null);

  if (authLoading || loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Loader2 size={32} style={{ color: 'var(--blue)' }} className="animate-spin" />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <Link href="/landlord"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#64748B', textDecoration: 'none', marginBottom: 16 }}>
            <ArrowLeft size={15} /> Back to dashboard
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>Booking calendar</h1>
          <p style={{ fontSize: 15, color: '#64748B', marginTop: 4 }}>All upcoming and recent bookings across your listings</p>
        </div>

        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={prevMonth}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'white', cursor: 'pointer' }}>
            <ChevronLeft size={18} />
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h2>
          <button onClick={nextMonth}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'white', cursor: 'pointer' }}>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Calendar grid */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {DAY_NAMES.map(d => (
              <div key={d} style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, idx) => {
              if (!day) return (
                <div key={`empty-${idx}`} style={{ minHeight: 80, borderRight: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }} />
              );
              const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayBookings = bookingsByDay[dateKey] || [];
              const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

              return (
                <div key={dateKey}
                  onClick={() => dayBookings.length > 0 && setSelected(dayBookings)}
                  style={{
                    minHeight: 80, padding: '8px', borderRight: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9',
                    cursor: dayBookings.length > 0 ? 'pointer' : 'default',
                    background: dayBookings.length > 0 ? 'white' : 'white',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (dayBookings.length > 0) e.currentTarget.style.background = '#F8FAFF'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: isToday ? 800 : 500,
                    background: isToday ? 'var(--blue)' : 'transparent',
                    color: isToday ? 'white' : '#374151',
                    marginBottom: 4,
                  }}>
                    {day}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {dayBookings.slice(0, 2).map(b => {
                      const sc = STATUS_COLOR[b.booking_status] || STATUS_COLOR.pending;
                      return (
                        <div key={b.id} style={{ fontSize: 10, fontWeight: 600, padding: '2px 5px', borderRadius: 5, background: sc.bg, color: sc.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {b.room_type}
                        </div>
                      );
                    })}
                    {dayBookings.length > 2 && (
                      <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>+{dayBookings.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
          {Object.entries(STATUS_COLOR).map(([status, sc]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: sc.bg, border: `1px solid ${sc.color}30` }} />
              <span style={{ fontSize: 12, color: '#64748B', textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day detail modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setSelected(null)}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 420, padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                {new Date(selected[0].booked_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
              </h2>
              <button onClick={() => setSelected(null)}
                style={{ fontSize: 20, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>
                ×
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selected.map(b => {
                const sc = STATUS_COLOR[b.booking_status] || STATUS_COLOR.pending;
                return (
                  <div key={b.id} style={{ padding: '14px', borderRadius: 12, border: '1px solid var(--border)', background: '#FAFAFA' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{b.room_type}</p>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: sc.bg, color: sc.color }}>
                        {b.booking_status.replace('_', ' ')}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#64748B' }}>Student: {b.student_name}</p>
                    <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                      {new Date(b.booked_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
