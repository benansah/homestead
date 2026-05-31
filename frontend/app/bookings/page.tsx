'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import {
  MapPin, Phone, Clock, CheckCircle2, XCircle,
  AlertCircle, Loader2, Home, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Booking, GroupBooking } from '../../types';
import Link from 'next/link';
import { UsersRound, Copy, Check } from 'lucide-react';

const STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
  description: string;
}> = {
  pending: {
    label: 'Pending',
    color: '#B45309',
    bg: '#FFF9EB',
    icon: <Clock size={14} />,
    description: 'Awaiting payment and admin confirmation',
  },
  confirmed: {
    label: 'Confirmed',
    color: '#1D4ED8',
    bg: '#EFF6FF',
    icon: <CheckCircle2 size={14} />,
    description: 'Admin is confirming availability with landlord',
  },
  contact_released: {
    label: 'Contact Released',
    color: '#065F46',
    bg: '#ECFDF5',
    icon: <CheckCircle2 size={14} />,
    description: 'Landlord contact shared — go for your viewing!',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#9F1239',
    bg: '#FFF1F2',
    icon: <XCircle size={14} />,
    description: 'This booking was cancelled',
  },
  completed: {
    label: 'Completed',
    color: '#065F46',
    bg: '#ECFDF5',
    icon: <CheckCircle2 size={14} />,
    description: 'Viewing completed',
  },
  no_show: {
    label: 'No Show',
    color: '#6B7280',
    bg: '#F9FAFB',
    icon: <AlertCircle size={14} />,
    description: 'You did not attend the viewing',
  },
};

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings]       = useState<Booking[]>([]);
  const [groupBookings, setGroupBookings] = useState<GroupBooking[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState<'all' | 'active' | 'past' | 'groups'>('all');
  const [copiedId, setCopiedId]       = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const [soloRes, groupRes] = await Promise.all([
          api.get('/bookings/my-bookings'),
          api.get('/bookings/group/my'),
        ]);
        setBookings(soloRes.data);
        setGroupBookings(groupRes.data);
      } catch {
        toast.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user, authLoading]);

  const filtered = bookings.filter(b => {
    if (activeTab === 'active') return ['pending', 'confirmed', 'contact_released'].includes(b.booking_status);
    if (activeTab === 'past') return ['cancelled', 'completed', 'no_show'].includes(b.booking_status);
    return true;
  });

  const activeCount = bookings.filter(b =>
    ['pending', 'confirmed', 'contact_released'].includes(b.booking_status)
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your viewing requests and landlord contacts
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total bookings', value: bookings.length, color: '#1D4ED8', bg: '#EFF6FF' },
            { label: 'Active',         value: activeCount,      color: '#065F46', bg: '#ECFDF5' },
            { label: 'Total spent',
              value: `GHS ${bookings.filter(b => b.payment_ref).length * 50}`,
              color: '#6B21A8', bg: '#F5F3FF' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-xl p-4 text-center"
              style={{ border: '1px solid var(--border)' }}>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
          {([
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'past', label: 'Past' },
            { key: 'groups', label: `Groups${groupBookings.length > 0 ? ` (${groupBookings.length})` : ''}` },
          ] as const).map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
              style={{
                background: activeTab === tab.key ? '#fff' : 'transparent',
                color: activeTab === tab.key ? 'var(--text)' : '#6B7280',
                boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}>
              {tab.label}
              {tab.key === 'active' && activeCount > 0 && (
                <span className="ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: 'var(--blue)' }}>
                  {activeCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Group bookings tab */}
        {activeTab === 'groups' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 size={28} className="animate-spin text-blue-500" />
              </div>
            ) : groupBookings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl"
                style={{ border: '1px solid var(--border)' }}>
                <UsersRound size={40} className="mx-auto text-gray-200 mb-3" />
                <p className="font-semibold text-gray-600 mb-1">No group bookings yet</p>
                <p className="text-sm text-gray-400 mb-5">
                  Use "Book with friends" on any hostel to create one
                </p>
                <Link href="/"
                  className="inline-block px-5 py-2.5 text-sm font-semibold text-white rounded-lg"
                  style={{ background: 'var(--blue)' }}>
                  Browse hostels
                </Link>
              </div>
            ) : groupBookings.map(gb => {
              const statusColor: Record<string, string> = { open: '#1D4ED8', full: '#065F46', cancelled: '#9F1239' };
              const color = statusColor[gb.status] || '#6B7280';
              return (
                <div key={gb.id} className="bg-white rounded-2xl overflow-hidden"
                  style={{ border: '1px solid var(--border)' }}>
                  <div className="px-5 py-2.5 flex items-center justify-between"
                    style={{ background: `${color}10`, borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color }}>
                      <UsersRound size={14} />
                      Group #{gb.id} · {gb.status.charAt(0).toUpperCase() + gb.status.slice(1)}
                    </div>
                    <span className="text-xs" style={{ color }}>
                      {gb.member_count ?? 0} / {gb.max_members} members
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 mb-1">{gb.hostel_name}</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {gb.room_type} · GHS {Number(gb.price || 0).toLocaleString()}/yr
                    </p>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Members joined</span>
                        <span>{gb.member_count ?? 0} of {gb.max_members}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${((gb.member_count ?? 0) / gb.max_members) * 100}%`,
                            background: 'var(--blue)',
                          }} />
                      </div>
                    </div>

                    {/* Share code */}
                    {gb.status === 'open' && (
                      <div className="flex items-center justify-between gap-3 p-3 rounded-xl mb-3"
                        style={{ background: 'var(--blue-light)', border: '1px solid #BFDBFE' }}>
                        <div>
                          <p className="text-xs font-semibold text-blue-700 mb-0.5">Share this code with friends</p>
                          <p className="text-lg font-black tracking-widest" style={{ color: 'var(--blue)' }}>
                            #{gb.id}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(String(gb.id));
                            setCopiedId(gb.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white"
                          style={{ background: 'var(--blue)' }}>
                          {copiedId === gb.id ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                        </button>
                      </div>
                    )}

                    <div className="text-xs text-gray-400">
                      My status: <span className="font-semibold text-gray-600 capitalize">{gb.my_status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Solo booking list */}
        {activeTab !== 'groups' && (loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl"
            style={{ border: '1px solid var(--border)' }}>
            <Home size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="font-semibold text-gray-600 mb-1">No bookings yet</p>
            <p className="text-sm text-gray-400 mb-5">
              Find a hostel and book your first viewing
            </p>
            <Link href="/"
              className="inline-block px-5 py-2.5 text-sm font-semibold text-white rounded-lg"
              style={{ background: 'var(--blue)' }}>
              Browse hostels
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(booking => {
              const cfg = STATUS_CONFIG[booking.booking_status] || STATUS_CONFIG.pending;
              return (
                <div key={booking.id} className="bg-white rounded-2xl overflow-hidden"
                  style={{ border: '1px solid var(--border)' }}>

                  {/* Status bar */}
                  <div className="px-5 py-2.5 flex items-center justify-between"
                    style={{ background: cfg.bg, borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 text-sm font-semibold"
                      style={{ color: cfg.color }}>
                      {cfg.icon}
                      {cfg.label}
                    </div>
                    <p className="text-xs" style={{ color: cfg.color }}>{cfg.description}</p>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Hostel name */}
                        <h3 className="font-bold text-gray-900 text-base mb-1">
                          {booking.hostel_name}
                        </h3>

                        {/* Address */}
                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                          <MapPin size={13} />
                          {booking.hostel_address}
                        </div>

                        {/* Room details */}
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          {[
                            { label: 'Room type',    value: booking.room_type || '—' },
                            { label: 'Annual price', value: `GHS ${Number(booking.price || 0).toLocaleString()}` },
                            { label: 'Viewing fee',  value: `GHS ${booking.viewing_fee || 50}` },
                          ].map(({ label, value }) => (
                            <div key={label} className="rounded-lg p-2.5"
                              style={{ background: '#F8F9FA', border: '1px solid var(--border)' }}>
                              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                              <p className="text-sm font-semibold text-gray-800">{value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Landlord contact — only when released */}
                        {booking.booking_status === 'contact_released' && booking.landlord_phone && (
                          <div className="flex items-center gap-3 p-3 rounded-xl mt-2"
                            style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center"
                              style={{ background: '#D1FAE5' }}>
                              <Phone size={16} style={{ color: '#065F46' }} />
                            </div>
                            <div>
                              <p className="text-xs text-green-700 font-semibold">
                                Landlord contact released
                              </p>
                              <p className="text-sm font-bold text-green-900">
                                {booking.landlord_name} · {booking.landlord_phone}
                              </p>
                            </div>
                            <a href={`tel:${booking.landlord_phone}`}
                              className="ml-auto px-3 py-1.5 text-xs font-semibold rounded-lg text-white"
                              style={{ background: '#065F46' }}>
                              Call
                            </a>
                          </div>
                        )}

                        {/* Payment pending message */}
                        {booking.booking_status === 'pending' && !booking.payment_ref && (
                          <div className="flex items-center justify-between p-3 rounded-xl mt-2"
                            style={{ background: '#FFF9EB', border: '1px solid #FDE68A' }}>
                            <p className="text-xs text-amber-700">
                              Complete your payment to confirm this booking
                            </p>
                            <Link
                              href={`/api/bookings/retry/${booking.id}`}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                              style={{ background: '#B45309' }}>
                              Pay now
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Booking ID + date */}
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400">Booking #{booking.id}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {booking.booked_at
                            ? new Date(booking.booked_at).toLocaleDateString('en-GB', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}