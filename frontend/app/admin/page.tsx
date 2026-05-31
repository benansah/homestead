'use client';
import { useState, useEffect } from 'react';
import AdminGuard from '../../components/AdminGuard';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../lib/api';
import {
  Building2, CalendarCheck, Users,
  TrendingUp, Clock, CheckCircle2,
  XCircle, AlertCircle, Loader2,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Stats {
  total_hostels: number;
  pending_hostels: number;
  approved_hostels: number;
  total_bookings: number;
  confirmed_bookings: number;
  pending_bookings: number;
  total_users: number;
  student_count: number;
  landlord_count: number;
  total_revenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats]       = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [hostels, setHostels]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [bRes, hRes, uRes] = await Promise.all([
          api.get('/bookings'),
          api.get('/hostels'),
          api.get('/users'),
        ]);

        const b = bRes.data;
        const h = hRes.data;
        const u = uRes.data;

        setBookings(b.slice(0, 5));
        setHostels(h.filter((x: any) => x.status === 'pending').slice(0, 5));

        setStats({
          total_hostels:     h.length,
          pending_hostels:   h.filter((x: any) => x.status === 'pending').length,
          approved_hostels:  h.filter((x: any) => x.status === 'approved').length,
          total_bookings:    b.length,
          confirmed_bookings:b.filter((x: any) => x.booking_status === 'confirmed').length,
          pending_bookings:  b.filter((x: any) => x.booking_status === 'pending').length,
          total_users:       u.length,
          student_count:     u.filter((x: any) => x.role === 'student').length,
          landlord_count:    u.filter((x: any) => x.role === 'landlord').length,
          total_revenue:     b.filter((x: any) => x.payment_ref).length * 50,
        });
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />

        <main className="flex-1 p-6 overflow-y-auto">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    label: 'Total hostels',
                    value: stats?.total_hostels,
                    sub: `${stats?.pending_hostels} pending approval`,
                    icon: Building2,
                    color: 'var(--blue)',
                    bg: 'var(--blue-light)',
                  },
                  {
                    label: 'Total bookings',
                    value: stats?.total_bookings,
                    sub: `${stats?.pending_bookings} awaiting action`,
                    icon: CalendarCheck,
                    color: '#065F46',
                    bg: '#ECFDF5',
                  },
                  {
                    label: 'Total users',
                    value: stats?.total_users,
                    sub: `${stats?.student_count} students · ${stats?.landlord_count} landlords`,
                    icon: Users,
                    color: '#6B21A8',
                    bg: '#F5F3FF',
                  },
                  {
                    label: 'Revenue (GHS)',
                    value: `${stats?.total_revenue?.toLocaleString()}`,
                    sub: 'From viewing fees',
                    icon: TrendingUp,
                    color: '#B45309',
                    bg: '#FFF9EB',
                  },
                ].map(({ label, value, sub, icon: Icon, color, bg }) => (
                  <div key={label} className="bg-white rounded-xl p-5"
                    style={{ border: '1px solid var(--border)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: bg }}>
                        <Icon size={20} style={{ color }} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
                    <p className="text-xs text-gray-400 mt-1">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Two column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Pending listings */}
                <div className="bg-white rounded-xl"
                  style={{ border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <h2 className="font-bold text-gray-900">Pending listings</h2>
                    <Link href="/admin/listings"
                      className="text-xs font-semibold flex items-center gap-1"
                      style={{ color: 'var(--blue)' }}>
                      View all <ArrowRight size={12} />
                    </Link>
                  </div>

                  {hostels.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <CheckCircle2 size={28} className="mx-auto text-green-400 mb-2" />
                      <p className="text-sm text-gray-400">All listings reviewed</p>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                      {hostels.map((h: any) => (
                        <div key={h.id}
                          className="flex items-center justify-between px-5 py-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {h.hostel_name}
                            </p>
                            <p className="text-xs text-gray-400">{h.university}</p>
                          </div>
                          <Link href="/admin/listings"
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                            style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
                            Review
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent bookings */}
                <div className="bg-white rounded-xl"
                  style={{ border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <h2 className="font-bold text-gray-900">Recent bookings</h2>
                    <Link href="/admin/bookings"
                      className="text-xs font-semibold flex items-center gap-1"
                      style={{ color: 'var(--blue)' }}>
                      View all <ArrowRight size={12} />
                    </Link>
                  </div>

                  {bookings.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="text-sm text-gray-400">No bookings yet</p>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                      {bookings.map((b: any) => {
                        const statusColor: Record<string, string> = {
                          pending:          '#B45309',
                          confirmed:        '#1D4ED8',
                          contact_released: '#065F46',
                          cancelled:        '#9F1239',
                        };
                        return (
                          <div key={b.id}
                            className="flex items-center justify-between px-5 py-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {b.student_name}
                              </p>
                              <p className="text-xs text-gray-400">{b.hostel_name}</p>
                            </div>
                            <span className="text-xs font-semibold capitalize"
                              style={{ color: statusColor[b.booking_status] || '#6B7280' }}>
                              {b.booking_status?.replace('_', ' ')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}