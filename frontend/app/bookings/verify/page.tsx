'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function VerifyPage() {
  const params   = useSearchParams();
  const router   = useRouter();
  const ref      = params.get('reference') || params.get('trxref');
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!ref) { setStatus('failed'); setMessage('No payment reference found'); return; }
      try {
        const res = await api.get(`/bookings/verify/${ref}`);
        setStatus('success');
        setMessage(res.data.message);
        setTimeout(() => router.push('/bookings'), 3000);
      } catch (err: any) {
        setStatus('failed');
        setMessage(err?.response?.data?.message || 'Payment verification failed');
      }
    };
    verify();
  }, [ref]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-10 text-center max-w-md w-full shadow-sm"
        style={{ border: '1px solid var(--border)' }}>

        {status === 'loading' && (
          <>
            <Loader2 size={48} className="animate-spin mx-auto mb-4 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying payment...</h2>
            <p className="text-sm text-gray-500">Please wait a moment</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={52} className="mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment confirmed!</h2>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <p className="text-xs text-gray-400 mb-4">Redirecting to your bookings...</p>
            <Link href="/bookings"
              className="inline-block px-6 py-3 text-white font-semibold rounded-xl text-sm"
              style={{ background: 'var(--blue)' }}>
              View my bookings
            </Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle size={52} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment failed</h2>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <Link href="/"
                className="px-5 py-2.5 text-sm font-semibold rounded-xl border text-gray-700"
                style={{ borderColor: 'var(--border)' }}>
                Back home
              </Link>
              <Link href="/bookings"
                className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white"
                style={{ background: 'var(--blue)' }}>
                My bookings
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}