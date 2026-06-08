'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import {
  Bell, CheckCheck, Trash2, Loader2,
  Home, CreditCard, Star, Users, Settings, Gift, CalendarCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Notification } from '../../types';

/* ── Type config ─────────────────────────────────────────── */
const TYPE: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  booking:      { icon: <CalendarCheck size={20} />, color: '#1D4ED8', bg: '#EFF6FF', label: 'Booking' },
  payment:      { icon: <CreditCard size={20} />,    color: '#059669', bg: '#ECFDF5', label: 'Payment' },
  availability: { icon: <Home size={20} />,          color: '#D97706', bg: '#FFFBEB', label: 'Availability' },
  review:       { icon: <Star size={20} />,          color: '#7C3AED', bg: '#F5F3FF', label: 'Review' },
  referral:     { icon: <Gift size={20} />,          color: '#BE185D', bg: '#FDF2F8', label: 'Referral' },
  roommate:     { icon: <Users size={20} />,         color: '#0891B2', bg: '#ECFEFF', label: 'Roommate' },
  system:       { icon: <Settings size={20} />,      color: '#475569', bg: '#F8FAFC', label: 'System' },
};

/* ── Relative time ────────────────────────────────────────── */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [all,    setAll]    = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoad]  = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    api.get('/notifications')
      .then(r => { setAll(r.data.notifications || []); setUnread(r.data.unread_count || 0); })
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoad(false));
  }, [user, authLoading, router]);

  const shown = filter === 'unread' ? all.filter(n => !n.is_read) : all;

  const markAllRead = async () => {
    await api.patch('/notifications/read-all').catch(() => {});
    setAll(p => p.map(n => ({ ...n, is_read: true })));
    setUnread(0);
    toast.success('All marked as read');
  };

  const markOne = async (id: number) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setAll(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(p => Math.max(0, p - 1));
  };

  const deleteOne = async (id: number) => {
    await api.delete(`/notifications/${id}`).catch(() => {});
    const n = all.find(x => x.id === id);
    setAll(p => p.filter(x => x.id !== id));
    if (n && !n.is_read) setUnread(p => Math.max(0, p - 1));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />

      {/* ── Page header ── */}
      <div className="page-header-0" style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '40px 32px 0' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Bell size={26} style={{ color: 'var(--blue)' }} />
                {unread > 0 && (
                  <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 22, height: 22, borderRadius: 99, background: '#EF4444', color: 'white', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </div>
              <div>
                <h1 style={{ fontSize: 'clamp(22px,4vw,30px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>Notifications</h1>
                <p style={{ fontSize: 15, color: '#64748B', marginTop: 2 }}>
                  {unread > 0 ? `${unread} unread notification${unread !== 1 ? 's' : ''}` : 'All caught up ✓'}
                </p>
              </div>
            </div>

            {unread > 0 && (
              <button onClick={markAllRead}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', border: '1.5px solid var(--border)', borderRadius: 12, fontSize: 15, fontWeight: 600, color: '#374151', background: 'white', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'white')}>
                <CheckCheck size={17} style={{ color: 'var(--blue)' }} /> Mark all read
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 0 }}>
            {([['all', 'All'], ['unread', `Unread${unread > 0 ? ` (${unread})` : ''}`]] as const).map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)}
                style={{ padding: '13px 24px', fontSize: 15, fontWeight: filter === k ? 700 : 500, color: filter === k ? 'var(--blue)' : '#64748B', background: 'none', border: 'none', cursor: 'pointer', borderBottom: `3px solid ${filter === k ? 'var(--blue)' : 'transparent'}`, transition: 'all 0.15s', marginBottom: -1 }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── List ── */}
      <div className="page-content" style={{ maxWidth: 760, margin: '0 auto', padding: '32px 32px 80px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <Loader2 size={36} style={{ color: 'var(--blue)' }} className="animate-spin" />
          </div>

        ) : shown.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 24, border: '1px solid var(--border)', padding: '80px 40px', textAlign: 'center', boxShadow: 'var(--sh-sm)' }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
              <Bell size={44} style={{ color: 'var(--blue-mid)' }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h2>
            <p style={{ fontSize: 17, color: '#64748B', lineHeight: 1.7 }}>
              {filter === 'unread'
                ? 'You\'re all caught up! Switch to "All" to see past notifications.'
                : 'We\'ll notify you about bookings, landlord contacts, roommate requests, and more.'}
            </p>
            {filter === 'unread' && all.length > 0 && (
              <button onClick={() => setFilter('all')}
                style={{ marginTop: 28, padding: '14px 28px', background: 'var(--blue)', color: 'white', borderRadius: 12, fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                View all notifications
              </button>
            )}
          </div>

        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {shown.map(n => {
              const cfg = TYPE[n.not_type] || TYPE.system;
              const isUnread = !n.is_read;
              return (
                <div key={n.id}
                  onClick={() => isUnread && markOne(n.id)}
                  style={{
                    background: isUnread ? '#F0F7FF' : 'white',
                    borderRadius: 18,
                    border: `1.5px solid ${isUnread ? 'var(--blue-mid)' : 'var(--border)'}`,
                    padding: '20px 20px 20px 22px',
                    display: 'flex', alignItems: 'flex-start', gap: 16,
                    cursor: isUnread ? 'pointer' : 'default',
                    transition: 'all 0.15s',
                    boxShadow: isUnread ? '0 2px 8px rgba(0,106,255,0.08)' : 'var(--sh-sm)',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (isUnread) (e.currentTarget as HTMLElement).style.boxShadow = 'var(--sh-md)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = isUnread ? '0 2px 8px rgba(0,106,255,0.08)' : 'var(--sh-sm)'; }}>

                  {/* Unread dot */}
                  {isUnread && (
                    <div style={{ position: 'absolute', top: 22, left: 8, width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)' }} />
                  )}

                  {/* Icon */}
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: cfg.color }}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 16, lineHeight: 1.65, color: isUnread ? '#0F172A' : '#374151', fontWeight: isUnread ? 600 : 400, marginBottom: 10 }}>
                      {n.not_message}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: 13, color: '#94A3B8' }}>
                        {n.created_at ? timeAgo(n.created_at) : '—'}
                      </span>
                      {isUnread && (
                        <span style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 600 }}>· Tap to mark read</span>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <button onClick={e => { e.stopPropagation(); deleteOne(n.id); }}
                    style={{ padding: '8px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: '#CBD5E1', flexShrink: 0, transition: 'all 0.15s' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#FEF2F2'; el.style.color = '#EF4444'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = '#CBD5E1'; }}>
                    <Trash2 size={17} />
                  </button>
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
