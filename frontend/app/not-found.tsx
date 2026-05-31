import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-black mb-4"
          style={{ color: 'var(--blue)', fontFamily: 'Georgia, serif' }}>
          404
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-500 mb-8">
          {"The page you're looking for doesn't exist or has been moved."}
        </p>
        <Link href="/"
          className="inline-block px-6 py-3 text-white font-semibold rounded-xl text-sm"
          style={{ background: 'var(--blue)' }}>
          Back to home
        </Link>
      </div>
    </div>
  );
}