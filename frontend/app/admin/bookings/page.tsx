'use client';
import { useState, useEffect } from 'react';
import AdminGuard from '../../../components/AdminGuard';
import AdminSidebar from '../../../components/AdminSidebar';
import api from '../../../lib/api';
import {
  Phone, RefreshCw, Loader2, Search, X,
  CheckCircle2, PhoneCall, CalendarCheck,
  RotateCcw, BedDouble, Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CFG: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  pending:          { color: '#92400E', bg: '#FFFBEB', dot: '#F59E0B', label: 'Pending'          },
  confirmed:        { color: '#1E40AF', bg: '#EFF6FF', dot: '#3B82F6', label: 'Confirmed'        },
  contact_released: { color: '#065F46', bg: '#ECFDF5', dot: '#10B981', label: 'Contact released' },
  cancelled:        { color: '#9F1239', bg: '#FFF1F2', dot: '#F43F5E', label: 'Cancelled'        },
  completed:        { color: '#065F46', bg: '#ECFDF5', dot: '#10B981', label: 'Completed'        },
  no_show:          { color: '#374151', bg: '#F3F4F6', dot: '#9CA3AF', label: 'No show'          },
};

const TABS = [
  { key: 'all',              label: 'All' },
  { key: 'confirmed',        label: 'Confirmed',        alert: true  },
  { key: 'contact_released', label: 'Contact released'               },
  { key: 'pending',          label: 'Pending'                        },
  { key: 'cancelled',        label: 'Cancelled'                      },
  { key: 'completed',        label: 'Completed'                      },
];

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [actionId, setActionId] = useState<number | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings');
      setBookings(res.data);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  };

  const releaseContact = async (id: number) => {
    try {
      setActionId(id);
      await api.patch(`/bookings/${id}/release-contact`);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, booking_status: 'contact_released' } : b));
      toast.success('Contact released to student');
    } catch { toast.error('Failed to release contact'); }
    finally { setActionId(null); }
  };

  const processRefund = async (id: number, type: 'full' | 'half') => {
    const amount = type === 'full' ? 50 : 25;
    if (!confirm(`Process GHS ${amount} refund for this booking?`)) return;
    try {
      setActionId(id);
      await api.patch(`/bookings/${id}/refund`, { refund_type: type });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, booking_status: 'cancelled' } : b));
      toast.success(`GHS ${amount} refund processed`);
    } catch { toast.error('Refund failed'); }
    finally { setActionId(null); }
  };

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || b.student_name?.toLowerCase().includes(q)
      || b.hostel_name?.toLowerCase().includes(q)
      || b.landlord_name?.toLowerCase().includes(q)
      || String(b.id).includes(q);
    const matchFilter = filter === 'all' || b.booking_status === filter;
    return matchFilter && matchSearch;
  });

  const counts: Record<string, number> = { all: bookings.length };
  TABS.forEach(t => { if (t.key !== 'all') counts[t.key] = bookings.filter(b => b.booking_status === t.key).length; });

  const revenue = bookings.filter(b => b.payment_ref && b.booking_status !== 'cancelled').length * 50;

  const thStyle: React.CSSProperties = {
    padding: '11px 14px', textAlign: 'left', fontSize: 11,
    fontWeight: 700, color: '#64748B', textTransform: 'uppercase',
    letterSpacing: '0.07em', whiteSpace: 'nowrap',
    background: '#F8FAFC', borderBottom: '1px solid var(--border)',
  };
  const tdStyle: React.CSSProperties = {
    padding: '12px 14px', fontSize: 13, color: '#374151',
    borderBottom: '1px solid #F1F5F9', verticalAlign: 'middle',
  };

  return (
    <AdminGuard>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <AdminSidebar />

        <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 20px 80px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Bookings</h1>
                <p style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>Manage viewing requests and release landlord contacts</p>
              </div>
              <button onClick={load} disabled={loading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: '1.5px solid var(--border)', background: 'white', color: '#475569', cursor: 'pointer', flexShrink: 0 }}>
                <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                Refresh
              </button>
            </div>

            {/* Stats row */}
            {!loading && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Total bookings',   value: bookings.length,                                              color: '#1E40AF', bg: '#EFF6FF' },
                  { label: 'Confirmed',         value: counts.confirmed ?? 0,                                       color: '#1E40AF', bg: '#DBEAFE' },
                  { label: 'Awaiting release',  value: counts.confirmed ?? 0,                                       color: '#92400E', bg: '#FFFBEB' },
                  { label: 'Total revenue',     value: `GHS ${revenue.toLocaleString()}`,                           color: '#065F46', bg: '#ECFDF5' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
                    <p style={{ fontSize: typeof s.value === 'string' ? 18 : 26, fontWeight: 900, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: s.color, opacity: 0.65, marginTop: 5 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Search + filter bar */}
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '14px 16px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
                <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search student, hostel, landlord or booking ID…"
                  style={{ width: '100%', paddingLeft: 34, paddingRight: search ? 32 : 12, paddingTop: 8, paddingBottom: 8, fontSize: 13, borderRadius: 9, border: '1.5px solid var(--border)', outline: 'none', background: '#FAFAFA', transition: 'border-color 0.15s', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--blue)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
                    <X size={13} />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 4, overflowX: 'auto', flexShrink: 0 }}>
                {TABS.map(tab => {
                  const count = counts[tab.key] ?? 0;
                  const active = filter === tab.key;
                  return (
                    <button key={tab.key} onClick={() => setFilter(tab.key)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 8, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', border: active ? 'none' : '1.5px solid var(--border)', cursor: 'pointer', transition: 'all 0.13s', flexShrink: 0, background: active ? 'var(--blue)' : 'white', color: active ? 'white' : '#64748B' }}>
                      {tab.label}
                      {count > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', background: active ? 'rgba(255,255,255,0.25)' : (tab.alert ? '#FEE2E2' : '#F1F5F9'), color: active ? 'white' : (tab.alert ? '#DC2626' : '#475569') }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, gap: 12 }}>
                <Loader2 size={22} style={{ color: 'var(--blue)', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 13, color: '#94A3B8' }}>Loading bookings…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '60px 20px', textAlign: 'center' }}>
                <CalendarCheck size={34} style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>No bookings found</p>
                <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Try adjusting your search or filter.</p>
              </div>
            ) : (
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>#</th>
                        <th style={thStyle}>Student</th>
                        <th style={thStyle}>Hostel / Room</th>
                        <th style={thStyle}>Landlord</th>
                        <th style={thStyle}>Payment</th>
                        <th style={thStyle}>Date</th>
                        <th style={thStyle}>Status</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((b, i) => {
                        const isLoading = actionId === b.id;
                        const rowBg = i % 2 === 0 ? 'white' : '#FAFAFA';
                        return (
                          <tr key={b.id} style={{ background: rowBg, transition: 'background 0.1s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#F0F7FF')}
                            onMouseLeave={e => (e.currentTarget.style.background = rowBg)}>

                            {/* ID */}
                            <td style={{ ...tdStyle, color: '#94A3B8', fontSize: 12, fontWeight: 600 }}>#{b.id}</td>

                            {/* Student */}
                            <td style={{ ...tdStyle, minWidth: 160 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), #3B82F6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                                  {b.student_name?.[0]?.toUpperCase()}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0, whiteSpace: 'nowrap' }}>{b.student_name}</p>
                                  {b.student_phone && (
                                    <a href={`tel:${b.student_phone}`} style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none', marginTop: 1 }}>
                                      <Phone size={10} />{b.student_phone}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Hostel / Room */}
                            <td style={{ ...tdStyle, minWidth: 180 }}>
                              <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Building2 size={12} style={{ color: '#94A3B8', flexShrink: 0 }} />{b.hostel_name}
                              </p>
                              {b.room_type && (
                                <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <BedDouble size={10} />{b.room_type}
                                </p>
                              )}
                            </td>

                            {/* Landlord */}
                            <td style={{ ...tdStyle, minWidth: 150 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>{b.landlord_name}</p>
                              {b.landlord_phone && (
                                <a href={`tel:${b.landlord_phone}`} style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none', marginTop: 2 }}>
                                  <Phone size={10} />{b.landlord_phone}
                                </a>
                              )}
                            </td>

                            {/* Payment */}
                            <td style={tdStyle}>
                              {b.payment_ref ? (
                                <div>
                                  <p style={{ fontSize: 13, fontWeight: 700, color: '#065F46', margin: 0 }}>GHS {b.viewing_fee || 50}</p>
                                  <p style={{ fontSize: 10, color: '#94A3B8', margin: '2px 0 0', fontFamily: 'monospace', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.payment_ref}</p>
                                </div>
                              ) : (
                                <span style={{ fontSize: 12, color: '#94A3B8' }}>Not paid</span>
                              )}
                            </td>

                            {/* Date */}
                            <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: '#64748B', fontSize: 12 }}>
                              {b.booked_at ? new Date(b.booked_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </td>

                            {/* Status */}
                            <td style={tdStyle}><StatusBadge status={b.booking_status} /></td>

                            {/* Actions */}
                            <td style={{ ...tdStyle, minWidth: 160, textAlign: 'center' }}>
                              {isLoading ? (
                                <Loader2 size={16} style={{ color: 'var(--blue)', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
                                  {b.booking_status === 'confirmed' && (
                                    <button onClick={() => releaseContact(b.id)}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: '#065F46', color: 'white', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                      <PhoneCall size={12} /> Release contact
                                    </button>
                                  )}
                                  {['confirmed', 'contact_released'].includes(b.booking_status) && (
                                    <div style={{ display: 'flex', gap: 5 }}>
                                      <button onClick={() => processRefund(b.id, 'full')}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        <RotateCcw size={10} /> Full refund
                                      </button>
                                      <button onClick={() => processRefund(b.id, 'half')}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        <RotateCcw size={10} /> 50% refund
                                      </button>
                                    </div>
                                  )}
                                  {b.booking_status === 'pending' && (
                                    <span style={{ fontSize: 11, color: '#94A3B8' }}>Awaiting payment</span>
                                  )}
                                  {['cancelled', 'completed', 'no_show'].includes(b.booking_status) && (
                                    <span style={{ fontSize: 11, color: '#CBD5E1' }}>—</span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div style={{ padding: '10px 16px', borderTop: '1px solid #F1F5F9', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>
                    {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
                    {(search || filter !== 'all') ? ` (filtered from ${bookings.length} total)` : ''}
                  </span>
                  {(search || filter !== 'all') && (
                    <button onClick={() => { setSearch(''); setFilter('all'); }}
                      style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
