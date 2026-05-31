'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl mb-4">⚠️</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-500 mb-8">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset}
            className="px-6 py-3 text-white font-semibold rounded-xl text-sm"
            style={{ background: 'var(--blue)' }}>
            Try again
          </button>
          <Link href="/"
            className="px-6 py-3 border font-semibold rounded-xl text-sm text-gray-700
                       hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'var(--border)' }}>
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}