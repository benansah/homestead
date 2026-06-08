'use client';
import { useState, useEffect } from 'react';
import AdminGuard from '../../components/AdminGuard';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../lib/api';
import { Building2, CalendarCheck, Users, TrendingUp, CheckCircle2, Clock, ArrowRight, Loader2, AlertCircle, PhoneCall, Bell } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Stats {
  total_hostels: number; pending_hostels: number; approved_hostels: number;
  total_bookings: number; confirmed_bookings: number; pending_bookings: number;
  total_users: number; student_count: number; landlord_count: number;
  total_revenue: number;
}

interface RevStats {
  total_revenue: number;
  by_university: { university: string; revenue: number }[];
  top_landlords: { fullname: string; revenue: number }[];
  monthly: { month: string; count: number }[];
}

const S: React.CSSProperties = { display: 'flex', minHeight: '100vh', background: '#F8FAFC' };
const MAIN: React.CSSProperties = { flex: 1, padding: '32px', overflowY: 'auto', minWidth: 0 };
// admin-page-wrap + admin-page-main classes make these responsive on mobile (see globals.css)

export default function AdminDashboard() {
  const [stats, setStats]       = useState<Stats | null>(null);
  const [revStats, setRevStats] = useState<RevStats | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [hostels, setHostels]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [bRes, hRes, uRes, rRes] = await Promise.all([
          api.get('/bookings'),
          api.get('/hostels'),
          api.get('/users'),
          api.get('/bookings/admin-stats').catch(() => ({ data: null })),
        ]);
        const b = bRes.data, h = hRes.data, u = uRes.data;
        setBookings(b.slice(0, 6));
        setHostels(h.filter((x: any) => x.status === 'pending').slice(0, 5));
        setStats({
          total_hostels: h.length, pending_hostels: h.filter((x: any) => x.status === 'pending').length,
          approved_hostels: h.filter((x: any) => x.status === 'approved').length,
          total_bookings: b.length, confirmed_bookings: b.filter((x: any) => x.booking_status === 'confirmed').length,
          pending_bookings: b.filter((x: any) => x.booking_status === 'pending').length,
          total_users: u.length, student_count: u.filter((x: any) => x.role === 'student').length,
          landlord_count: u.filter((x: any) => x.role === 'landlord').length,
          total_revenue: b.filter((x: any) => x.payment_ref).length * 50,
        });
        if (rRes.data) setRevStats(rRes.data);
      } catch { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) { toast.error('Message is required'); return; }
    if (!confirm(`Send this message to all users?\n\n"${broadcastMsg}"`)) return;
    try {
      setBroadcasting(true);
      await api.post('/notifications/broadcast', { message: broadcastMsg });
      toast.success('Notification sent to all users');
      setBroadcastMsg('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send');
    } finally { setBroadcasting(false); }
  };

  const STATS = stats ? [
    { label: 'Total hostels',  value: stats.total_hostels,  sub: `${stats.pending_hostels} pending`,   icon: Building2,    color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Total bookings', value: stats.total_bookings, sub: `${stats.confirmed_bookings} confirmed`, icon: CalendarCheck, color: '#10B981', bg: '#ECFDF5' },
    { label: 'Total users',    value: stats.total_users,    sub: `${stats.student_count} students`,     icon: Users,        color: '#8B5CF6', bg: '#F5F3FF' },
    { label: 'Revenue (GHS)',  value: `${stats.total_revenue.toLocaleString()}`, sub: 'Viewing fees collected', icon: TrendingUp, color: '#F59E0B', bg: '#FFFBEB' },
  ] : [];

  const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
    pending:          { color: '#D97706', bg: '#FEF3C7', label: 'Pending' },
    confirmed:        { color: '#2563EB', bg: '#DBEAFE', label: 'Confirmed' },
    contact_released: { color: '#059669', bg: '#D1FAE5', label: 'Contact released' },
    cancelled:        { color: '#DC2626', bg: '#FEE2E2', label: 'Cancelled' },
    completed:        { color: '#059669', bg: '#D1FAE5', label: 'Completed' },
  };

  return (
    <AdminGuard>
      <div className="admin-page-wrap" style={S}>
        <AdminSidebar />
        <main className="admin-page-main" style={MAIN}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Overview</h1>
            <p style={{ fontSize: 14, color: '#64748B' }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <Loader2 size={28} style={{ color: '#3B82F6' }} className="animate-spin" />
            </div>
          ) : (
            <>
              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
                {STATS.map(({ label, value, sub, icon: Icon, color, bg }) => (
                  <div key={label} style={{ background: 'white', borderRadius: 16, padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                      <Icon size={20} style={{ color }} />
                    </div>
                    <p style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{value}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginTop: 4 }}>{label}</p>
                    <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{sub}</p>
                  </div>
                ))}
              </div>

              {/* Action needed banner */}
              {(stats?.pending_hostels ?? 0) > 0 || (stats?.confirmed_bookings ?? 0) > 0 ? (
                <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 14, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <AlertCircle size={18} style={{ color: '#CA8A04', flexShrink: 0 }} />
                  <p style={{ fontSize: 14, color: '#854D0E', fontWeight: 500 }}>
                    <strong>{(stats?.pending_hostels ?? 0) + (stats?.confirmed_bookings ?? 0)} items</strong> need your attention —
                    {stats?.pending_hostels ? ` ${stats.pending_hostels} listing${stats.pending_hostels > 1 ? 's' : ''} to review` : ''}
                    {stats?.confirmed_bookings ? ` · ${stats.confirmed_bookings} contact${stats.confirmed_bookings > 1 ? 's' : ''} to release` : ''}
                  </p>
                </div>
              ) : null}

              {/* Revenue breakdown */}
              {revStats && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>

                  {/* Revenue by university */}
                  <div style={{ gridColumn: 'span 2', background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Revenue by university</p>
                    {revStats.by_university.length === 0 ? (
                      <p style={{ fontSize: 13, color: '#94A3B8' }}>No data yet</p>
                    ) : (() => {
                      const max = Math.max(...revStats.by_university.map(u => u.revenue), 1);
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {revStats.by_university.map(u => (
                            <div key={u.university}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{u.university}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>GHS {u.revenue.toLocaleString()}</span>
                              </div>
                              <div style={{ height: 6, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 99, background: 'var(--blue)', width: `${(u.revenue / max) * 100}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Top landlords */}
                  <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Top landlords</p>
                    {revStats.top_landlords.length === 0 ? (
                      <p style={{ fontSize: 13, color: '#94A3B8' }}>No data yet</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {revStats.top_landlords.map((l, i) => (
                          <div key={l.fullname} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ width: 22, height: 22, borderRadius: '50%', background: i === 0 ? '#FEF9C3' : '#F1F5F9', color: i === 0 ? '#854D0E' : '#64748B', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {i + 1}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.fullname}</p>
                              <p style={{ fontSize: 12, color: '#64748B' }}>GHS {l.revenue.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Two columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                {/* Pending listings */}
                <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Building2 size={16} style={{ color: '#64748B' }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Pending listings</span>
                      {hostels.length > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, background: '#FEF9C3', color: '#854D0E', padding: '2px 8px', borderRadius: 99 }}>{hostels.length}</span>
                      )}
                    </div>
                    <Link href="/admin/listings" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#3B82F6', textDecoration: 'none' }}>
                      View all <ArrowRight size={13} />
                    </Link>
                  </div>
                  {hostels.length === 0 ? (
                    <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                      <CheckCircle2 size={28} style={{ color: '#34D399', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 13, color: '#94A3B8' }}>All caught up!</p>
                    </div>
                  ) : (
                    hostels.map((h: any) => (
                      <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #F8FAFC' }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{h.hostel_name}</p>
                          <p style={{ fontSize: 12, color: '#94A3B8' }}>🎓 {h.university}</p>
                        </div>
                        <Link href="/admin/listings" style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, background: '#EFF6FF', color: '#2563EB', textDecoration: 'none' }}>
                          Review →
                        </Link>
                      </div>
                    ))
                  )}
                </div>

                {/* Recent bookings */}
                <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CalendarCheck size={16} style={{ color: '#64748B' }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Recent bookings</span>
                    </div>
                    <Link href="/admin/bookings" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#3B82F6', textDecoration: 'none' }}>
                      View all <ArrowRight size={13} />
                    </Link>
                  </div>
                  {bookings.length === 0 ? (
                    <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                      <p style={{ fontSize: 13, color: '#94A3B8' }}>No bookings yet</p>
                    </div>
                  ) : (
                    bookings.map((b: any) => {
                      const ss = STATUS_STYLES[b.booking_status] || STATUS_STYLES.pending;
                      return (
                        <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px', borderBottom: '1px solid #F8FAFC' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#E0EDFF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                              {b.student_name?.[0]?.toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.student_name}</p>
                              <p style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.hostel_name}</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: ss.bg, color: ss.color }}>{ss.label}</span>
                            {b.booking_status === 'confirmed' && (
                              <Link href="/admin/bookings" style={{ fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 7, background: '#D1FAE5', color: '#059669', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <PhoneCall size={11} /> Release
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Broadcast notification */}
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FEF9C3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bell size={16} style={{ color: '#854D0E' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>Broadcast notification</p>
                    <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Send a message to all registered users</p>
                  </div>
                </div>
                <form onSubmit={handleBroadcast}>
                  <textarea
                    value={broadcastMsg}
                    onChange={e => setBroadcastMsg(e.target.value)}
                    placeholder="e.g. We're doing maintenance on Saturday from 2–4pm. The site may be temporarily unavailable."
                    rows={2}
                    style={{ width: '100%', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '10px 12px', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', color: '#0F172A', boxSizing: 'border-box' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                  />
                  <button type="submit" disabled={broadcasting || !broadcastMsg.trim()}
                    style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#854D0E', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: broadcasting || !broadcastMsg.trim() ? 'not-allowed' : 'pointer', opacity: broadcasting || !broadcastMsg.trim() ? 0.6 : 1 }}>
                    {broadcasting ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} />}
                    {broadcasting ? 'Sending…' : 'Send to all users'}
                  </button>
                </form>
              </div>
            </>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
