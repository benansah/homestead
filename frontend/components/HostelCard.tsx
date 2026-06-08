'use client';
import Link from 'next/link';
import { MapPin, Star, ShieldCheck, Heart, BedDouble, GitCompareArrows } from 'lucide-react';
import { Hostel } from '../types';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useCompare } from '../context/CompareContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { optimizeImage } from '../lib/cloudinary';

export default function HostelCard({ hostel }: { hostel: Hostel }) {
  const { user } = useAuth();
  const router   = useRouter();
  const { ids: compareIds, toggle: toggleCompare } = useCompare();
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);
  const inCompare = compareIds.includes(hostel.id);

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
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
        toast.success('Saved to wishlist ❤️');
      }
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const img      = hostel.images?.[0] ? optimizeImage(hostel.images[0], 600) : undefined;
  const minPrice = Number(hostel.min_price || 0).toLocaleString();
  const maxPrice = hostel.max_price && hostel.max_price !== hostel.min_price
    ? Number(hostel.max_price).toLocaleString() : null;
  const rating       = hostel.avg_rating ? Number(hostel.avg_rating).toFixed(1) : null;
  const roomsLeft    = Number(hostel.available_rooms ?? 0);
  const isFull       = hostel.available_rooms !== undefined && roomsLeft === 0;

  return (
    <Link href={`/hostels/${hostel.id}`} style={{ display: 'block' }}>
      <div className="card card-hover" style={{ overflow: 'hidden' }}>

        {/* ── Image ── */}
        <div style={{ position: 'relative', paddingBottom: '66%', background: 'var(--blue-light)', overflow: 'hidden' }}>
          {img ? (
            <img src={img} alt={hostel.hostel_name} className="hostel-img"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EBF3FF, #DBEAFE)' }}>
              <BedDouble size={48} style={{ color: 'var(--blue)', opacity: 0.2 }} />
            </div>
          )}

          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.52) 0%, transparent 52%)' }} />

          {/* Action buttons */}
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={toggleSave} disabled={saving} aria-label="Save"
              style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--sh-sm)', transition: 'transform 0.15s', border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.14)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              <Heart size={15} fill={saved ? '#EF4444' : 'none'} color={saved ? '#EF4444' : '#6B7280'} />
            </button>
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); toggleCompare(hostel.id, hostel.hostel_name); }}
              aria-label="Compare"
              title={inCompare ? 'Remove from compare' : 'Add to compare'}
              style={{ width: 34, height: 34, borderRadius: '50%', background: inCompare ? 'var(--blue)' : 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--sh-sm)', transition: 'all 0.15s', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.14)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              <GitCompareArrows size={15} color={inCompare ? 'white' : '#6B7280'} />
            </button>
          </div>

          {/* Verified badge */}
          {hostel.is_verified && (
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: 'rgba(255,255,255,0.95)', color: 'var(--blue)' }}>
              <ShieldCheck size={10} /> Verified
            </div>
          )}

          {/* Availability pill */}
          {isFull ? (
            <span style={{ position: 'absolute', bottom: 10, left: 12, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: 'rgba(239,68,68,0.85)', color: 'white', backdropFilter: 'blur(4px)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FCA5A5', display: 'inline-block', flexShrink: 0 }} />
              Full
            </span>
          ) : roomsLeft > 0 ? (
            <span style={{ position: 'absolute', bottom: 10, left: 12, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: 'rgba(0,0,0,0.52)', color: 'white', backdropFilter: 'blur(6px)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', display: 'inline-block', flexShrink: 0 }} />
              {roomsLeft} room{roomsLeft !== 1 ? 's' : ''} left
            </span>
          ) : null}
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '16px 18px 18px' }}>

          {/* Price + rating row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>
              GHS {minPrice}{maxPrice ? <span style={{ fontWeight: 600, color: '#64748B' }}> – {maxPrice}</span> : ''}
              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}> /yr</span>
            </p>
            {rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, marginTop: 2 }}>
                <Star size={12} fill="#F59E0B" color="#F59E0B" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{rating}</span>
                {hostel.total_reviews ? (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({hostel.total_reviews})</span>
                ) : null}
              </div>
            )}
          </div>

          {/* Hostel name */}
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
            {hostel.hostel_name}
          </p>

          {/* Address */}
          <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 12 }}>
            <MapPin size={11} style={{ flexShrink: 0, color: '#9CA3AF' }} />
            {hostel.hostel_address}
          </p>

          {/* Footer chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: 'var(--blue-light)', color: 'var(--blue)' }}>
              🎓 {hostel.university}
            </span>
            {hostel.total_rooms ? (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: 'var(--surface)', color: '#64748B', border: '1px solid var(--border)' }}>
                {hostel.total_rooms} room{hostel.total_rooms !== 1 ? 's' : ''}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
