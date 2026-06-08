'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import LandlordGuard from '../../../components/LandlordGuard';
import Navbar from '../../../components/Navbar';
import api from '../../../lib/api';
import { ArrowLeft, Upload, X, Plus, Loader2, MapPin, Rotate3D } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUniversities } from '../../../hooks/useUniversities';

const LocationPicker = dynamic(() => import('../../../components/LocationPicker'), {
  ssr: false,
  loading: () => <div style={{ height: 280, borderRadius: 12, background: '#F9FAFB' }} />,
});

const ROOM_TYPES = ['Self-contained Single', 'Self-contained Double', 'Shared Room', 'Chamber and Hall', 'Single Room'];

const inp: React.CSSProperties = { width: '100%', border: '1.5px solid var(--border)', borderRadius: 12, padding: '13px 16px', fontSize: 15, color: 'var(--text)', background: 'white', outline: 'none', fontFamily: 'inherit' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6 };
const card: React.CSSProperties = { background: 'white', borderRadius: 20, border: '1px solid var(--border)', padding: 28, marginBottom: 20 };

export default function ListRoomPage() {
  const router = useRouter();
  const { universities } = useUniversities();
  const [loading, setLoading] = useState(false);
  const [images, setImages]   = useState<File[]>([]);
  const [tourFile, setTourFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    // Property info (becomes the hostel record)
    address:     '',
    university:  '',
    description: '',
    latitude:    '5.6502',
    longitude:   '-0.1869',
    // Room info
    room_type:     '',
    price:         '',
    gender_policy: 'Both',
    quantity:      '1',
    max_occupants: '1',
  });

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const addImages = (files: FileList | null) => {
    if (!files) return;
    setImages(prev => [...prev, ...Array.from(files)].slice(0, 8));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.address || !form.university || !form.room_type || !form.price) {
      toast.error('Please fill in all required fields'); return;
    }
    try {
      setLoading(true);

      // 1. Create a hostel record (the "property")
      const hRes = await api.post('/hostels', {
        hostel_name:    `${form.room_type} · ${form.address}`,
        hostel_address: form.address,
        university:     form.university,
        description:    form.description,
        latitude:       parseFloat(form.latitude)  || 5.6502,
        longitude:      parseFloat(form.longitude) || -0.1869,
        track: 'A',
      });
      const hostelId = hRes.data.hostel.id;

      // 2. Create the room
      const rRes = await api.post(`/hostels/${hostelId}/rooms/bulk`, {
        rooms: [{
          room_type:     form.room_type,
          price:         parseFloat(form.price),
          gender_policy: form.gender_policy,
          quantity:      parseInt(form.quantity),
          max_occupants: parseInt(form.max_occupants) || 1,
        }],
      });

      const roomId = rRes.data.rooms[0]?.id;

      // 3. Upload images if any
      if (images.length > 0 && roomId) {
        const fd = new FormData();
        images.forEach(f => fd.append('images', f));
        await api.post(`/upload/rooms/${roomId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => {});
      }

      // 4. Upload 360° tour if provided
      if (tourFile && roomId) {
        const fd = new FormData();
        fd.append('tour', tourFile);
        await api.post(`/rooms/${roomId}/tour`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => {});
      }

      toast.success('Room listed! It will go live after admin review.');
      router.push('/landlord');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LandlordGuard>
      <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
        <Navbar />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 60px' }}>

          <Link href="/landlord" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#64748B', textDecoration: 'none', marginBottom: 20 }}>
            <ArrowLeft size={15} /> Back to dashboard
          </Link>

          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginBottom: 6, letterSpacing: '-0.5px' }}>List a room</h1>
          <p style={{ fontSize: 16, color: '#64748B', marginBottom: 32 }}>
            Fill in the details below. Your listing goes live after a quick admin review — usually within 24 hours.
          </p>

          <form onSubmit={handleSubmit}>

            {/* Property */}
            <div style={card}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Property details</h2>
              <div style={{ display: 'grid', gap: 18 }}>

                <div>
                  <p style={lbl}>Full address *</p>
                  <input value={form.address} onChange={e => setF('address', e.target.value)}
                    placeholder="e.g. 14 Legon Road, East Legon, Accra" style={inp}
                    onFocus={e => ((e.target as HTMLElement).style.borderColor = 'var(--blue)')}
                    onBlur={e => ((e.target as HTMLElement).style.borderColor = 'var(--border)')} />
                </div>

                <div>
                  <p style={lbl}>Nearest university *</p>
                  <select value={form.university} onChange={e => setF('university', e.target.value)} style={inp}
                    onFocus={e => ((e.target as HTMLElement).style.borderColor = 'var(--blue)')}
                    onBlur={e => ((e.target as HTMLElement).style.borderColor = 'var(--border)')}>
                    <option value="">Select university</option>
                    {universities.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>

                <div>
                  <p style={lbl}>Description <span style={{ fontWeight: 400, color: '#94A3B8', fontSize: 13 }}>(optional)</span></p>
                  <textarea value={form.description} onChange={e => setF('description', e.target.value)}
                    placeholder="Describe the property — security, amenities, proximity to campus, water & electricity…"
                    rows={3} style={{ ...inp, resize: 'none' }}
                    onFocus={e => ((e.target as HTMLElement).style.borderColor = 'var(--blue)')}
                    onBlur={e => ((e.target as HTMLElement).style.borderColor = 'var(--border)')} />
                </div>
              </div>
            </div>

            {/* Location */}
            <div style={card}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Pin your location</h2>
              <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={13} /> Click the map or drag the pin to your exact location
              </p>
              <LocationPicker
                lat={form.latitude} lng={form.longitude}
                onChange={(lat, lng) => { setF('latitude', lat); setF('longitude', lng); }}
              />
            </div>

            {/* Room details */}
            <div style={card}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Room details</h2>
              <div style={{ display: 'grid', gap: 18 }}>

                <div>
                  <p style={lbl}>Room type *</p>
                  <select value={form.room_type} onChange={e => setF('room_type', e.target.value)} style={inp}
                    onFocus={e => ((e.target as HTMLElement).style.borderColor = 'var(--blue)')}
                    onBlur={e => ((e.target as HTMLElement).style.borderColor = 'var(--border)')}>
                    <option value="">Select type</option>
                    {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <p style={lbl}>Price per year (GHS) *</p>
                    <input type="number" value={form.price} onChange={e => setF('price', e.target.value)}
                      placeholder="e.g. 3500" style={inp}
                      onFocus={e => ((e.target as HTMLElement).style.borderColor = 'var(--blue)')}
                      onBlur={e => ((e.target as HTMLElement).style.borderColor = 'var(--border)')} />
                  </div>
                  <div>
                    <p style={lbl}>Number of rooms</p>
                    <input type="number" min="1" value={form.quantity} onChange={e => setF('quantity', e.target.value)}
                      style={inp}
                      onFocus={e => ((e.target as HTMLElement).style.borderColor = 'var(--blue)')}
                      onBlur={e => ((e.target as HTMLElement).style.borderColor = 'var(--border)')} />
                  </div>
                  <div>
                    <p style={lbl}>Max occupants per room</p>
                    <input type="number" min="1" value={form.max_occupants} onChange={e => setF('max_occupants', e.target.value)}
                      style={inp}
                      onFocus={e => ((e.target as HTMLElement).style.borderColor = 'var(--blue)')}
                      onBlur={e => ((e.target as HTMLElement).style.borderColor = 'var(--border)')} />
                  </div>
                </div>

                <div>
                  <p style={lbl}>Gender policy</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[['Male', '♂ Male only'], ['Female', '♀ Female only'], ['Both', '⚥ Mixed']].map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setF('gender_policy', val)}
                        style={{ flex: 1, padding: '11px 8px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center', border: `2px solid ${form.gender_policy === val ? 'var(--blue)' : 'var(--border)'}`, background: form.gender_policy === val ? 'var(--blue-light)' : 'white', color: form.gender_policy === val ? 'var(--blue)' : 'var(--text-2)', transition: 'all 0.15s' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Photos */}
            <div style={card}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Photos</h2>
              <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 16 }}>Good photos get more inquiries. Upload up to 8 photos.</p>

              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '28px', borderRadius: 14, border: '2px dashed var(--border)', cursor: 'pointer', background: '#FAFAFA', transition: 'background 0.15s' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--blue-light)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#FAFAFA')}>
                <Upload size={24} style={{ color: '#94A3B8' }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Click to upload photos</p>
                  <p style={{ fontSize: 13, color: '#94A3B8' }}>JPG, PNG or WEBP · Max 5MB each</p>
                </div>
                <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => addImages(e.target.files)} />
              </label>

              {images.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
                  {images.map((file, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={URL.createObjectURL(file)} alt="" style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 12 }} />
                      <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                        style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: '#EF4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {images.length < 8 && (
                    <label style={{ width: 88, height: 88, borderRadius: 12, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#FAFAFA' }}>
                      <Plus size={20} style={{ color: '#94A3B8' }} />
                      <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => addImages(e.target.files)} />
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* 360° Virtual Tour */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Rotate3D size={20} style={{ color: 'var(--blue)' }} />
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>360° Virtual Tour</h2>
                <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 400 }}>(optional)</span>
              </div>
              <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 16 }}>
                Upload an equirectangular panorama photo. Students can drag to explore the room before booking.
              </p>

              {tourFile ? (
                <div>
                  <div style={{ position: 'relative', height: 160, borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
                    <img src={URL.createObjectURL(tourFile)} alt="Tour preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(5px) brightness(0.45)', transform: 'scale(1.08)' }} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Rotate3D size={28} style={{ color: 'white' }} />
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>360° tour ready</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{tourFile.name}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setTourFile(null)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid #FECACA', background: '#FFF5F5', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <X size={13} /> Remove tour
                  </button>
                </div>
              ) : (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '28px', borderRadius: 14, border: '2px dashed var(--border)', cursor: 'pointer', background: '#FAFAFA', transition: 'background 0.15s', textAlign: 'center' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--blue-light)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#FAFAFA')}>
                  <Rotate3D size={24} style={{ color: '#94A3B8' }} />
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Click to upload 360° photo</p>
                    <p style={{ fontSize: 13, color: '#94A3B8' }}>Use panorama or 360° camera mode · JPG or PNG</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && setTourFile(e.target.files[0])} />
                </label>
              )}
            </div>

            {/* Viewing fee notice */}
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE047', borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#854D0E', marginBottom: 4 }}>Viewing fee: GHS 50 per student</p>
              <p style={{ fontSize: 14, color: '#92400E', lineHeight: 1.6 }}>
                Students pay GHS 50 to get your phone number and book a viewing. In group bookings, <strong>each person pays GHS 50 individually</strong>. You keep 100% of the annual rent — the viewing fee is separate.
              </p>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '16px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 14, fontSize: 17, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1, boxShadow: 'var(--sh-blue)' }}>
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Submitting…' : 'Submit for review →'}
            </button>
          </form>
        </div>
      </div>
    </LandlordGuard>
  );
}
