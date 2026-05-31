'use client';
import { useState, useEffect } from 'react';
import LandlordGuard from '../../components/LandlordGuard';
import Navbar from '../../components/Navbar';
import api from '../../lib/api';
import {
  Plus, Building2, BedDouble, CalendarCheck,
  Eye, EyeOff, Loader2,
  ShieldCheck, Clock, CheckCircle2,
  Phone, GraduationCap, BadgeCheck
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function LandlordDashboard() {
  const { user } = useAuth();
  const [hostels, setHostels]   = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [hRes, bRes] = await Promise.all([
          api.get('/hostels'),
          api.get('/bookings/landlord').catch(() => ({ data: [] })),
        ]);
        const myHostels = hRes.data.filter(
          (h: any) => h.landlord_id === user?.id
        );
        setHostels(myHostels);
        setBookings(bRes.data || []);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user]);

  const totalRooms = hostels.reduce((s: number, h: any) => s + (h.total_rooms || 0), 0);
  const pendingCount = hostels.filter(h => h.status === 'pending').length;
  const approvedCount = hostels.filter(h => h.status === 'approved').length;

  const STATUS_STYLES: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    approved: { color: '#065F46', bg: '#ECFDF5', icon: <CheckCircle2 size={13} /> },
    pending:  { color: '#B45309', bg: '#FFF9EB', icon: <Clock size={13} /> },
    rejected: { color: '#9F1239', bg: '#FFF1F2', icon: <Clock size={13} /> },
    hidden:   { color: '#374151', bg: '#F9FAFB', icon: <EyeOff size={13} /> },
  };

  return (
    <LandlordGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-5xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user?.fullname?.split(' ')[0]} 👋
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your hostel listings and bookings
              </p>
            </div>
            <Link href="/landlord/create"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold
                         text-white rounded-xl hover:opacity-90 transition-opacity"
              style={{ background: 'var(--blue)' }}>
              <Plus size={16} /> Add hostel
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'My hostels',       value: hostels.length,  color: 'var(--blue)', bg: 'var(--blue-light)', icon: Building2 },
                  { label: 'Total rooms',       value: totalRooms,      color: '#065F46',     bg: '#ECFDF5',           icon: BedDouble },
                  { label: 'Approved',          value: approvedCount,   color: '#065F46',     bg: '#ECFDF5',           icon: CheckCircle2 },
                  { label: 'Pending approval',  value: pendingCount,    color: '#B45309',     bg: '#FFF9EB',           icon: Clock },
                ].map(({ label, value, color, bg, icon: Icon }) => (
                  <div key={label} className="bg-white rounded-xl p-5"
                    style={{ border: '1px solid var(--border)' }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                      style={{ background: bg }}>
                      <Icon size={20} style={{ color }} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* No hostels yet */}
              {hostels.length === 0 && (
                <div className="bg-white rounded-2xl p-12 text-center mb-6"
                  style={{ border: '1px solid var(--border)' }}>
                  <Building2 size={48} className="mx-auto text-gray-200 mb-4" />
                  <h2 className="text-lg font-bold text-gray-700 mb-2">
                    No listings yet
                  </h2>
                  <p className="text-sm text-gray-400 mb-6">
                    Add your first hostel to start receiving bookings
                  </p>
                  <Link href="/landlord/create"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm
                               font-semibold text-white rounded-xl"
                    style={{ background: 'var(--blue)' }}>
                    <Plus size={16} /> Add your first hostel
                  </Link>
                </div>
              )}

              {/* My listings */}
              {hostels.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">My listings</h2>
                  <div className="space-y-3">
                    {hostels.map(hostel => {
                      const ss = STATUS_STYLES[hostel.status] || STATUS_STYLES.pending;
                      return (
                        <div key={hostel.id} className="bg-white rounded-xl p-4"
                          style={{ border: '1px solid var(--border)' }}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900">
                                  {hostel.hostel_name}
                                </h3>
                                {hostel.is_verified && (
                                  <span className="flex items-center gap-1 text-xs
                                                   font-semibold px-2 py-0.5 rounded-full"
                                    style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
                                    <ShieldCheck size={10} /> Verified
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-xs
                                                 font-semibold px-2 py-0.5 rounded-full capitalize"
                                  style={{ background: ss.bg, color: ss.color }}>
                                  {ss.icon} {hostel.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mb-2">
                                🎓 {hostel.university} · {hostel.hostel_address}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>{hostel.total_rooms || 0} rooms</span>
                                <span>{hostel.available_rooms || 0} available</span>
                                {hostel.min_price && (
                                  <span className="font-semibold"
                                    style={{ color: 'var(--blue)' }}>
                                    From GHS {Number(hostel.min_price).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Pending message */}
                            {hostel.status === 'pending' && (
                              <div className="text-xs text-amber-700 bg-amber-50 px-3 py-2
                                              rounded-lg text-center max-w-xs"
                                style={{ border: '1px solid #FDE68A' }}>
                                <Clock size={12} className="mx-auto mb-1" />
                                Under review by admin
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Booking activity */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Student booking requests</h2>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
                    <Phone size={12} /> Your number: {user?.phone}
                  </div>
                </div>

                {bookings.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 text-center"
                    style={{ border: '1px solid var(--border)' }}>
                    <CalendarCheck size={36} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-sm font-semibold text-gray-500">No bookings yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      When students book a viewing, their details will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((b: any) => {
                      const statusMap: Record<string, { label: string; color: string; bg: string }> = {
                        pending:          { label: 'Awaiting payment', color: '#B45309', bg: '#FFF9EB' },
                        confirmed:        { label: 'Paid — pending contact release', color: 'var(--blue)', bg: 'var(--blue-light)' },
                        contact_released: { label: 'Contact released', color: '#065F46', bg: '#ECFDF5' },
                        cancelled:        { label: 'Cancelled', color: '#9F1239', bg: '#FFF1F2' },
                        completed:        { label: 'Completed', color: '#065F46', bg: '#ECFDF5' },
                        no_show:          { label: 'No show', color: '#374151', bg: '#F3F4F6' },
                      };
                      const s = statusMap[b.booking_status] || statusMap.pending;
                      return (
                        <div key={b.id} className="bg-white rounded-xl p-4"
                          style={{ border: '1px solid var(--border)' }}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center
                                                text-white text-xs font-bold shrink-0"
                                  style={{ background: 'var(--blue)' }}>
                                  {b.student_name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900">{b.student_name}</p>
                                  {b.booking_status === 'contact_released' && (
                                    <a href={`tel:${b.student_phone}`}
                                      className="text-xs flex items-center gap-1"
                                      style={{ color: 'var(--blue)' }}>
                                      <Phone size={11} /> {b.student_phone}
                                    </a>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 ml-10">
                                <span className="flex items-center gap-1">
                                  <GraduationCap size={11} /> {b.hostel_name}
                                </span>
                                <span>{b.room_type}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-semibold px-2 py-1 rounded-full"
                                style={{ color: s.color, background: s.bg }}>
                                {s.label}
                              </span>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(b.booked_at).toLocaleDateString('en-GB', {
                                  day: 'numeric', month: 'short', year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2 p-3 rounded-xl text-xs"
                  style={{ background: '#F0F7FF', border: '1px solid #BFDBFE' }}>
                  <BadgeCheck size={14} style={{ color: 'var(--blue)' }} />
                  <p style={{ color: '#1E40AF' }}>
                    Admin verifies availability with you before releasing your contact to students.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </LandlordGuard>
  );
}