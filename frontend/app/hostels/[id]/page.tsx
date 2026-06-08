'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import {
  MapPin, Star, ShieldCheck, Heart, Phone, Share2,
  ChevronLeft, ChevronRight, Bed, BedDouble, Users, Loader2, X,
  UserCheck, UsersRound, Copy, Check, CalendarDays, Flag, GitCompareArrows, Trash2,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Hostel, Room, Review } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useCompare } from '../../../context/CompareContext';
import HostelCard from '../../../components/HostelCard';
import { optimizeImage } from '../../../lib/cloudinary';

const HostelMap = dynamic(() => import('../../../components/HostelMap'), {
  ssr: false,
  loading: () => <div style={{ height: 288, borderRadius: 16, background: 'var(--surface)' }} className="animate-pulse" />,
});

interface HostelDetail { hostel: Hostel; rooms: Room[]; reviews: Review[]; similar?: Hostel[]; }

function StarRow({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={size}
          fill={i < Math.round(rating) ? '#F59E0B' : 'none'}
          color={i < Math.round(rating) ? '#F59E0B' : '#D1D5DB'} />
      ))}
    </div>
  );
}

export default function HostelDetailPage() {
  const { id }   = useParams();
  const router   = useRouter();
  const { user } = useAuth();
  const { ids: compareIds, toggle: toggleCompare } = useCompare();

  const [data, setData]               = useState<HostelDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [imgIndex, setImgIndex]       = useState(0);
  const [showAllImgs, setShowAllImgs] = useState(false);
  const [booking, setBooking]         = useState<Room | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [saved, setSaved]             = useState(false);
  const [saving, setSaving]           = useState(false);

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupRoom, setGroupRoom]           = useState<Room | null>(null);
  const [maxMembers, setMaxMembers]         = useState(2);
  const [groupLoading, setGroupLoading]     = useState(false);
  const [groupCode, setGroupCode]           = useState<number | null>(null);
  const [codeCopied, setCodeCopied]         = useState(false);
  const [pingRoom, setPingRoom]             = useState<Room | null>(null);
  const [pingMsg, setPingMsg]               = useState('');
  const [pinging, setPinging]               = useState(false);
  const [showFlagModal, setShowFlagModal]   = useState(false);
  const [flagReason, setFlagReason]         = useState('');
  const [flagging, setFlagging]             = useState(false);

  const [reviewRating, setReviewRating]       = useState(5);
  const [reviewComment, setReviewComment]     = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);

  const toggleSave = async () => {
    if (!user) { toast.error('Please sign in to save'); router.push('/login'); return; }
    if (saving) return;
    try {
      setSaving(true);
      if (saved) {
        await api.delete(`/wishlist/${id}`); setSaved(false); toast.success('Removed from saved');
      } else {
        await api.post('/wishlist', { hostel_id: Number(id) }); setSaved(true); toast.success('Saved ❤️');
      }
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: data?.hostel.hostel_name, url }); } catch {} }
    else { navigator.clipboard.writeText(url); toast.success('Link copied!'); }
  };

  useEffect(() => {
    api.get(`/hostels/${id}`)
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load hostel'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleGroupBook = async () => {
    if (!user) { toast.error('Please sign in'); router.push('/login'); return; }
    if (!groupRoom) return;
    try {
      setGroupLoading(true);
      const res = await api.post('/bookings/group', { room_id: groupRoom.id, max_members: maxMembers });
      setGroupCode(res.data.group_booking_id);
      if (res.data.payment_url) window.location.href = res.data.payment_url;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create group booking');
    } finally { setGroupLoading(false); }
  };

  const copyGroupCode = (code: number) => {
    navigator.clipboard.writeText(String(code));
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleBook = async (room: Room) => {
    if (!user) { toast.error('Please sign in to book'); router.push('/login'); return; }
    if (user.role !== 'student') { toast.error('Only students can book rooms'); return; }
    try {
      setBookingLoading(true);
      const res = await api.post('/bookings', { room_id: room.id });
      toast.success('Booking initiated! Completing payment…');
      if (res.data.payment_url) window.location.href = res.data.payment_url;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Booking failed');
    } finally { setBookingLoading(false); setBooking(null); }
  };

  const handlePing = async () => {
    if (!user) { router.push('/login'); return; }
    if (!pingRoom) return;
    try {
      setPinging(true);
      await api.post('/bookings/ping', { room_id: pingRoom.id, message: pingMsg });
      toast.success('Enquiry sent to landlord!');
      setPingRoom(null); setPingMsg('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send enquiry');
    } finally { setPinging(false); }
  };

  const handleFlag = async () => {
    if (!flagReason.trim()) return;
    try {
      setFlagging(true);
      await api.post(`/hostels/${id}/flag`, { reason: flagReason });
      toast.success('Report submitted. Thank you!');
      setShowFlagModal(false); setFlagReason('');
    } catch { toast.error('Failed to submit report'); }
    finally { setFlagging(false); }
  };

  const handleSubmitReview = async () => {
    if (!user) { router.push('/login'); return; }
    try {
      setSubmittingReview(true);
      await api.post('/reviews', { hostel_id: Number(id), rating: reviewRating, comment: reviewComment.trim() || undefined });
      toast.success('Review submitted!');
      setReviewComment(''); setReviewRating(5);
      const r = await api.get(`/hostels/${id}`);
      setData(r.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit review');
    } finally { setSubmittingReview(false); }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Delete this review?')) return;
    try {
      setDeletingReviewId(reviewId);
      await api.delete(`/reviews/${reviewId}`);
      setData(prev => prev ? { ...prev, reviews: prev.reviews.filter(r => r.id !== reviewId) } : prev);
      toast.success('Review deleted');
    } catch { toast.error('Failed to delete review'); }
    finally { setDeletingReviewId(null); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--blue)' }} />
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Hostel not found</p>
        <Link href="/hostels" style={{ color: 'var(--blue)', fontWeight: 600 }}>← Back to browse</Link>
      </div>
    </div>
  );

  const { hostel, rooms, reviews, similar = [] } = data;
  const allImages  = hostel.images?.filter(Boolean) || [];
  const avgRating  = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  const availCount = rooms.filter(r => r.is_available).length;

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Navbar />

      {/* ── GALLERY ── */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(12px,3vw,20px) clamp(16px,3vw,24px) 0' }}>
        {allImages.length > 0 ? (
          <>
            {/* Mobile: swipeable carousel */}
            <div className="md:hidden" style={{ position: 'relative', height: 300, borderRadius: 16, overflow: 'hidden' }}>
              <img src={allImages[imgIndex]} alt="Hostel photo"
                onClick={() => setShowAllImgs(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.45) 0%, transparent 55%)', pointerEvents: 'none' }} />

              {imgIndex > 0 && (
                <button onClick={() => setImgIndex(i => i - 1)}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--sh-sm)' }}>
                  <ChevronLeft size={18} />
                </button>
              )}
              {imgIndex < allImages.length - 1 && (
                <button onClick={() => setImgIndex(i => i + 1)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--sh-sm)' }}>
                  <ChevronRight size={18} />
                </button>
              )}

              {allImages.length > 1 && (
                <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
                  {allImages.slice(0, 8).map((_, i) => (
                    <button key={i} onClick={() => setImgIndex(i)}
                      style={{ width: i === imgIndex ? 20 : 6, height: 6, borderRadius: 3, background: 'white', opacity: i === imgIndex ? 1 : 0.5, border: 'none', padding: 0, cursor: 'pointer', transition: 'width 0.2s, opacity 0.2s' }} />
                  ))}
                </div>
              )}
              <span style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', color: 'white', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99 }}>
                {imgIndex + 1}/{allImages.length}
              </span>
            </div>

            {/* Desktop: photo grid */}
            <div className="hidden md:block" style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 4, height: 450 }}>
                <div style={{ gridRow: '1 / 3', position: 'relative', cursor: 'pointer' }} onClick={() => setShowAllImgs(true)}>
                  <img src={allImages[0]} alt="Main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                {allImages.slice(1, 5).map((img, i) => (
                  <div key={i} style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
                    onClick={() => { setImgIndex(i + 1); setShowAllImgs(true); }}>
                    <img src={img} alt={`Photo ${i + 2}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s', }} className="gallery-thumb" />
                    {i === 3 && allImages.length > 5 && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>+{allImages.length - 5} photos</span>
                      </div>
                    )}
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 4 - allImages.slice(1, 5).length) }).map((_, i) => (
                  <div key={`e-${i}`} style={{ background: 'var(--surface)' }} />
                ))}
              </div>
              <button onClick={() => setShowAllImgs(true)}
                style={{ position: 'absolute', bottom: 16, right: 16, background: 'white', border: '1.5px solid var(--border)', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--sh-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
                Show all {allImages.length} photos
              </button>
            </div>
          </>
        ) : (
          <div style={{ height: 300, borderRadius: 16, background: 'linear-gradient(135deg, var(--blue-light), #EDE9FE)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BedDouble size={56} style={{ color: 'var(--blue)', opacity: 0.25 }} />
          </div>
        )}
      </div>

      {/* ── FULLSCREEN GALLERY ── */}
      {showAllImgs && allImages.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.94)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => setShowAllImgs(false)}
            style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={22} style={{ color: 'white' }} />
          </button>
          <button onClick={() => setImgIndex(i => Math.max(0, i - 1))} disabled={imgIndex === 0}
            style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: imgIndex === 0 ? 0.25 : 1 }}>
            <ChevronLeft size={28} style={{ color: 'white' }} />
          </button>
          <img src={allImages[imgIndex]} alt="Gallery"
            style={{ maxHeight: '88vh', maxWidth: '80vw', objectFit: 'contain', borderRadius: 8 }} />
          <button onClick={() => setImgIndex(i => Math.min(allImages.length - 1, i + 1))} disabled={imgIndex === allImages.length - 1}
            style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: imgIndex === allImages.length - 1 ? 0.25 : 1 }}>
            <ChevronRight size={28} style={{ color: 'white' }} />
          </button>
          <div style={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500 }}>
            {imgIndex + 1} / {allImages.length}
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="r-detail-header" style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 24px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badges row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {hostel.is_verified && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: 'var(--blue-light)', color: 'var(--blue)' }}>
                  <ShieldCheck size={11} /> Verified
                </span>
              )}
              <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                Track {hostel.track}
              </span>
              {availCount > 0 && (
                <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: '#ECFDF5', color: '#059669' }}>
                  {availCount} room{availCount !== 1 ? 's' : ''} available
                </span>
              )}
            </div>

            <h1 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 900, color: 'var(--text)', marginBottom: 12, lineHeight: 1.2, letterSpacing: '-0.5px' }}>
              {hostel.hostel_name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={13} style={{ flexShrink: 0, color: '#9CA3AF' }} />
                {hostel.hostel_address}
              </span>
              <span style={{ opacity: 0.3 }}>·</span>
              <span style={{ color: 'var(--blue)', fontWeight: 600 }}>🎓 {hostel.university}</span>
              {hostel.landlord_last_active && (
                <>
                  <span style={{ opacity: 0.3 }}>·</span>
                  <span style={{ fontSize: 13, color: '#64748B' }}>
                    Active {(() => {
                      const diff = Date.now() - new Date(hostel.landlord_last_active).getTime();
                      const days = Math.floor(diff / 86400000);
                      if (days === 0) return 'today';
                      if (days === 1) return 'yesterday';
                      if (days < 7) return `${days} days ago`;
                      if (days < 30) return `${Math.floor(days / 7)}w ago`;
                      return `${Math.floor(days / 30)}mo ago`;
                    })()}
                  </span>
                </>
              )}
              {avgRating && (
                <>
                  <span style={{ opacity: 0.3 }}>·</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={13} fill="#F59E0B" color="#F59E0B" />
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>{avgRating}</span>
                    <span>({reviews.length})</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button onClick={handleShare}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'white', color: 'var(--text-2)', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
              <Share2 size={14} /> <span className="hidden sm:inline">Share</span>
            </button>
            <button onClick={toggleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: `1.5px solid ${saved ? '#FCA5A5' : 'var(--border)'}`, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: saved ? '#FEF2F2' : 'white', color: saved ? '#EF4444' : 'var(--text-2)', opacity: saving ? 0.6 : 1, transition: 'all 0.15s' }}>
              <Heart size={14} fill={saved ? '#EF4444' : 'none'} color={saved ? '#EF4444' : 'currentColor'} />
              {saved ? 'Saved' : 'Save'}
            </button>
            {data?.hostel && (() => {
              const inCompare = compareIds.includes(Number(id));
              return (
                <button
                  onClick={() => toggleCompare(Number(id), data.hostel.hostel_name)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${inCompare ? 'var(--blue)' : 'var(--border)'}`, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: inCompare ? 'var(--blue-light)' : 'white', color: inCompare ? 'var(--blue)' : '#374151', transition: 'all 0.15s' }}
                  title={inCompare ? 'Remove from compare' : 'Compare with others'}>
                  <GitCompareArrows size={14} />
                  {inCompare ? 'Comparing' : 'Compare'}
                </button>
              );
            })()}
            {user && (
              <button onClick={() => setShowFlagModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'white', color: '#94A3B8', transition: 'all 0.15s' }}
                title="Report this listing">
                <Flag size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="r-detail-pad" style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 24px 100px', display: 'flex', gap: 44, alignItems: 'flex-start' }}>

        {/* ── LEFT column ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* About */}
          {hostel.description && (
            <section style={{ marginBottom: 36, paddingBottom: 36, borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', marginBottom: 12, letterSpacing: '-0.3px' }}>About this hostel</h2>
              <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.8 }}>{hostel.description}</p>
            </section>
          )}

          {/* Rooms */}
          <section style={{ marginBottom: 36, paddingBottom: 36, borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.3px' }}>Rooms</h2>
              {availCount > 0 && (
                <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: '#ECFDF5', color: '#059669' }}>
                  {availCount} available
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rooms.map(room => (
                <div key={room.id} className="r-room-card"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderRadius: 16, border: '1.5px solid var(--border)', background: room.is_available ? 'white' : 'var(--surface)', gap: 16, borderLeft: `4px solid ${room.is_available ? 'var(--blue)' : '#E5E7EB'}` }}>

                  {/* Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 13, background: room.is_available ? 'var(--blue-light)' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Bed size={20} style={{ color: room.is_available ? 'var(--blue)' : '#9CA3AF' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.room_type}</p>
                        <Link href={`/hostels/${hostel.id}/rooms/${room.id}`}
                          style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          View room →
                        </Link>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--surface)', color: '#64748B', fontWeight: 600, border: '1px solid var(--border)' }}>
                          <Users size={9} style={{ display: 'inline', marginRight: 3 }} />{room.gender_policy}
                        </span>
                        <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{room.quantity} unit{room.quantity !== 1 ? 's' : ''}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: room.is_available ? '#ECFDF5' : '#FEF2F2', color: room.is_available ? '#059669' : '#DC2626' }}>
                          {room.is_available ? '● Available' : '● Full'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price + actions */}
                  <div className="r-room-card-right" style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="r-room-price-text">
                      <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', lineHeight: 1, marginBottom: 1 }}>
                        GHS {Number(room.price).toLocaleString()}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>per year</p>
                    </div>
                    {room.is_available ? (
                      <div className="r-room-btns" style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                        <button onClick={() => handleBook(room)} disabled={bookingLoading}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'var(--blue)', color: 'white', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: bookingLoading ? 0.6 : 1, whiteSpace: 'nowrap', boxShadow: 'var(--sh-blue)' }}>
                          {bookingLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                          Book · GHS 50
                        </button>
                        <button onClick={() => { setGroupRoom(room); setShowGroupModal(true); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1.5px solid var(--border)', color: 'var(--blue)', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'white', whiteSpace: 'nowrap' }}>
                          <UsersRound size={12} /> With friends
                        </button>
                        <button onClick={() => { if (!user) { router.push('/login'); return; } setPingRoom(room); }}
                          style={{ fontSize: 12, fontWeight: 600, color: '#059669', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                          Ask if available (free)
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>Unavailable</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Map */}
          {hostel.latitude && hostel.longitude && (
            <section style={{ marginBottom: 36, paddingBottom: 36, borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', marginBottom: 14, letterSpacing: '-0.3px' }}>Location</h2>
              <HostelMap lat={hostel.latitude} lng={hostel.longitude} name={hostel.hostel_name} address={hostel.hostel_address} />
              <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', marginTop: 10 }}>
                <MapPin size={12} /> {hostel.hostel_address}
              </p>
            </section>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <section>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', marginBottom: 16, letterSpacing: '-0.3px' }}>
                Reviews
              </h2>
              {/* Rating summary */}
              {avgRating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', background: 'var(--surface)', borderRadius: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center', minWidth: 64 }}>
                    <p style={{ fontSize: 44, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{avgRating}</p>
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
                      <StarRow rating={Number(avgRating)} size={14} />
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div style={{ width: 1, height: 56, background: 'var(--border)', flexShrink: 0 }} />
                  <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, flex: 1, minWidth: 200 }}>
                    Based on verified student reviews submitted after each viewing.
                  </p>
                </div>
              )}
              {/* Individual reviews */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {reviews.map((review, i) => (
                  <div key={review.id} style={{ padding: '18px 0', borderBottom: i < reviews.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: review.comment ? 10 : 0 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                        {review.student_name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{review.student_name || 'Student'}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              <CalendarDays size={11} />
                              {new Date(review.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                            </span>
                            {(user?.role === 'admin' || user?.id === review.student_id) && (
                              <button onClick={() => handleDeleteReview(review.id)}
                                disabled={deletingReviewId === review.id}
                                title="Delete review"
                                style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid #FEE2E2', background: '#FFF5F5', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                                {deletingReviewId === review.id
                                  ? <Loader2 size={11} className="animate-spin" />
                                  : <Trash2 size={11} />}
                              </button>
                            )}
                          </div>
                        </div>
                        <StarRow rating={review.rating} size={12} />
                      </div>
                    </div>
                    {review.comment && (
                      <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.75, paddingLeft: 50 }}>{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Write a review — students only */}
          {user?.role === 'student' && (
            <div style={{ marginTop: 28, padding: 24, background: 'white', borderRadius: 18, border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)' }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Write a review</h3>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 18, lineHeight: 1.6 }}>
                Only students with a booking at this hostel can leave reviews.
              </p>

              {/* Star picker */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setReviewRating(n)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, transition: 'transform 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                    <Star size={28} fill={n <= reviewRating ? '#F59E0B' : 'none'} color={n <= reviewRating ? '#F59E0B' : '#D1D5DB'} />
                  </button>
                ))}
                <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 600, color: '#374151', alignSelf: 'center' }}>
                  {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][reviewRating]}
                </span>
              </div>

              <textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="Describe your experience — cleanliness, security, management, proximity to campus…"
                rows={3}
                style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 12, padding: '12px 14px', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: 'var(--text)' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--blue)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />

              <button onClick={handleSubmitReview} disabled={submittingReview}
                style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: submittingReview ? 'not-allowed' : 'pointer', opacity: submittingReview ? 0.7 : 1, boxShadow: 'var(--sh-blue)' }}>
                {submittingReview ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} fill="white" color="white" />}
                {submittingReview ? 'Submitting…' : 'Submit review'}
              </button>
            </div>
          )}

          {/* Similar hostels */}
          {similar.length > 0 && (
            <section style={{ marginTop: 36, paddingTop: 36, borderTop: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', marginBottom: 20, letterSpacing: '-0.3px' }}>
                You might also like
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {similar.map(h => <HostelCard key={h.id} hostel={h} />)}
              </div>
            </section>
          )}
        </div>

        {/* ── RIGHT — sticky booking card ── */}
        <div className="hidden lg:block" style={{ width: 320, flexShrink: 0 }}>
          <div style={{ position: 'sticky', top: 88, borderRadius: 20, border: '1.5px solid var(--border)', padding: '24px', boxShadow: 'var(--sh-md)' }}>

            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px' }}>
                GHS {Number(rooms[0]?.price || 0).toLocaleString()}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}> / year starting</span>
            </div>

            {avgRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)', marginTop: 8 }}>
                <Star size={13} fill="#F59E0B" color="#F59E0B" />
                <span style={{ fontWeight: 700 }}>{avgRating}</span>
                <span style={{ color: 'var(--text-muted)' }}>· {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Room picker */}
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Select room</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {rooms.filter(r => r.is_available).slice(0, 3).map(room => (
                <button key={room.id} onClick={() => setBooking(room)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${booking?.id === room.id ? 'var(--blue)' : 'var(--border)'}`, background: booking?.id === room.id ? 'var(--blue-light)' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{room.room_type}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--blue)' }}>GHS {Number(room.price).toLocaleString()}</span>
                </button>
              ))}
              {rooms.filter(r => r.is_available).length === 0 && (
                <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 600, padding: '10px 0' }}>No rooms available currently</p>
              )}
            </div>

            {/* Fee note */}
            <div style={{ borderRadius: 12, padding: '12px 14px', marginBottom: 16, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 3 }}>Viewing fee: GHS 50</p>
              <p style={{ fontSize: 12, color: '#A16207', lineHeight: 1.55 }}>
                Pay GHS 50 to get the landlord's contact. Full refund if the room turns out to be unavailable.
              </p>
            </div>

            <button disabled={!booking || bookingLoading} onClick={() => booking && handleBook(booking)}
              style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'var(--blue)', color: 'white', fontSize: 15, fontWeight: 800, border: 'none', cursor: booking ? 'pointer' : 'not-allowed', opacity: !booking || bookingLoading ? 0.45 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10, boxShadow: booking ? 'var(--sh-blue)' : 'none', transition: 'opacity 0.15s' }}>
              {bookingLoading && <Loader2 size={15} className="animate-spin" />}
              {booking ? 'Book viewing · GHS 50' : 'Select a room above'}
            </button>

            {hostel.landlord_phone && (
              <a href={`tel:${hostel.landlord_phone}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', textDecoration: 'none', marginBottom: 12, transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <Phone size={14} /> Call landlord
              </a>
            )}

            <p style={{ fontSize: 12, textAlign: 'center', color: 'var(--text-muted)' }}>
              You won't be charged until booking is confirmed
            </p>

            {user?.role === 'student' && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Looking for a roommate?</p>
                <Link href={`/roommates?hostel_id=${id}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', textDecoration: 'none' }}>
                  <UserCheck size={14} style={{ color: 'var(--blue)' }} /> Find a roommate here
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── GROUP BOOKING MODAL ── */}
      {showGroupModal && groupRoom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 440, padding: 28, boxShadow: 'var(--sh-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>Book with friends</h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{groupRoom.room_type} · GHS {Number(groupRoom.price).toLocaleString()}/yr</p>
              </div>
              <button onClick={() => { setShowGroupModal(false); setGroupCode(null); }}
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {groupCode ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <UsersRound size={28} style={{ color: 'var(--blue)' }} />
                </div>
                <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Group booking created!</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>Share this code with your friends so they can join and each pay GHS 50.</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 14, background: 'var(--blue-light)', border: '1.5px solid var(--blue)', marginBottom: 16 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: '0.1em', color: 'var(--blue)' }}>#{groupCode}</span>
                  <button onClick={() => copyGroupCode(groupCode)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'var(--blue)', color: 'white', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                    {codeCopied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Redirecting to payment — each member pays GHS 50 individually.</p>
              </div>
            ) : (
              <>
                <div style={{ borderRadius: 12, padding: '14px 16px', marginBottom: 20, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>How it works</p>
                  <ol style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 2, paddingLeft: 16 }}>
                    <li>You pay GHS 50 and receive a group code</li>
                    <li>Share the code with your friends</li>
                    <li>Each friend enters the code and pays GHS 50</li>
                    <li>Admin releases the landlord's contact to everyone</li>
                  </ol>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>How many people (including you)?</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[2, 3, 4, 5, 6].map(n => (
                      <button key={n} onClick={() => setMaxMembers(n)}
                        style={{ flex: 1, padding: '11px 0', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer', border: `1.5px solid ${maxMembers === n ? 'var(--blue)' : 'var(--border)'}`, background: maxMembers === n ? 'var(--blue-light)' : 'white', color: maxMembers === n ? 'var(--blue)' : 'var(--text-2)', transition: 'all 0.15s' }}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Total: GHS {maxMembers * 50} ({maxMembers} × GHS 50)</p>
                </div>

                <button onClick={handleGroupBook} disabled={groupLoading}
                  style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'var(--blue)', color: 'white', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: groupLoading ? 0.6 : 1, boxShadow: 'var(--sh-blue)' }}>
                  {groupLoading ? <Loader2 size={16} className="animate-spin" /> : <UsersRound size={16} />}
                  Create group &amp; pay GHS 50
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MOBILE BOOK BAR ── */}
      <div className="lg:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', padding: '12px 20px 16px', boxShadow: '0 -4px 24px rgba(0,0,0,0.10)', borderTop: '1px solid var(--border)', zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', lineHeight: 1.2 }}>
              GHS {Number(rooms[0]?.price || 0).toLocaleString()}
              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}> /yr</span>
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Viewing fee: GHS 50</p>
          </div>
          <button disabled={bookingLoading}
            onClick={() => { const r = rooms.find(r => r.is_available); if (r) handleBook(r); else toast.error('No rooms available'); }}
            style={{ padding: '13px 28px', borderRadius: 14, background: 'var(--blue)', color: 'white', fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: bookingLoading ? 0.6 : 1, boxShadow: 'var(--sh-blue)', flexShrink: 0 }}>
            {bookingLoading && <Loader2 size={15} className="animate-spin" />}
            Book now
          </button>
        </div>
      </div>

      {/* ── FLAG MODAL ── */}
      {showFlagModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 400, padding: 28, boxShadow: 'var(--sh-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>Report this listing</h2>
              <button onClick={() => { setShowFlagModal(false); setFlagReason(''); }}
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 14 }}>
              Please describe the issue with this listing. Our team reviews all reports.
            </p>
            <textarea
              value={flagReason} onChange={e => setFlagReason(e.target.value)}
              placeholder="e.g. Photos don't match, landlord is unresponsive, scam listing…"
              rows={4}
              style={{ width: '100%', borderRadius: 10, border: '1.5px solid var(--border)', padding: '10px 14px', fontSize: 14, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 16, fontFamily: 'inherit' }}
            />
            <button onClick={handleFlag} disabled={flagging || !flagReason.trim()}
              style={{ width: '100%', padding: '13px', borderRadius: 12, background: '#DC2626', color: 'white', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: (flagging || !flagReason.trim()) ? 0.6 : 1 }}>
              {flagging ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </div>
      )}

      {/* ── PING MODAL ── */}
      {pingRoom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 400, padding: 28, boxShadow: 'var(--sh-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>Ask if available</h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{pingRoom.room_type} · GHS {Number(pingRoom.price).toLocaleString()}/yr</p>
              </div>
              <button onClick={() => { setPingRoom(null); setPingMsg(''); }}
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 14, lineHeight: 1.6 }}>
              This is a <strong>free</strong> enquiry. We'll send your contact details to the landlord so they can confirm availability — no GHS 50 fee.
            </p>
            <textarea
              value={pingMsg} onChange={e => setPingMsg(e.target.value)}
              placeholder="Optional message to landlord…"
              rows={3}
              style={{ width: '100%', borderRadius: 10, border: '1.5px solid var(--border)', padding: '10px 14px', fontSize: 14, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 16, fontFamily: 'inherit' }}
            />
            <button onClick={handlePing} disabled={pinging}
              style={{ width: '100%', padding: '13px', borderRadius: 12, background: '#059669', color: 'white', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: pinging ? 0.6 : 1 }}>
              {pinging ? 'Sending…' : 'Send free enquiry'}
            </button>
          </div>
        </div>
      )}

      <style>{`.gallery-thumb:hover { transform: scale(1.04); }`}</style>
    </div>
  );
}
