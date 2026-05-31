'use client';
import { useState, useEffect } from 'react';
import AdminGuard from '../../../components/AdminGuard';
import AdminSidebar from '../../../components/AdminSidebar';
import api from '../../../lib/api';
import {
  Phone, RefreshCw, Loader2, Search,
  CheckCircle2, PhoneCall
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminBookings() {
  const [bookings, setBookings]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [actionId, setActionId]   = useState<number | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings');
      setBookings(res.data);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const releaseContact = async (id: number) => {
    try {
      setActionId(id);
      await api.patch(`/bookings/${id}/release-contact`);
      setBookings(prev => prev.map(b =>
        b.id === id ? { ...b, booking_status: 'contact_released' } : b
      ));
      toast.success('Landlord contact released to student');
    } catch {
      toast.error('Failed to release contact');
    } finally {
      setActionId(null);
    }
  };

  const processRefund = async (id: number, type: 'full' | 'half') => {
    const amount = type === 'full' ? 50 : 25;
    if (!confirm(`Process GHS ${amount} refund for this booking?`)) return;
    try {
      setActionId(id);
      await api.patch(`/bookings/${id}/refund`, { refund_type: type });
      setBookings(prev => prev.map(b =>
        b.id === id ? { ...b, booking_status: 'cancelled' } : b
      ));
      toast.success(`GHS ${amount} refund processed`);
    } catch {
      toast.error('Refund failed');
    } finally {
      setActionId(null);
    }
  };

  const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
    pending:          { color: '#B45309', bg: '#FFF9EB', label: 'Pending' },
    confirmed:        { color: '#1D4ED8', bg: '#EFF6FF', label: 'Confirmed' },
    contact_released: { color: '#065F46', bg: '#ECFDF5', label: 'Contact released' },
    cancelled:        { color: '#9F1239', bg: '#FFF1F2', label: 'Cancelled' },
    completed:        { color: '#065F46', bg: '#ECFDF5', label: 'Completed' },
    no_show:          { color: '#6B7280', bg: '#F9FAFB', label: 'No show' },
  };

  const filtered = bookings.filter(b => {
    const matchFilter = filter === 'all' || b.booking_status === filter;
    const matchSearch =
      b.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.hostel_name?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage viewing requests and release landlord contacts
              </p>
            </div>
            <button onClick={load}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                         rounded-lg border hover:bg-gray-50 transition-colors text-gray-700"
              style={{ borderColor: 'var(--border)' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 max-w-xs relative">
              <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search student or hostel..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none"
                style={{ border: '1px solid var(--border)' }} />
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {['all', 'pending', 'confirmed', 'contact_released', 'cancelled'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                  style={{
                    background: filter === f ? '#fff' : 'transparent',
                    color: filter === f ? 'var(--text)' : '#6B7280',
                    boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}>
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={28} className="animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(booking => {
                const ss = STATUS_STYLES[booking.booking_status] || STATUS_STYLES.pending;
                const isLoading = actionId === booking.id;
                return (
                  <div key={booking.id} className="bg-white rounded-xl overflow-hidden"
                    style={{ border: '1px solid var(--border)' }}>

                    {/* Status bar */}
                    <div className="px-4 py-2 flex items-center justify-between"
                      style={{ background: ss.bg, borderBottom: '1px solid var(--border)' }}>
                      <span className="text-xs font-semibold" style={{ color: ss.color }}>
                        {ss.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        Booking #{booking.id} · {booking.booked_at
                          ? new Date(booking.booked_at).toLocaleDateString('en-GB')
                          : '—'}
                      </span>
                    </div>

                    <div className="p-4 flex items-start justify-between gap-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Student</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {booking.student_name}
                          </p>
                          <p className="text-xs text-gray-500">{booking.student_phone}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Hostel</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {booking.hostel_name}
                          </p>
                          <p className="text-xs text-gray-500">{booking.room_type}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Landlord</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {booking.landlord_name}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone size={10} /> {booking.landlord_phone}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Payment</p>
                          <p className="text-sm font-semibold text-gray-900">
                            GHS {booking.viewing_fee || 50}
                          </p>
                          <p className="text-xs text-gray-500 font-mono truncate">
                            {booking.payment_ref || 'Not paid'}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 shrink-0">
                        {isLoading ? (
                          <Loader2 size={18} className="animate-spin text-blue-500 mx-auto" />
                        ) : (
                          <>
                            {booking.booking_status === 'confirmed' && (
                              <button onClick={() => releaseContact(booking.id)}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs
                                           font-semibold rounded-lg text-white whitespace-nowrap"
                                style={{ background: '#065F46' }}>
                                <PhoneCall size={13} /> Release contact
                              </button>
                            )}
                            {['confirmed', 'contact_released'].includes(booking.booking_status) && (
                              <>
                                <button onClick={() => processRefund(booking.id, 'full')}
                                  className="px-3 py-2 text-xs font-semibold rounded-lg
                                             border text-gray-600 hover:bg-gray-50 transition-colors
                                             whitespace-nowrap"
                                  style={{ borderColor: 'var(--border)' }}>
                                  Full refund
                                </button>
                                <button onClick={() => processRefund(booking.id, 'half')}
                                  className="px-3 py-2 text-xs font-semibold rounded-lg
                                             border text-gray-600 hover:bg-gray-50 transition-colors
                                             whitespace-nowrap"
                                  style={{ borderColor: 'var(--border)' }}>
                                  50% refund
                                </button>
                              </>
                            )}
                            {booking.booking_status === 'pending' && (
                              <span className="text-xs text-gray-400 text-center px-2">
                                Awaiting payment
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl"
                  style={{ border: '1px solid var(--border)' }}>
                  <CheckCircle2 size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No bookings found</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}