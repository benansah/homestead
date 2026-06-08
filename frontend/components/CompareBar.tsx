'use client';
import { useCompare } from '../context/CompareContext';
import { useRouter } from 'next/navigation';
import { LayoutGrid, X } from 'lucide-react';

export default function CompareBar() {
  const { ids, clear } = useCompare();
  const router = useRouter();

  if (ids.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 100, display: 'flex', alignItems: 'center', gap: 12,
      background: '#0F172A', color: 'white', borderRadius: 16,
      padding: '14px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      whiteSpace: 'nowrap',
    }}>
      {/* Slots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 28, height: 28, borderRadius: 8,
            background: ids[i] ? 'var(--blue)' : 'rgba(255,255,255,0.12)',
            border: ids[i] ? 'none' : '1.5px dashed rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: 'white',
            transition: 'background 0.2s',
          }}>
            {ids[i] ? i + 1 : ''}
          </div>
        ))}
      </div>

      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
        {ids.length} / 3 selected
      </span>

      <button
        onClick={() => router.push(`/compare?ids=${ids.join(',')}`)}
        disabled={ids.length < 2}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 18px', borderRadius: 10,
          background: ids.length >= 2 ? 'var(--blue)' : 'rgba(255,255,255,0.15)',
          color: 'white', border: 'none', cursor: ids.length >= 2 ? 'pointer' : 'not-allowed',
          fontSize: 13, fontWeight: 700, transition: 'background 0.15s',
        }}>
        <LayoutGrid size={14} />
        Compare now
      </button>

      <button onClick={clear}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', transition: 'background 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}>
        <X size={14} />
      </button>
    </div>
  );
}
