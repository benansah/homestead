'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import HostelCard from '../../components/HostelCard';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Heart, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Hostel } from '../../types';

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [hostels, setHostels]   = useState<Hostel[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/wishlist');
        setHostels(res.data.hostels || []);
      } catch {
        toast.error('Failed to load saved hostels');
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user, authLoading]);

  const removeFromWishlist = async (hostelId: number) => {
    try {
      await api.delete(`/wishlist/${hostelId}`);
      setHostels(prev => prev.filter(h => h.id !== hostelId));
      toast.success('Removed from saved');
    } catch {
      toast.error('Failed to remove');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Heart size={22} style={{ color: 'var(--blue)' }} />
              Saved hostels
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {hostels.length} saved hostel{hostels.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        ) : hostels.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl"
            style={{ border: '1px solid var(--border)' }}>
            <Heart size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-lg font-semibold text-gray-600 mb-2">No saved hostels</p>
            <p className="text-sm text-gray-400 mb-6">
              Click the heart on any hostel to save it here
            </p>
            <Link href="/"
              className="inline-block px-5 py-2.5 text-sm font-semibold text-white rounded-xl"
              style={{ background: 'var(--blue)' }}>
              Browse hostels
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {hostels.map(hostel => (
              <div key={hostel.id} className="relative">
                <HostelCard hostel={hostel} />
                <button
                  onClick={() => removeFromWishlist(hostel.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full
                             flex items-center justify-center shadow-md z-10
                             hover:bg-red-50 transition-colors"
                  title="Remove from saved">
                  <Heart size={15} fill="#EF4444" color="#EF4444" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}