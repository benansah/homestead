'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import HostelCard from '../../components/HostelCard';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Heart, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Hostel } from '../../types';

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const router  = useRouter();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    api.get('/wishlist')
      .then(r => setHostels(r.data.hostels || []))
      .catch(() => toast.error('Failed to load saved hostels'))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const remove = async (hostelId: number) => {
    try {
      await api.delete(`/wishlist/${hostelId}`);
      setHostels(prev => prev.filter(h => h.id !== hostelId));
      toast.success('Removed from saved');
    } catch { toast.error('Failed to remove'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />

      {/* Page header */}
      <div className="page-header" style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '40px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={26} fill="#EF4444" color="#EF4444" />
            </div>
            <div>
              <h1 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-1px' }}>Saved hostels</h1>
              <p style={{ fontSize: 16, color: '#64748B', marginTop: 2 }}>
                {loading ? '…' : `${hostels.length} hostel${hostels.length !== 1 ? 's' : ''} saved`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 32px 80px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <Loader2 size={36} style={{ color: 'var(--blue)' }} className="animate-spin" />
          </div>
        ) : hostels.length === 0 ? (
          /* ── Empty state ── */
          <div style={{ background: 'white', borderRadius: 24, border: '1px solid var(--border)', padding: '80px 40px', textAlign: 'center', maxWidth: 520, margin: '0 auto', boxShadow: 'var(--sh-sm)' }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
              <Heart size={44} style={{ color: '#FECACA' }} />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>No saved hostels yet</h2>
            <p style={{ fontSize: 17, color: '#64748B', marginBottom: 36, lineHeight: 1.7 }}>
              Tap the ❤️ heart on any hostel listing to save it here for later.
            </p>
            <Link href="/hostels"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', background: 'var(--blue)', color: 'white', borderRadius: 14, fontWeight: 700, fontSize: 17, textDecoration: 'none', boxShadow: 'var(--sh-blue)' }}>
              Browse hostels →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {hostels.map(hostel => (
              <div key={hostel.id} style={{ position: 'relative' }}>
                <HostelCard hostel={hostel} />
                {/* Remove button */}
                <button onClick={() => remove(hostel.id)}
                  style={{ position: 'absolute', bottom: 20, right: 20, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'white', border: '1.5px solid #FCA5A5', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#EF4444', cursor: 'pointer', boxShadow: 'var(--sh-sm)', zIndex: 10, transition: 'all 0.15s' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#FEF2F2')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'white')}>
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
