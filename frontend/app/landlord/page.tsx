'use client';
import { useState, useEffect } from 'react';
import LandlordGuard from '../../components/LandlordGuard';
import Navbar from '../../components/Navbar';
import api from '../../lib/api';
import {
  Plus, Building2, BedDouble, CalendarCheck,
  Eye, EyeOff, Loader2, ShieldCheck, Clock,
  CheckCircle2, Phone, GraduationCap, BadgeCheck,
  Pencil, Trash2, MessageCircle, Calendar,
  TrendingUp, Users, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string; icon: React.ReactNode }> = {
  approved: { label: 'Approved', color: '#065F46', bg: '#ECFDF5', dot: '#10B981', icon: <CheckCircle2 size={11} /> },
  pending:  { label: 'Under review', color: '#92400E', bg: '#FFFBEB', dot: '#F59E0B', icon: <Clock size={11} /> },
  rejected: { label: 'Rejected', color: '#9F1239', bg: '#FFF1F2', dot: '#F43F5E', icon: <EyeOff size={11} /> },
  hidden:   { label: 'Hidden', color: '#374151', bg: '#F3F4F6', dot: '#9CA3AF', icon: <EyeOff size={11} /> },
};

const BOOKING_STATUS: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:          { label: 'Awaiting payment',       color: '#92400E', bg: '#FFFBEB', dot: '#F59E0B' },
  confirmed:        { label: 'Paid — awaiting release', color: '#1E40AF', bg: '#EFF6FF', dot: '#3B82F6' },
  contact_released: { label: 'Contact released',        color: '#065F46', bg: '#ECFDF5', dot: '#10B981' },
  cancelled:        { label: 'Cancelled',               color: '#9F1239', bg: '#FFF1F2', dot: '#F43F5E' },
  completed:        { label: 'Completed',               color: '#065F46', bg: '#ECFDF5', dot: '#10B981' },
  no_show:          { label: 'No show',                 color: '#374151', bg: '#F3F4F6', dot: '#9CA3AF' },
};

