'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Loader2, Bookmark, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SavedSearch {
  id: number;
  label: string;
  university: string | null;
  min_price: number | null;
  max_price: number | null;
  gender_policy: string | null;
  created_at: string;
}

export default function SavedSearchesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'student') { router.push('/'); return; }
    api.get('/saved-searches')
      .then(r => setSearches(r.data))
      .catch(() => toast.error('Failed to load saved searches'))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/saved-searches/${id}`);
      setSearches(prev => prev.filter(s => s.id !== id));
      toast.success('Saved search removed');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const buildUrl = (s: SavedSearch) => {
    const params = new URLSearchParams();
    if (s.university) params.set('university', s.university);
    if (s.min_price) params.set('min_price', String(s.min_price));
    if (s.max_price) params.set('max_price', String(s.max_price));
    if (s.gender_policy) params.set('gender_policy', s.gender_policy);
    const q = params.toString();
    return `/hostels${q ? '?' + q : ''}`;
  };

  if (authLoading || loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Loader2 size={32} style={{ color: 'var(--blue)' }} className="animate-spin" />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 80px' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>Saved searches</h1>
          <p style={{ fontSize: 15, color: '#64748B', marginTop: 6 }}>
            We&apos;ll email you when a hostel matching these criteria goes live.
          </p>
        </div>

        {searches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 20, border: '1px solid var(--border)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Bookmark size={28} style={{ color: 'var(--blue)' }} />
            </div>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>No saved searches yet</p>
            <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 24 }}>
              Set your filters on the browse page and hit &quot;Save search&quot; to get email alerts.
            </p>
            <Link href="/hostels"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'var(--blue)', color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              Browse hostels <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {searches.map(s => (
              <div key={s.id} style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bookmark size={18} style={{ color: 'var(--blue)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{s.label}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {s.university && (
                      <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 99, background: '#F3F4F6', color: '#374151', fontWeight: 500 }}>
                        🎓 {s.university}
                      </span>
                    )}
                    {(s.min_price || s.max_price) && (
                      <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 99, background: '#F3F4F6', color: '#374151', fontWeight: 500 }}>
                        💰 GHS {s.min_price ?? 0} – {s.max_price ?? '∞'}
                      </span>
                    )}
                    {s.gender_policy && (
                      <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 99, background: '#F3F4F6', color: '#374151', fontWeight: 500 }}>
                        👥 {s.gender_policy}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <Link href={buildUrl(s)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 10, background: 'var(--blue-light)', color: 'var(--blue)', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                    Browse <ArrowRight size={12} />
                  </Link>
                  <button onClick={() => handleDelete(s.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, border: '1px solid #FECDD3', background: 'white', cursor: 'pointer', color: '#DC2626' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
