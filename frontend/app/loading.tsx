export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-100 rounded-full mx-auto mb-4"
          style={{ borderTopColor: 'var(--blue)', animation: 'spin 0.8s linear infinite' }} />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}