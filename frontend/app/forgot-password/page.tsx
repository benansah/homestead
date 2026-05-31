'use client';
import { useState } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Enter your email address'); return; }
    try {
      setLoading(true);
      await api.post('/users/forgot-password', { email });
      setSent(true);
    } catch {
      toast.error('Something went wrong — please try again');
    } finally {
      setLoading(false);
    }
  };

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

          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: '#ECFDF5' }}>
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Check your email</h1>
              <p className="text-sm text-gray-500 mb-6">
                If <strong>{email}</strong> is registered, we've sent a password reset link.
                Check your spam folder if you don't see it.
              </p>
              <Link href="/login"
                className="text-sm font-semibold"
                style={{ color: 'var(--blue)' }}>
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login"
                className="flex items-center gap-1.5 text-sm text-gray-500
                           hover:text-gray-800 mb-5 transition-colors">
                <ArrowLeft size={15} /> Back to sign in
              </Link>

              <h1 className="text-xl font-bold text-gray-900 mb-1">Reset your password</h1>
              <p className="text-sm text-gray-500 mb-6">
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@university.edu.gh"
                      className="w-full border rounded-lg pl-9 pr-4 py-3 text-sm outline-none
                                 focus:border-blue-500 transition-colors"
                      style={{ borderColor: 'var(--border)' }}
                    />
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
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
