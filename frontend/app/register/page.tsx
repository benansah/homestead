'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Loader2, GraduationCap, Home, Shield, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../lib/api';
import GoogleSignInButton from '../../components/GoogleSignInButton';

const UNIVERSITIES = [
  'University of Ghana',
  'KNUST',
  'UCC',
  'University of Education',
  'Ashesi University',
];

type Role = 'student' | 'landlord';

export default function RegisterPage() {
  const { register, googleLogin } = useAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const refCode      = searchParams.get('ref') || '';

  const [role, setRole]       = useState<Role>('student');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleCredential = async (credential: string) => {
    try {
      setLoading(true);
      await googleLogin(credential, role);
      toast.success('Account created! Welcome to hostelGH.');
    } catch {
      toast.error('Google sign-up failed');
    } finally {
      setLoading(false);
    }
  };
  const [form, setForm]       = useState({
    fullname:   '',
    email:      '',
    password:   '',
    phone:      '',
    university: '',
    ref_code:   refCode,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullname || !form.email || !form.password || !form.phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      setLoading(true);
      const res = await register({ ...form, role });

      // apply referral code silently if provided
      if (form.ref_code) {
        try {
          await api.post('/referrals/apply', {
            code:       form.ref_code,
            referee_id: (res as any)?.user?.id,
          });
        } catch {} // silent — never block registration
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/"
            className="text-3xl font-black"
            style={{ color: 'var(--blue)', fontFamily: 'Georgia, serif' }}>
            hostelGH
          </Link>
          <p className="text-gray-500 text-sm mt-2">Create your free account</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm"
          style={{ border: '1px solid var(--border)' }}>

          {/* Referral banner — shows if came from referral link */}
          {refCode && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-5 text-sm"
              style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
              <Gift size={15} style={{ color: '#6B21A8' }} />
              <span style={{ color: '#6B21A8' }}>
                You were referred! Code <strong>{refCode}</strong> will be applied automatically.
              </span>
            </div>
          )}

          <h1 className="text-xl font-bold text-gray-900 mb-5">Join hostelGH</h1>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {([
              { key: 'student',  label: 'Student',  desc: 'Find a hostel',  icon: GraduationCap },
              { key: 'landlord', label: 'Landlord', desc: 'List your rooms', icon: Home },
            ] as const).map(({ key, label, desc, icon: Icon }) => (
              <button key={key} type="button"
                onClick={() => setRole(key)}
                className="flex flex-col items-center gap-1.5 p-4 rounded-xl border-2
                           transition-all text-center"
                style={{
                  borderColor: role === key ? 'var(--blue)' : 'var(--border)',
                  background:  role === key ? 'var(--blue-light)' : 'transparent',
                }}>
                <Icon size={22} style={{ color: role === key ? 'var(--blue)' : '#9CA3AF' }} />
                <span className="text-sm font-semibold"
                  style={{ color: role === key ? 'var(--blue)' : '#374151' }}>
                  {label}
                </span>
                <span className="text-xs text-gray-400">{desc}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full name
              </label>
              <input type="text" value={form.fullname}
                onChange={e => setForm({ ...form, fullname: e.target.value })}
                placeholder="Kwame Mensah"
                className="w-full border rounded-lg px-4 py-3 text-sm outline-none
                           focus:border-blue-500 transition-colors"
                style={{ borderColor: 'var(--border)' }} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@university.edu.gh"
                className="w-full border rounded-lg px-4 py-3 text-sm outline-none
                           focus:border-blue-500 transition-colors"
                style={{ borderColor: 'var(--border)' }} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone number
              </label>
              <input type="tel" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="024 000 0000"
                className="w-full border rounded-lg px-4 py-3 text-sm outline-none
                           focus:border-blue-500 transition-colors"
                style={{ borderColor: 'var(--border)' }} />
            </div>

            {/* University — students only */}
            {role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  University
                </label>
                <select value={form.university}
                  onChange={e => setForm({ ...form, university: e.target.value })}
                  className="w-full border rounded-lg px-4 py-3 text-sm outline-none
                             focus:border-blue-500 transition-colors text-gray-700 bg-white"
                  style={{ borderColor: 'var(--border)' }}>
                  <option value="">Select your university</option>
                  {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full border rounded-lg px-4 py-3 text-sm outline-none
                             focus:border-blue-500 transition-colors pr-10"
                  style={{ borderColor: 'var(--border)' }} />
                <button type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Referral code — manually editable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referral code
                <span className="text-xs text-gray-400 ml-1 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Gift size={15} className="absolute left-3 top-3.5 text-gray-400" />
                <input type="text" value={form.ref_code}
                  onChange={e => setForm({ ...form, ref_code: e.target.value.toUpperCase() })}
                  placeholder="e.g. AB12CD"
                  maxLength={20}
                  className="w-full border rounded-lg pl-9 pr-4 py-3 text-sm outline-none
                             focus:border-blue-500 transition-colors font-mono tracking-widest"
                  style={{
                    borderColor: form.ref_code ? '#A78BFA' : 'var(--border)',
                    background:  form.ref_code ? '#F5F3FF' : 'transparent',
                  }} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg text-white font-semibold text-sm
                         hover:opacity-90 transition-opacity disabled:opacity-60
                         flex items-center justify-center gap-2 mt-2"
              style={{ background: 'var(--blue)' }}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 mt-5">
            <hr className="flex-1" style={{ borderColor: 'var(--border)' }} />
            <span className="text-xs text-gray-400">or</span>
            <hr className="flex-1" style={{ borderColor: 'var(--border)' }} />
          </div>

          {/* Google Sign-Up */}
          <div className="mt-4">
            <GoogleSignInButton onCredential={handleGoogleCredential} text="signup_with" />
            <p className="text-xs text-gray-400 text-center mt-2">
              Signing up with Google registers you as a <strong>{role}</strong>
            </p>
          </div>

          {/* Trust note */}
          <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
            <Shield size={12} />
            <span>Your information is safe and never shared</span>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold" style={{ color: 'var(--blue)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}