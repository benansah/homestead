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
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
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
          <p className="text-gray-500 text-sm mt-2">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm"
          style={{ border: '1px solid var(--border)' }}>

          <h1 className="text-xl font-bold text-gray-900 mb-6">Welcome back</h1>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@university.edu.gh"
                className="w-full border rounded-lg px-4 py-3 text-sm outline-none
                           focus:border-blue-500 transition-colors"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-xs font-medium" style={{ color: 'var(--blue)' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full border rounded-lg px-4 py-3 text-sm outline-none
                             focus:border-blue-500 transition-colors pr-10"
                  style={{ borderColor: 'var(--border)' }}
                />
                <button type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-semibold text-sm
                         hover:opacity-90 transition-opacity disabled:opacity-60
                         flex items-center justify-center gap-2"
              style={{ background: 'var(--blue)' }}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <hr className="flex-1" style={{ borderColor: 'var(--border)' }} />
            <span className="text-xs text-gray-400">or</span>
            <hr className="flex-1" style={{ borderColor: 'var(--border)' }} />
          </div>

          {/* Google Sign-In */}
          <div className="mb-5">
            <GoogleSignInButton onCredential={handleGoogleCredential} text="signin_with" />
          </div>

          {/* Test credentials */}
          <div className="rounded-lg p-3 text-xs text-gray-500 space-y-1"
            style={{ background: '#F8F9FA', border: '1px solid var(--border)' }}>
            <p className="font-semibold text-gray-700 mb-2">Test accounts</p>
            <p>👤 Student: <span className="font-mono">kwame@ug.edu.gh</span></p>
            <p>🏠 Landlord: <span className="font-mono">agyemang@gmail.com</span></p>
            <p>⚙️ Admin: <span className="font-mono">admin@hostelgh.com</span></p>
            <p className="text-gray-400 mt-1">All passwords: <span className="font-mono">password123</span></p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold" style={{ color: 'var(--blue)' }}>
            Join free
          </Link>
        </p>
      </div>
    </div>
  );
}