function StatusPill({ status, cfg }: { status: string; cfg: typeof STATUS_CFG | typeof BOOKING_STATUS }) {
  const c = (cfg as any)[status] ?? (cfg as any).pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: c.bg, color: c.color, flexShrink: 0 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

function IconBtn({ href, onClick, icon, label, variant = 'ghost' }: {
  href?: string; onClick?: () => void; icon: React.ReactNode;
  label: string; variant?: 'ghost' | 'danger' | 'green' | 'primary' | 'amber';
}) {
  const styles: Record<string, React.CSSProperties> = {
    ghost:   { border: '1.5px solid var(--border)',  background: 'white',   color: '#475569' },
    danger:  { border: '1.5px solid #FECACA',        background: '#FEF2F2', color: '#DC2626' },
    green:   { border: '1.5px solid #BBF7D0',        background: '#F0FDF4', color: '#15803D' },
    amber:   { border: '1.5px solid #FDE68A',        background: '#FFFBEB', color: '#B45309' },
    primary: { border: '1.5px solid var(--blue)',    background: 'var(--blue)', color: 'white' },
  };
  const s: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap', ...styles[variant] };
  return href
    ? <Link href={href} style={s}>{icon}{label}</Link>
    : <button onClick={onClick} style={{ ...s, border: (styles[variant] as any).border }}>{icon}{label}</button>;
}

function HostelCard({ hostel, onDelete }: { hostel: any; onDelete: (id: number) => void }) {
  const cfg = STATUS_CFG[hostel.status] ?? STATUS_CFG.pending;
  const handleDelete = async () => {
    if (!confirm(`Delete "${hostel.hostel_name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/hostels/${hostel.id}`);
      onDelete(hostel.id);
      toast.success('Hostel deleted');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };
  const bulkAvail = async (v: boolean) => {
    try {
      await api.patch('/rooms/bulk-availability', { hostel_id: hostel.id, is_available: v });
      toast.success(v ? 'All rooms marked available' : 'All rooms marked full');
    } catch { toast.error('Failed'); }
  };
  const waUrl = `https://wa.me/?text=${encodeURIComponent(`Check out my hostel on Homestead: ${typeof window !== 'undefined' ? window.location.origin : 'https://homestead.com'}/hostels/${hostel.id}`)}`;

  return (
    <div style={{ background: 'white', borderRadius: 18, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      {/* Card top accent based on status */}
      <div style={{ height: 4, background: cfg.dot, borderRadius: '18px 18px 0 0' }} />

      <div style={{ padding: '18px 20px' }}>
        {/* Name row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>{hostel.hostel_name}</h3>
              {hostel.is_verified && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'var(--blue-light)', color: 'var(--blue)' }}>
                  <ShieldCheck size={10} /> Verified
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
              🎓 {hostel.university}
              {hostel.hostel_address ? <span style={{ color: '#94A3B8' }}> · {hostel.hostel_address}</span> : null}
            </p>
          </div>
          <StatusPill status={hostel.status} cfg={STATUS_CFG} />
        </div>

        {/* Stat chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
          <Chip icon={<BedDouble size={11} />} label={`${hostel.total_rooms || 0} rooms`} />
          <Chip icon={<CheckCircle2 size={11} />} label={`${hostel.available_rooms || 0} available`} color="green" />
          {hostel.view_count != null && <Chip icon={<Eye size={11} />} label={`${hostel.view_count} views`} />}
          {hostel.min_price && (
            <Chip icon={<TrendingUp size={11} />} label={`From GHS ${Number(hostel.min_price).toLocaleString()}`} color="blue" />
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <IconBtn href={`/hostels/${hostel.id}`} icon={<Eye size={13} />} label="View" />
          <IconBtn href={`/landlord/edit-hostel/${hostel.id}`} icon={<Pencil size={13} />} label="Edit" />
          <IconBtn onClick={() => bulkAvail(true)}  icon={<CheckCircle2 size={13} />} label="All available" variant="green" />
          <IconBtn onClick={() => bulkAvail(false)} icon={<EyeOff size={13} />}       label="Mark full"      variant="amber" />
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: '1.5px solid #BBF7D0', background: '#F0FDF4', color: '#15803D', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            <MessageCircle size={13} /> Share
          </a>
          <IconBtn onClick={handleDelete} icon={<Trash2 size={13} />} label="Delete" variant="danger" />
        </div>
      </div>
    </div>
  );
}

function Chip({ icon, label, color }: { icon: React.ReactNode; label: string; color?: 'green' | 'blue' }) {
  const palettes = {
    green: { bg: '#ECFDF5', color: '#065F46' },
    blue:  { bg: 'var(--blue-light)', color: 'var(--blue)' },
    def:   { bg: '#F1F5F9', color: '#475569' },
  };
  const p = color ? palettes[color] : palettes.def;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: p.bg, color: p.color }}>
      {icon}{label}
    </span>
  );
}

function BookingCard({ b }: { b: any }) {
  const s = BOOKING_STATUS[b.booking_status] ?? BOOKING_STATUS.pending;
  const initials = b.student_name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Avatar */}
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), #3B82F6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,106,255,0.25)' }}>
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + status */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>{b.student_name}</p>
              {b.booking_status === 'contact_released' && b.student_phone && (
                <a href={`tel:${b.student_phone}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: '#065F46', textDecoration: 'none', marginTop: 3, background: '#ECFDF5', padding: '3px 9px', borderRadius: 99 }}>
                  <Phone size={12} /> {b.student_phone}
                </a>
              )}
            </div>
            <StatusPill status={b.booking_status} cfg={BOOKING_STATUS} />
          </div>

          {/* Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748B' }}>
              <Building2 size={11} /> {b.hostel_name}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748B' }}>
              <BedDouble size={11} /> {b.room_type}
            </span>
            <span style={{ fontSize: 12, color: '#94A3B8', marginLeft: 'auto' }}>
              {new Date(b.booked_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
        setHostels(hRes.data.filter((h: any) => h.landlord_id === user?.id));
        setBookings(bRes.data || []);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user]);

  const totalRooms    = hostels.reduce((s: number, h: any) => s + (h.total_rooms || 0), 0);
  const pendingCount  = hostels.filter(h => h.status === 'pending').length;
  const approvedCount = hostels.filter(h => h.status === 'approved').length;
  const totalViews    = hostels.reduce((s: number, h: any) => s + (h.view_count || 0), 0);

  const recentBookings = bookings.slice(0, 10);

  return (
    <LandlordGuard>
      <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
        <Navbar />

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 16px 80px' }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: 28 }}>
            {/* Top row: greeting + CTA buttons */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), #3B82F6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20, flexShrink: 0, boxShadow: '0 4px 12px rgba(0,106,255,0.3)' }}>
                  {user?.fullname?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Hey, {user?.fullname?.split(' ')[0]} 👋
                  </h1>
                  <p style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>
                    Manage your listings and track student bookings
                  </p>
                </div>
              </div>

              {/* Action buttons — wrap on mobile */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <Link href="/landlord/calendar"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 13, fontWeight: 600, border: '1.5px solid var(--border)', borderRadius: 12, color: '#475569', background: 'white', textDecoration: 'none' }}>
                  <Calendar size={14} /> Calendar
                </Link>
                <Link href="/landlord/list-room"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 13, fontWeight: 600, border: '1.5px solid var(--border)', borderRadius: 12, color: '#475569', background: 'white', textDecoration: 'none' }}>
                  <Plus size={14} /> Add room
                </Link>
                <Link href="/landlord/create"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 13, fontWeight: 700, background: 'var(--blue)', color: 'white', borderRadius: 12, textDecoration: 'none', boxShadow: '0 2px 10px rgba(0,106,255,0.3)' }}>
                  <Plus size={14} /> New hostel
                </Link>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 260, gap: 14 }}>
              <Loader2 size={30} style={{ color: 'var(--blue)', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 13, color: '#94A3B8' }}>Loading your dashboard…</p>
            </div>
          ) : (
            <>
              {/* ── Stats ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 28 }}>
                {[
                  { label: 'My hostels',      value: hostels.length,  color: '#1E40AF', bg: '#EFF6FF',  Icon: Building2 },
                  { label: 'Total rooms',      value: totalRooms,      color: '#065F46', bg: '#ECFDF5',  Icon: BedDouble },
                  { label: 'Approved',         value: approvedCount,   color: '#065F46', bg: '#ECFDF5',  Icon: CheckCircle2 },
                  { label: 'Awaiting review',  value: pendingCount,    color: '#92400E', bg: '#FFFBEB',  Icon: Clock },
                  { label: 'Total views',      value: totalViews,      color: '#5B21B6', bg: '#F5F3FF',  Icon: Eye },
                  { label: 'Total bookings',   value: bookings.length, color: '#0F172A', bg: '#F1F5F9',  Icon: Users },
                ].map(({ label, value, color, bg, Icon }) => (
                  <div key={label} style={{ background: bg, borderRadius: 16, padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={20} style={{ color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 26, fontWeight: 900, color, margin: 0, lineHeight: 1 }}>{value}</p>
                      <p style={{ fontSize: 12, fontWeight: 600, color, opacity: 0.65, marginTop: 4 }}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── My listings ── */}
              <section style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>My listings</h2>
                  {hostels.length > 0 && (
                    <Link href="/landlord/create"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: 'var(--blue)', textDecoration: 'none' }}>
                      <Plus size={13} /> Add hostel <ChevronRight size={13} />
                    </Link>
                  )}
                </div>

                {hostels.length === 0 ? (
                  <div style={{ background: 'white', borderRadius: 18, border: '2px dashed var(--border)', padding: '52px 24px', textAlign: 'center' }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Building2 size={26} style={{ color: 'var(--blue)' }} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#374151', margin: '0 0 6px' }}>No listings yet</h3>
                    <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>Add your first hostel to start receiving bookings from students.</p>
                    <Link href="/landlord/create"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', fontSize: 14, fontWeight: 700, background: 'var(--blue)', color: 'white', borderRadius: 12, textDecoration: 'none', boxShadow: '0 2px 10px rgba(0,106,255,0.3)' }}>
                      <Plus size={15} /> Add your first hostel
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {hostels.map(hostel => (
                      <HostelCard key={hostel.id} hostel={hostel}
                        onDelete={(id) => setHostels(prev => prev.filter(h => h.id !== id))} />
                    ))}
                  </div>
                )}
              </section>

              {/* ── Bookings ── */}
              <section>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>Student bookings</h2>
                  {user?.phone && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: 'var(--blue-light)', color: 'var(--blue)' }}>
                      <Phone size={12} /> {user.phone}
                    </span>
                  )}
                </div>

                {recentBookings.length === 0 ? (
                  <div style={{ background: 'white', borderRadius: 18, border: '1px solid var(--border)', padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <CalendarCheck size={24} style={{ color: '#94A3B8' }} />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '0 0 6px' }}>No bookings yet</p>
                    <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>When students book a viewing, their details will appear here.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {recentBookings.map(b => <BookingCard key={b.id} b={b} />)}
                  </div>
                )}

                {/* Info banner */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 14, padding: '13px 16px', borderRadius: 12, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <BadgeCheck size={16} style={{ color: 'var(--blue)', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 13, color: '#1E40AF', margin: 0, lineHeight: 1.6 }}>
                    Admin verifies availability with you before releasing your contact number to students.
                    Keep your phone reachable when a booking is confirmed.
                  </p>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </LandlordGuard>
  );
}
