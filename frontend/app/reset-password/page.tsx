'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../lib/api';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') || '';

  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPwd, setShowPwd]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirm) { toast.error('Please fill in both fields'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (!token) { toast.error('Invalid or missing reset token'); return; }
    try {
      setLoading(true);
      await api.post('/users/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Reset failed — link may have expired');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm mb-4">Invalid or missing reset link.</p>
        <Link href="/forgot-password" className="text-sm font-semibold" style={{ color: 'var(--blue)' }}>
          Request a new link
        </Link>
      </div>
    );
  }

  return success ? (
    <div className="text-center py-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: '#ECFDF5' }}>
        <CheckCircle2 size={32} className="text-green-600" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Password updated!</h1>
      <p className="text-sm text-gray-500">Redirecting you to sign in…</p>
    </div>
  ) : (
    <>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Choose a new password</h1>
      <p className="text-sm text-gray-500 mb-6">Must be at least 6 characters.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full border rounded-lg px-4 py-3 text-sm outline-none
                         focus:border-blue-500 transition-colors pr-10"
              style={{ borderColor: 'var(--border)' }}
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
          <input
            type={showPwd ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            className="w-full border rounded-lg px-4 py-3 text-sm outline-none
                       focus:border-blue-500 transition-colors"
            style={{ borderColor: 'var(--border)' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg text-white font-semibold text-sm
                     hover:opacity-90 transition-opacity disabled:opacity-60
                     flex items-center justify-center gap-2"
          style={{ background: 'var(--blue)' }}>
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Updating...' : 'Set new password'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/"
            className="text-3xl font-black"
            style={{ color: 'var(--blue)', fontFamily: 'Georgia, serif' }}>
            hostelGH
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm"
          style={{ border: '1px solid var(--border)' }}>
          <Suspense fallback={<div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-blue-500" /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Remembered it?{' '}
          <Link href="/login" className="font-semibold" style={{ color: 'var(--blue)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
