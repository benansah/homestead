'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import GoogleSignInButton from '../../components/GoogleSignInButton';

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleCredential = async (credential: string) => {
    try {
      setLoading(true);
      await googleLogin(credential);
      toast.success('Welcome back!');
    } catch {
      toast.error('Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill in all fields'); return; }
    try {
      setLoading(true);
      await login(form.email, form.password);
      toast.success('Welcome back!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = { width: '100%', border: '1.5px solid var(--border)', borderRadius: 12, padding: '14px 16px', fontSize: 16, color: 'var(--text)', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px, 5vw, 40px) 16px' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--blue)', fontFamily: 'Georgia,serif', letterSpacing: '-1px' }}>
              Homestead
            </span>
          </Link>
          <p style={{ fontSize: 17, color: '#64748B', marginTop: 8 }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: 24, padding: 'clamp(24px, 5vw, 40px) clamp(20px, 5vw, 36px)', boxShadow: 'var(--sh-md)', border: '1px solid var(--border)' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 28 }}>Welcome back</h1>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Email address</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@university.edu.gh" style={inp}
                onFocus={e => (e.target.style.borderColor = 'var(--blue)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 15, fontWeight: 600, color: '#334155' }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: 14, fontWeight: 600, color: 'var(--blue)', textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showPwd ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••" style={{ ...inp, paddingRight: 48 }}
                  onFocus={e => (e.target.style.borderColor = 'var(--blue)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '16px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 14, fontSize: 17, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1, boxShadow: 'var(--sh-blue)', marginTop: 4 }}>
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <GoogleSignInButton onCredential={handleGoogleCredential} text="signin_with" />

          {/* Test accounts */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '16px', marginTop: 24, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 10 }}>Test accounts</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[['👤 Student', 'kwame@ug.edu.gh'], ['🏠 Landlord', 'agyemang@gmail.com'], ['⚙️ Admin', 'admin@Homestead.com']].map(([role, email]) => (
                <p key={email as string} style={{ fontSize: 14, color: '#64748B' }}>
                  {role}: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{email}</span>
                </p>
              ))}
              <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>All passwords: <span style={{ fontFamily: 'monospace' }}>password123</span></p>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 16, color: '#64748B', marginTop: 24 }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ fontWeight: 700, color: 'var(--blue)', textDecoration: 'none' }}>Join free</Link>
        </p>
      </div>
    </div>
  );
}
