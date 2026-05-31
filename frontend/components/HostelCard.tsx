'use client';
import Link from 'next/link';
import { MapPin, Star, ShieldCheck, Heart } from 'lucide-react';
import { Hostel } from '../types';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Props { hostel: Hostel; }

export default function HostelCard({ hostel }: Props) {
  const { user } = useAuth();
  const router   = useRouter();
  const [saved, setSaved]       = useState(false);
  const [saving, setSaving]     = useState(false);

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { router.push('/login'); return; }
    if (saving) return;
    try {
      setSaving(true);
      if (saved) {
        await api.delete(`/wishlist/${hostel.id}`);
        setSaved(false);
        toast.success('Removed from saved');
      } else {
        await api.post('/wishlist', { hostel_id: hostel.id });
        setSaved(true);
        toast.success('Saved!');
      }
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Link href={`/hostels/${hostel.id}`} className="group block">
      <div className="rounded-lg overflow-hidden bg-white transition-shadow duration-200
                      hover:shadow-lg" style={{ border: '1px solid var(--border)' }}>

        {/* Image */}
        <div className="relative h-44 bg-gray-100 overflow-hidden">
          {hostel.images?.[0] ? (
            <img src={hostel.images[0]} alt={hostel.hostel_name}
              className="w-full h-full object-cover group-hover:scale-105
                         transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200
                            flex items-center justify-center">
              <span className="text-5xl opacity-20">🏠</span>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={toggleSave}
            disabled={saving}
            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full
                       flex items-center justify-center shadow-sm
                       hover:scale-110 transition-transform disabled:opacity-60"
            aria-label={saved ? 'Remove from saved' : 'Save hostel'}>
            <Heart
              size={15}
              fill={saved ? '#e53e3e' : 'none'}
              color={saved ? '#e53e3e' : '#767676'} />
          </button>

          {/* Verified */}
          {hostel.is_verified && (
            <div className="absolute top-2 left-2 flex items-center gap-1
                            bg-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm"
              style={{ color: 'var(--blue)' }}>
              <ShieldCheck size={11} /> Verified
            </div>
          )}

          {/* Available rooms */}
          {Number(hostel.available_rooms) > 0 && (
            <div className="absolute bottom-2 left-2 text-xs text-white
                            bg-black bg-opacity-55 px-2 py-1 rounded-full">
              {hostel.available_rooms} rooms available
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-lg font-bold text-gray-900">
              GHS {Number(hostel.min_price || 0).toLocaleString()}
              <span className="text-xs font-normal text-gray-400">/yr</span>
            </p>
            {hostel.avg_rating && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Star size={12} fill="#F59E0B" color="#F59E0B" />
                <span className="font-semibold">{Number(hostel.avg_rating).toFixed(1)}</span>
                {hostel.total_reviews && (
                  <span className="text-gray-400">({hostel.total_reviews})</span>
                )}
              </div>
            )}
          </div>

          <p className="text-sm font-semibold text-gray-800 truncate mb-0.5">
            {hostel.hostel_name}
          </p>

          <p className="flex items-center gap-1 text-xs text-gray-500 mb-2 truncate">
            <MapPin size={11} className="shrink-0" />
            {hostel.hostel_address}
          </p>

          <span className="inline-block text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
            {hostel.university}
          </span>

          {hostel.distance_km && (
            <p className="text-xs text-gray-400 mt-1.5">
              {hostel.distance_km} km from campus
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}