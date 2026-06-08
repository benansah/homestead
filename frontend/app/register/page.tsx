'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Loader2, GraduationCap, Home, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../lib/api';
import GoogleSignInButton from '../../components/GoogleSignInButton';
import { Suspense } from 'react';
import { useUniversities } from '../../hooks/useUniversities';

type Role = 'student' | 'landlord';

const inp: React.CSSProperties = { width: '100%', border: '1.5px solid var(--border)', borderRadius: 12, padding: '14px 16px', fontSize: 16, color: 'var(--text)', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s' };

function RegisterForm() {
  const { register, googleLogin } = useAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const refCode      = searchParams.get('ref') || '';

  const { universities } = useUniversities();
  const [role, setRole]       = useState<Role>('student');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailMarketing, setEmailMarketing] = useState(true);
  const [form, setForm] = useState({ fullname: '', email: '', password: '', phone: '', university: '', ref_code: refCode });

  const handleGoogleCredential = async (credential: string) => {
    try {
      setLoading(true);
      await googleLogin(credential, role);
      toast.success('Account created! Welcome to Homestead.');
    } catch {
      toast.error('Google sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullname || !form.email || !form.password || !form.phone) {
      toast.error('Please fill in all required fields'); return;
    }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      setLoading(true);
      const res = await register({ ...form, role, email_marketing: emailMarketing } as any);
      if (form.ref_code) {
        await api.post('/referrals/apply', { code: form.ref_code, referee_id: (res as any)?.user?.id }).catch(() => {});
      }
      toast.success('Account created! Please sign in.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px, 5vw, 40px) 16px' }}>
      <div style={{ width: '100%', maxWidth: 500 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--blue)', fontFamily: 'Georgia,serif' }}>Homestead</span>
          </Link>
          <p style={{ fontSize: 17, color: '#64748B', marginTop: 8 }}>Create your free account</p>
        </div>

        <div style={{ background: 'white', borderRadius: 24, padding: 'clamp(24px, 5vw, 40px) clamp(20px, 5vw, 36px)', boxShadow: 'var(--sh-md)', border: '1px solid var(--border)' }}>

          {refCode && (
            <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 12, padding: '14px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Gift size={18} style={{ color: '#7C3AED', flexShrink: 0 }} />
              <p style={{ fontSize: 15, color: '#6B21A8' }}>Referral code <strong>{refCode}</strong> applied!</p>
            </div>
          )}

          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 24 }}>Join Homestead</h1>

          {/* Role selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
            {([{ key: 'student', label: 'Student', desc: 'Find a hostel', icon: GraduationCap }, { key: 'landlord', label: 'Landlord', desc: 'List your rooms', icon: Home }] as const).map(({ key, label, desc, icon: Icon }) => (
              <button key={key} type="button" onClick={() => setRole(key)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '20px 12px', borderRadius: 16, border: `2px solid ${role === key ? 'var(--blue)' : 'var(--border)'}`, background: role === key ? 'var(--blue-light)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
                <Icon size={26} style={{ color: role === key ? 'var(--blue)' : '#94A3B8' }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: role === key ? 'var(--blue)' : '#374151' }}>{label}</span>
                <span style={{ fontSize: 13, color: '#94A3B8' }}>{desc}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Full name</label>
              <input type="text" value={form.fullname} onChange={e => setForm({ ...form, fullname: e.target.value })}
                placeholder="Kwame Mensah" style={inp}
                onFocus={e => (e.target.style.borderColor = 'var(--blue)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Email address</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@university.edu.gh" style={inp}
                onFocus={e => (e.target.style.borderColor = 'var(--blue)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Phone number</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="024 000 0000" style={inp}
                onFocus={e => (e.target.style.borderColor = 'var(--blue)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
            {role === 'student' && (
              <div>
                <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 8 }}>University</label>
                <select value={form.university} onChange={e => setForm({ ...form, university: e.target.value })} style={{ ...inp, background: 'white' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--blue)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')}>
                  <option value="">Select your university</option>
                  {universities.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPwd ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 6 characters" style={{ ...inp, paddingRight: 48 }}
                  onFocus={e => (e.target.style.borderColor = 'var(--blue)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
                Referral code <span style={{ fontWeight: 400, color: '#94A3B8', fontSize: 14 }}>(optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Gift size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input type="text" value={form.ref_code} onChange={e => setForm({ ...form, ref_code: e.target.value.toUpperCase() })}
                  placeholder="e.g. AB12CD" maxLength={20}
                  style={{ ...inp, paddingLeft: 40, fontFamily: 'monospace', letterSpacing: '0.1em', borderColor: form.ref_code ? '#A78BFA' : 'var(--border)', background: form.ref_code ? '#F5F3FF' : 'white' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--blue)')} onBlur={e => (e.target.style.borderColor = form.ref_code ? '#A78BFA' : 'var(--border)')} />
              </div>
            </div>

            {/* Email marketing opt-in */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={emailMarketing}
                onChange={e => setEmailMarketing(e.target.checked)}
                style={{ marginTop: 3, accentColor: 'var(--blue)', width: 16, height: 16, flexShrink: 0 }}
              />
              <span style={{ fontSize: 14, color: '#64748B', lineHeight: 1.5 }}>
                Send me hostel availability alerts and platform updates
              </span>
            </label>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '16px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 14, fontSize: 17, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1, boxShadow: 'var(--sh-blue)', marginTop: 8 }}>
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <GoogleSignInButton onCredential={handleGoogleCredential} text="signup_with" />
          <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 10 }}>
            Signing up with Google registers you as a <strong>{role}</strong>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 16, color: '#64748B', marginTop: 24 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ fontWeight: 700, color: 'var(--blue)', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={28} style={{ color: 'var(--blue)' }} className="animate-spin" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
