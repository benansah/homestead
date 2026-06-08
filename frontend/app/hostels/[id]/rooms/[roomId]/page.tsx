'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '../../../../../components/Navbar';
import api from '../../../../../lib/api';
import {
  Bed, Users, ShieldCheck, MapPin, ChevronLeft, ChevronRight,
  X, Loader2, ArrowLeft, UserCheck, UsersRound, Copy, Check,
  Camera, Rotate3D, Upload, Star,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Room } from '../../../../../types';
import { useAuth } from '../../../../../context/AuthContext';

const PannellumViewer = dynamic(() => import('../../../../../components/PannellumViewer'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: 420, borderRadius: 16, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={28} className="animate-spin" style={{ color: 'rgba(255,255,255,0.4)' }} />
    </div>
  ),
});

export default function RoomDetailPage() {
  const { id: hostelId, roomId } = useParams() as { id: string; roomId: string };
  const router  = useRouter();
  const { user } = useAuth();

  const [room, setRoom]           = useState<Room | null>(null);
  const [loading, setLoading]     = useState(true);
  const [imgIndex, setImgIndex]   = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [showTour, setShowTour]   = useState(false);

  // Booking state
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [maxMembers, setMaxMembers]         = useState(2);
  const [groupLoading, setGroupLoading]     = useState(false);
  const [groupCode, setGroupCode]           = useState<number | null>(null);
  const [codeCopied, setCodeCopied]         = useState(false);

  // Landlord management state
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingTour, setUploadingTour]     = useState(false);
  const imgInputRef  = useRef<HTMLInputElement>(null);
  const tourInputRef = useRef<HTMLInputElement>(null);

  const fetchRoom = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/rooms/${roomId}`);
      setRoom(res.data);
    } catch {
      toast.error('Room not found');
      router.push(`/hostels/${hostelId}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoom(); }, [roomId]);

  const handleBook = async () => {
    if (!user) { toast.error('Please sign in to book'); router.push('/login'); return; }
    if (user.role !== 'student') { toast.error('Only students can book rooms'); return; }
    if (!room) return;
    try {
      setBookingLoading(true);
      const res = await api.post('/bookings', { room_id: room.id });
      toast.success('Booking initiated! Completing payment…');
      if (res.data.payment_url) window.location.href = res.data.payment_url;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Booking failed');
    } finally { setBookingLoading(false); }
  };

  const handleGroupBook = async () => {
    if (!user) { toast.error('Please sign in'); router.push('/login'); return; }
    if (!room) return;
    try {
      setGroupLoading(true);
      const res = await api.post('/bookings/group', { room_id: room.id, max_members: maxMembers });
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

  const handleImageUpload = async (files: FileList) => {
    if (!room) return;
    try {
      setUploadingImages(true);
      const fd = new FormData();
      Array.from(files).forEach(f => fd.append('images', f));
      await api.post(`/uploads/rooms/${room.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Photos uploaded!');
      fetchRoom();
    } catch { toast.error('Upload failed'); }
    finally { setUploadingImages(false); }
  };

  const handleTourUpload = async (file: File) => {
    if (!room) return;
    try {
      setUploadingTour(true);
      const fd = new FormData();
      fd.append('tour', file);
      await api.post(`/rooms/${room.id}/tour`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('360° tour uploaded!');
      fetchRoom();
    } catch { toast.error('Upload failed'); }
    finally { setUploadingTour(false); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--blue)' }} />
      </div>
    </div>
  );

  if (!room) return null;

  const images    = room.images?.filter(Boolean) || [];
  const isLandlord = user?.id === room.landlord_id;

  const GENDER_LABEL = { Male: 'Male only', Female: 'Female only', Both: 'Mixed' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />

      {/* ── Breadcrumb ── */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '12px clamp(16px,3vw,24px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Link href={`/hostels/${hostelId}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#64748B', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> {room.hostel_name || 'Back to hostel'}
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(16px,3vw,28px) clamp(16px,3vw,24px) 100px' }}>

        {/* ── Room header ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: room.is_available ? '#ECFDF5' : '#FEF2F2', color: room.is_available ? '#059669' : '#DC2626' }}>
              {room.is_available ? '● Available' : '● Full'}
            </span>
            {room.is_verified && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'var(--blue-light)', color: 'var(--blue)' }}>
                <ShieldCheck size={10} /> Verified hostel
              </span>
            )}
          </div>

          <h1 style={{ fontSize: 'clamp(22px,4vw,34px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px', marginBottom: 6, lineHeight: 1.2 }}>
            {room.room_type}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14, color: '#64748B' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={13} style={{ color: '#9CA3AF' }} /> {room.hostel_address}
            </span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span style={{ color: 'var(--blue)', fontWeight: 600 }}>🎓 {room.university}</span>
          </div>
        </div>

        {/* ── Image Gallery ── */}
        {images.length > 0 ? (
          <div style={{ marginBottom: 24 }}>
            {/* Mobile: carousel */}
            <div className="md:hidden" style={{ position: 'relative', height: 280, borderRadius: 16, overflow: 'hidden' }}>
              <img src={images[imgIndex]} alt="Room photo"
                onClick={() => setShowGallery(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.4) 0%, transparent 50%)', pointerEvents: 'none' }} />
              {imgIndex > 0 && (
                <button onClick={() => setImgIndex(i => i - 1)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeft size={17} />
                </button>
              )}
              {imgIndex < images.length - 1 && (
                <button onClick={() => setImgIndex(i => i + 1)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={17} />
                </button>
              )}
              {images.length > 1 && (
                <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
                  {images.slice(0, 7).map((_, i) => (
                    <button key={i} onClick={() => setImgIndex(i)}
                      style={{ width: i === imgIndex ? 20 : 6, height: 6, borderRadius: 3, background: 'white', opacity: i === imgIndex ? 1 : 0.5, border: 'none', padding: 0, cursor: 'pointer', transition: 'width 0.2s' }} />
                  ))}
                </div>
              )}
              <span style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', color: 'white', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99 }}>
                {imgIndex + 1}/{images.length}
              </span>
            </div>

            {/* Desktop: grid */}
            <div className="hidden md:block" style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
              {images.length === 1 ? (
                <div style={{ height: 400, cursor: 'pointer' }} onClick={() => setShowGallery(true)}>
                  <img src={images[0]} alt="Room" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : images.length === 2 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, height: 380 }}>
                  {images.map((img, i) => (
                    <div key={i} style={{ cursor: 'pointer', overflow: 'hidden' }} onClick={() => { setImgIndex(i); setShowGallery(true); }}>
                      <img src={img} alt={`Room ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 4, height: 400 }}>
                  <div style={{ gridRow: '1 / 3', cursor: 'pointer', overflow: 'hidden' }} onClick={() => setShowGallery(true)}>
                    <img src={images[0]} alt="Main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  {images.slice(1, 5).map((img, i) => (
                    <div key={i} style={{ cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
                      onClick={() => { setImgIndex(i + 1); setShowGallery(true); }}>
                      <img src={img} alt={`Room ${i + 2}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {i === 3 && images.length > 5 && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>+{images.length - 5} photos</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - images.slice(1, 5).length) }).map((_, i) => (
                    <div key={`e-${i}`} style={{ background: 'var(--surface)' }} />
                  ))}
                </div>
              )}
              {images.length > 1 && (
                <button onClick={() => setShowGallery(true)}
                  style={{ position: 'absolute', bottom: 14, right: 14, background: 'white', border: '1.5px solid var(--border)', borderRadius: 10, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--sh-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Camera size={13} /> All {images.length} photos
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ height: 260, borderRadius: 16, background: 'linear-gradient(135deg, var(--blue-light), #EDE9FE)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 10 }}>
            <Bed size={48} style={{ color: 'var(--blue)', opacity: 0.25 }} />
            <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>No photos yet</p>
            {isLandlord && (
              <button onClick={() => imgInputRef.current?.click()}
                style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', background: 'var(--blue-light)', border: 'none', padding: '7px 16px', borderRadius: 10, cursor: 'pointer' }}>
                + Add photos
              </button>
            )}
          </div>
        )}

        {/* ── Fullscreen gallery ── */}
        {showGallery && images.length > 0 && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.94)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button onClick={() => setShowGallery(false)} style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={22} style={{ color: 'white' }} />
            </button>
            <button onClick={() => setImgIndex(i => Math.max(0, i - 1))} disabled={imgIndex === 0} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: imgIndex === 0 ? 0.25 : 1 }}>
              <ChevronLeft size={28} style={{ color: 'white' }} />
            </button>
            <img src={images[imgIndex]} alt="Gallery" style={{ maxHeight: '88vh', maxWidth: '80vw', objectFit: 'contain', borderRadius: 8 }} />
            <button onClick={() => setImgIndex(i => Math.min(images.length - 1, i + 1))} disabled={imgIndex === images.length - 1} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: imgIndex === images.length - 1 ? 0.25 : 1 }}>
              <ChevronRight size={28} style={{ color: 'white' }} />
            </button>
            <div style={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{imgIndex + 1} / {images.length}</div>
          </div>
        )}

        {/* ── Two-column layout ── */}
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* ── Left column ── */}
          <div style={{ flex: 1, minWidth: 280 }}>

            {/* 360° Virtual Tour */}
            <section style={{ marginBottom: 28, padding: 24, background: 'white', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Rotate3D size={18} style={{ color: 'var(--blue)' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>360° Virtual Tour</h2>
                    <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Drag to look around the room</p>
                  </div>
                </div>
                {room.tour_url && (
                  <button onClick={() => setShowTour(t => !t)}
                    style={{ fontSize: 12, fontWeight: 700, padding: '7px 16px', borderRadius: 10, border: `1.5px solid ${showTour ? 'var(--blue)' : 'var(--border)'}`, background: showTour ? 'var(--blue-light)' : 'white', color: showTour ? 'var(--blue)' : '#64748B', cursor: 'pointer' }}>
                    {showTour ? 'Hide tour' : 'Launch tour'}
                  </button>
                )}
              </div>

              {room.tour_url ? (
                showTour ? (
                  <PannellumViewer imageUrl={room.tour_url} height={420} />
                ) : (
                  <div onClick={() => setShowTour(true)} style={{ height: 200, borderRadius: 14, background: '#0F172A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 10, position: 'relative', overflow: 'hidden' }}>
                    {/* Blurred preview */}
                    <img src={room.tour_url} alt="360° preview" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px) brightness(0.4)', transform: 'scale(1.1)' }} />
                    <div style={{ position: 'relative', textAlign: 'center' }}>
                      <Rotate3D size={36} style={{ color: 'white', marginBottom: 8 }} />
                      <p style={{ fontSize: 15, fontWeight: 800, color: 'white', marginBottom: 4 }}>Click to explore in 360°</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Drag to look around</p>
                    </div>
                  </div>
                )
              ) : (
                <div style={{ height: 160, borderRadius: 14, background: 'var(--surface)', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Rotate3D size={28} style={{ color: '#94A3B8' }} />
                  <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>No virtual tour yet</p>
                  {isLandlord && (
                    <button onClick={() => tourInputRef.current?.click()} disabled={uploadingTour}
                      style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', background: 'var(--blue-light)', border: 'none', padding: '7px 16px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {uploadingTour ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      Upload 360° photo
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Room details */}
            <section style={{ marginBottom: 28, padding: 24, background: 'white', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)' }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 16, letterSpacing: '-0.3px' }}>Room details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Type', value: room.room_type },
                  { label: 'Gender', value: GENDER_LABEL[room.gender_policy] },
                  { label: 'Units available', value: `${room.quantity} unit${room.quantity !== 1 ? 's' : ''}` },
                  { label: 'Max occupants', value: `${room.max_occupants ?? 1} person${(room.max_occupants ?? 1) !== 1 ? 's' : ''}` },
                  { label: 'Status', value: room.is_available ? 'Available' : 'Full', color: room.is_available ? '#059669' : '#DC2626' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ padding: '14px 16px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{label}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: color || '#0F172A' }}>{value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* About the hostel */}
            <section style={{ padding: 24, background: 'white', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)' }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 14, letterSpacing: '-0.3px' }}>About the hostel</h2>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={20} style={{ color: 'var(--blue)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 3 }}>{room.hostel_name}</p>
                  <p style={{ fontSize: 13, color: '#64748B', marginBottom: 3 }}>{room.hostel_address}</p>
                  <p style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 600 }}>🎓 {room.university}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <Link href={`/hostels/${hostelId}`}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 700, color: '#374151', textDecoration: 'none', background: 'white' }}>
                  View full hostel →
                </Link>
                {user?.role === 'student' && (
                  <Link href={`/roommates?hostel_id=${hostelId}`}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 700, color: '#374151', textDecoration: 'none', background: 'white' }}>
                    <UserCheck size={13} style={{ color: 'var(--blue)' }} /> Find roommate
                  </Link>
                )}
              </div>
            </section>
          </div>

          {/* ── Right column: booking card ── */}
          <div style={{ width: 300, flexShrink: 0 }}>
            <div style={{ position: 'sticky', top: 88 }}>
              <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid var(--border)', padding: 24, boxShadow: 'var(--sh-md)', marginBottom: 16 }}>
                <p style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px', marginBottom: 2 }}>
                  GHS {Number(room.price).toLocaleString()}
                </p>
                <p style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>per year · {room.room_type}</p>

                <div style={{ borderRadius: 12, padding: '12px 14px', marginBottom: 16, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 3 }}>Viewing fee: GHS 50</p>
                  <p style={{ fontSize: 12, color: '#A16207', lineHeight: 1.55 }}>
                    Pay GHS 50 to get the landlord's contact and arrange a viewing. Full refund if unavailable.
                  </p>
                </div>

                {room.is_available ? (
                  <>
                    <button onClick={handleBook} disabled={bookingLoading}
                      style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'var(--blue)', color: 'white', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10, boxShadow: 'var(--sh-blue)', opacity: bookingLoading ? 0.6 : 1 }}>
                      {bookingLoading && <Loader2 size={15} className="animate-spin" />}
                      Book viewing · GHS 50
                    </button>
                    <button onClick={() => setShowGroupModal(true)}
                      style={{ width: '100%', padding: '12px', borderRadius: 14, border: '1.5px solid var(--border)', background: 'white', color: '#374151', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                      <UsersRound size={15} style={{ color: 'var(--blue)' }} /> Book with friends
                    </button>
                  </>
                ) : (
                  <div style={{ padding: '14px', borderRadius: 14, background: '#FEF2F2', border: '1.5px solid #FECACA', textAlign: 'center', marginBottom: 12 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#DC2626' }}>This room is currently full</p>
                    <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>Check other room types at this hostel</p>
                  </div>
                )}

                <p style={{ fontSize: 12, textAlign: 'center', color: '#94A3B8' }}>No charge until booking is confirmed</p>
              </div>

              {/* Landlord management card */}
              {isLandlord && (
                <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid var(--border)', padding: 20, boxShadow: 'var(--sh-sm)' }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>Manage this room</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Link href={`/landlord/edit-room/${room.id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--blue)', background: 'var(--blue-light)', color: 'var(--blue)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                      ✏️ Edit room details
                    </Link>
                    <button onClick={() => imgInputRef.current?.click()} disabled={uploadingImages}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'white', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      {uploadingImages ? <Loader2 size={14} className="animate-spin" style={{ color: 'var(--blue)' }} /> : <Camera size={14} style={{ color: 'var(--blue)' }} />}
                      {uploadingImages ? 'Uploading…' : 'Add room photos'}
                    </button>
                    <button onClick={() => tourInputRef.current?.click()} disabled={uploadingTour}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${room.tour_url ? 'var(--blue)' : 'var(--border)'}`, background: room.tour_url ? 'var(--blue-light)' : 'white', color: room.tour_url ? 'var(--blue)' : '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      {uploadingTour ? <Loader2 size={14} className="animate-spin" style={{ color: 'var(--blue)' }} /> : <Rotate3D size={14} style={{ color: 'var(--blue)' }} />}
                      {uploadingTour ? 'Uploading…' : room.tour_url ? 'Replace 360° tour' : 'Upload 360° tour'}
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 10, lineHeight: 1.6 }}>
                    For the 360° tour, upload an equirectangular photo taken with your phone's panorama mode.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={imgInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
        onChange={e => e.target.files && handleImageUpload(e.target.files)} />
      <input ref={tourInputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && handleTourUpload(e.target.files[0])} />

      {/* ── Group booking modal ── */}
      {showGroupModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 440, padding: 28, boxShadow: 'var(--sh-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Book with friends</h2>
                <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{room.room_type} · GHS {Number(room.price).toLocaleString()}/yr</p>
              </div>
              <button onClick={() => { setShowGroupModal(false); setGroupCode(null); }}
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={15} style={{ color: '#64748B' }} />
              </button>
            </div>

            {groupCode ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <UsersRound size={28} style={{ color: 'var(--blue)' }} />
                </div>
                <p style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>Group booking created!</p>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20, lineHeight: 1.6 }}>Share this code with your friends so they can join.</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 14, background: 'var(--blue-light)', border: '1.5px solid var(--blue)', marginBottom: 14 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: '0.1em', color: 'var(--blue)' }}>#{groupCode}</span>
                  <button onClick={() => copyGroupCode(groupCode)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'var(--blue)', color: 'white', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                    {codeCopied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: '#94A3B8' }}>Each member pays GHS 50 individually.</p>
              </div>
            ) : (
              <>
                <div style={{ borderRadius: 12, padding: '14px 16px', marginBottom: 20, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>How it works</p>
                  <ol style={{ fontSize: 13, color: '#374151', lineHeight: 2, paddingLeft: 16 }}>
                    <li>You pay GHS 50 and get a group code</li>
                    <li>Share the code with your friends</li>
                    <li>Each friend pays GHS 50 individually</li>
                    <li>Admin releases landlord contact to everyone</li>
                  </ol>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>How many people (including you)?</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[2, 3, 4, 5, 6].map(n => (
                      <button key={n} onClick={() => setMaxMembers(n)}
                        style={{ flex: 1, padding: '11px 0', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer', border: `1.5px solid ${maxMembers === n ? 'var(--blue)' : 'var(--border)'}`, background: maxMembers === n ? 'var(--blue-light)' : 'white', color: maxMembers === n ? 'var(--blue)' : '#374151', transition: 'all 0.15s' }}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 8 }}>Total: GHS {maxMembers * 50} ({maxMembers} × GHS 50)</p>
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

      {/* ── Mobile book bar ── */}
      <div className="lg:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', padding: '12px 20px 16px', boxShadow: '0 -4px 24px rgba(0,0,0,0.10)', borderTop: '1px solid var(--border)', zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', lineHeight: 1.2 }}>
              GHS {Number(room.price).toLocaleString()}
              <span style={{ fontSize: 12, fontWeight: 400, color: '#64748B' }}> /yr</span>
            </p>
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Viewing fee: GHS 50</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowGroupModal(true)}
              style={{ padding: '12px 16px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'white', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <UsersRound size={15} style={{ color: 'var(--blue)' }} />
            </button>
            <button onClick={handleBook} disabled={!room.is_available || bookingLoading}
              style={{ padding: '12px 24px', borderRadius: 12, background: room.is_available ? 'var(--blue)' : '#9CA3AF', color: 'white', fontSize: 13, fontWeight: 800, border: 'none', cursor: room.is_available ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, boxShadow: room.is_available ? 'var(--sh-blue)' : 'none' }}>
              {bookingLoading && <Loader2 size={13} className="animate-spin" />}
              {room.is_available ? 'Book now' : 'Full'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
