'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#F8FAFC' }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}>
          ⚠️
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 8, letterSpacing: '-0.5px' }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: 14, color: '#64748B', marginBottom: 28, lineHeight: 1.6 }}>
          This page ran into a problem. Try again — if it keeps happening, please contact support.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={unstable_retry}
            style={{ padding: '11px 28px', borderRadius: 12, background: '#006AFF', color: 'white', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            Try again
          </button>
          <Link href="/"
            style={{ padding: '11px 28px', borderRadius: 12, border: '1.5px solid var(--border)', color: '#374151', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}