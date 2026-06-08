'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Bell, BellOff, User, Mail, Phone, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const router = useRouter();

  const [profile, setProfile]         = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [togglingEmail, setTogglingEmail] = useState(false);

  useEffect(() => {
    if (!authUser) { router.push('/login'); return; }
    api.get('/users/me')
      .then(res => setProfile(res.data))
      .catch(() => { toast.error('Could not load profile'); router.push('/'); })
      .finally(() => setLoading(false));
  }, [authUser]);

  const toggleEmailMarketing = async () => {
    if (!profile) return;
    const newVal = !profile.email_marketing;
    try {
      setTogglingEmail(true);
      await api.patch('/users/me', { email_marketing: newVal });
      setProfile((p: any) => ({ ...p, email_marketing: newVal }));
      toast.success(newVal ? 'Availability alerts enabled' : 'Availability alerts disabled');
    } catch {
      toast.error('Failed to update preference');
    } finally {
      setTogglingEmail(false);
    }
  };

  if (loading || !profile) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--blue)' }} />
      </div>
    </div>
  );

  const ROLE_LABEL: Record<string, string> = {
    student: 'Student',
    landlord: 'Landlord',
    admin: 'Admin',
  };

  const infoRows = [
    { label: 'Full name', value: profile.fullname, icon: <User size={15} style={{ color: 'var(--blue)' }} /> },
    { label: 'Email',     value: profile.email,    icon: <Mail size={15} style={{ color: 'var(--blue)' }} /> },
    { label: 'Phone',     value: profile.phone || '—', icon: <Phone size={15} style={{ color: 'var(--blue)' }} /> },
    ...(profile.university ? [{ label: 'University', value: profile.university, icon: <GraduationCap size={15} style={{ color: 'var(--blue)' }} /> }] : []),
  ];

  const emailOn = profile.email_marketing !== false;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <Navbar />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px 60px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, flexShrink: 0 }}>
            {profile.fullname?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px', marginBottom: 4 }}>{profile.fullname}</h1>
            <span style={{ fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'var(--blue-light)', color: 'var(--blue)' }}>
              {ROLE_LABEL[profile.role] || profile.role}
            </span>
          </div>
        </div>

        {/* Profile info */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 18 }}>Account details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {infoRows.map(({ label, value, icon }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--blue-light)', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {icon}
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email preferences */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>Email preferences</h2>
          <p style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>
            Transactional emails (booking confirmations, contact releases, payment receipts) are always sent.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderRadius: 14, border: `1.5px solid ${emailOn ? 'var(--blue)' : 'var(--border)'}`, background: emailOn ? 'var(--blue-light)' : '#F9FAFB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: emailOn ? 'var(--blue)' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                {emailOn
                  ? <Bell size={18} style={{ color: 'white' }} />
                  : <BellOff size={18} style={{ color: '#9CA3AF' }} />}
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: emailOn ? 'var(--blue)' : '#374151', marginBottom: 2 }}>
                  Availability alerts & updates
                </p>
                <p style={{ fontSize: 13, color: emailOn ? '#1D4ED8' : '#6B7280' }}>
                  {emailOn ? 'You will receive hostel availability emails' : 'You have opted out of marketing emails'}
                </p>
              </div>
            </div>

            {/* Toggle pill */}
            <button
              onClick={toggleEmailMarketing}
              disabled={togglingEmail}
              style={{
                width: 48, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer',
                background: emailOn ? 'var(--blue)' : '#D1D5DB',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                opacity: togglingEmail ? 0.6 : 1,
              }}>
              <span style={{
                position: 'absolute', top: 3, left: emailOn ? 'calc(100% - 23px)' : 3,
                width: 20, height: 20, borderRadius: '50%', background: 'white',
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
