'use client';

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '40px 20px', maxWidth: 420 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 10 }}>Application error</h2>
          <p style={{ fontSize: 14, color: '#64748B', marginBottom: 28, lineHeight: 1.6 }}>
            A critical error occurred. Please try reloading the page.
          </p>
          <button onClick={unstable_retry}
            style={{ padding: '11px 28px', borderRadius: 12, background: '#006AFF', color: 'white', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', marginRight: 10 }}>
            Try again
          </button>
          <a href="/"
            style={{ padding: '11px 28px', borderRadius: 12, border: '1.5px solid #E2E8F0', color: '#374151', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
