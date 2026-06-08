'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LandlordGuard from '../../../../components/LandlordGuard';
import Navbar from '../../../../components/Navbar';
import api from '../../../../lib/api';
import { ArrowLeft, Loader2, Trash2, Rotate3D, Upload, X } from 'lucide-react';
import { useRef } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const inp: React.CSSProperties = { width: '100%', border: '1.5px solid var(--border)', borderRadius: 12, padding: '13px 16px', fontSize: 15, color: 'var(--text)', background: 'white', outline: 'none', fontFamily: 'inherit' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6 };
const card: React.CSSProperties = { background: 'white', borderRadius: 20, border: '1px solid var(--border)', padding: 28, marginBottom: 20 };

const ROOM_TYPES = ['Self-contained Single', 'Self-contained Double', 'Shared Room', 'Chamber and Hall', 'Single Room'];

export default function EditRoomPage() {
  const { roomId } = useParams() as { roomId: string };
  const router = useRouter();

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hostelId, setHostelId] = useState<number | null>(null);

  const [tourUrl, setTourUrl]         = useState<string | null>(null);
  const [uploadingTour, setUploadingTour] = useState(false);
  const [removingTour, setRemovingTour]   = useState(false);
  const tourInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    room_type:     '',
    price:         '',
    gender_policy: 'Both',
    quantity:      '1',
    max_occupants: '1',
    is_available:  true,
  });

  const setF = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    api.get(`/rooms/${roomId}`)
      .then(res => {
        const r = res.data;
        setHostelId(r.hostel_id);
        setForm({
          room_type:     r.room_type     || '',
          price:         String(r.price  ?? ''),
          gender_policy: r.gender_policy || 'Both',
          quantity:      String(r.quantity      ?? 1),
          max_occupants: String(r.max_occupants ?? 1),
          is_available:  r.is_available !== false,
        });
        setTourUrl(r.tour_url || null);
      })
      .catch(() => { toast.error('Room not found'); router.push('/landlord'); })
      .finally(() => setLoading(false));
  }, [roomId]);

  const handleTourUpload = async (file: File) => {
    try {
      setUploadingTour(true);
      const fd = new FormData();
      fd.append('tour', file);
      const res = await api.post(`/rooms/${roomId}/tour`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setTourUrl(res.data.tour_url);
      toast.success('360° tour uploaded!');
    } catch {
      toast.error('Tour upload failed');
    } finally {
      setUploadingTour(false);
    }
  };

  const handleRemoveTour = async () => {
    if (!confirm('Remove this 360° tour?')) return;
    try {
      setRemovingTour(true);
      await api.patch(`/rooms/${roomId}`, { tour_url: null });
      setTourUrl(null);
      toast.success('Tour removed');
    } catch {
      toast.error('Failed to remove tour');
    } finally {
      setRemovingTour(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.room_type || !form.price) {
      toast.error('Room type and price are required'); return;
    }
    try {
      setSaving(true);
      await api.patch(`/rooms/${roomId}`, {
        room_type:     form.room_type,
        price:         parseFloat(form.price),
        gender_policy: form.gender_policy,
        quantity:      parseInt(form.quantity)      || 1,
        max_occupants: parseInt(form.max_occupants) || 1,
        is_available:  form.is_available,
      });
      toast.success('Room updated');
      router.push('/landlord');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this room permanently? This cannot be undone.')) return;
    try {
      setDeleting(true);
      await api.delete(`/rooms/${roomId}`);
      toast.success('Room deleted');
      router.push('/landlord');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <LandlordGuard>
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--blue)' }} />
      </div>
    </LandlordGuard>
  );

  return (
    <LandlordGuard>
      <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
        <Navbar />
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 20px 60px' }}>

          <Link href="/landlord" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#64748B', textDecoration: 'none', marginBottom: 20 }}>
            <ArrowLeft size={15} /> Back to dashboard
          </Link>

          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginBottom: 6, letterSpacing: '-0.5px' }}>Edit room</h1>
          <p style={{ fontSize: 15, color: '#64748B', marginBottom: 32 }}>
            Update the room details below.
          </p>

          <form onSubmit={handleSubmit}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <p style={lbl}>Price/yr (GHS) *</p>
                    <input type="number" min="0" value={form.price} onChange={e => setF('price', e.target.value)}
                      placeholder="3500" style={inp}
                      onFocus={e => ((e.target as HTMLElement).style.borderColor = 'var(--blue)')}
                      onBlur={e => ((e.target as HTMLElement).style.borderColor = 'var(--border)')} />
                  </div>
                  <div>
                    <p style={lbl}>Quantity</p>
                    <input type="number" min="1" value={form.quantity} onChange={e => setF('quantity', e.target.value)}
                      style={inp}
                      onFocus={e => ((e.target as HTMLElement).style.borderColor = 'var(--blue)')}
                      onBlur={e => ((e.target as HTMLElement).style.borderColor = 'var(--border)')} />
                  </div>
                  <div>
                    <p style={lbl}>Max occupants</p>
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

                <div>
                  <p style={lbl}>Availability</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[{ val: true, label: 'Available' }, { val: false, label: 'Full / Unavailable' }].map(({ val, label }) => (
                      <button key={String(val)} type="button" onClick={() => setF('is_available', val)}
                        style={{ flex: 1, padding: '11px 8px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center', border: `2px solid ${form.is_available === val ? (val ? '#059669' : '#DC2626') : 'var(--border)'}`, background: form.is_available === val ? (val ? '#ECFDF5' : '#FFF1F2') : 'white', color: form.is_available === val ? (val ? '#059669' : '#DC2626') : 'var(--text-2)', transition: 'all 0.15s' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* 360° Virtual Tour */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Rotate3D size={18} style={{ color: 'var(--blue)' }} />
                </div>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>360° Virtual Tour</p>
                  <p style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>Upload an equirectangular photo from panorama mode</p>
                </div>
              </div>

              {tourUrl ? (
                <div>
                  {/* Blurred preview */}
                  <div style={{ position: 'relative', height: 180, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
                    <img src={tourUrl} alt="360° tour preview" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(6px) brightness(0.45)', transform: 'scale(1.08)' }} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Rotate3D size={24} style={{ color: 'white' }} />
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>360° tour ready</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Students can explore this room in VR</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => tourInputRef.current?.click()} disabled={uploadingTour}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--blue)', background: 'var(--blue-light)', color: 'var(--blue)', fontSize: 13, fontWeight: 600, cursor: uploadingTour ? 'not-allowed' : 'pointer', opacity: uploadingTour ? 0.7 : 1 }}>
                      {uploadingTour ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {uploadingTour ? 'Uploading…' : 'Replace tour'}
                    </button>
                    <button type="button" onClick={handleRemoveTour} disabled={removingTour}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 14px', borderRadius: 12, border: '1px solid #FECACA', background: '#FFF5F5', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: removingTour ? 'not-allowed' : 'pointer', opacity: removingTour ? 0.7 : 1 }}>
                      {removingTour ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '32px 20px', borderRadius: 14, border: '2px dashed var(--border)', cursor: 'pointer', background: '#FAFAFA', transition: 'background 0.15s', textAlign: 'center' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--blue-light)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#FAFAFA')}>
                  {uploadingTour
                    ? <Loader2 size={28} className="animate-spin" style={{ color: 'var(--blue)' }} />
                    : <Rotate3D size={28} style={{ color: '#94A3B8' }} />
                  }
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      {uploadingTour ? 'Uploading tour…' : 'Upload 360° photo'}
                    </p>
                    <p style={{ fontSize: 13, color: '#94A3B8' }}>Use your phone's panorama or 360° camera mode · JPG or PNG</p>
                  </div>
                  <input ref={tourInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && handleTourUpload(e.target.files[0])} />
                </label>
              )}
            </div>

            <button type="submit" disabled={saving}
              style={{ width: '100%', padding: '16px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 14, fontSize: 17, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1, boxShadow: 'var(--sh-blue)', marginBottom: 12 }}>
              {saving && <Loader2 size={18} className="animate-spin" />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>

          {/* Hidden file input for "Replace tour" button */}
          <input ref={tourInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && handleTourUpload(e.target.files[0])} />

          {/* Danger zone */}
          <div style={{ background: '#FFF1F2', border: '1px solid #FECACA', borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#991B1B', marginBottom: 8 }}>Danger zone</p>
            <p style={{ fontSize: 13, color: '#7F1D1D', marginBottom: 16 }}>
              Permanently delete this room. This will also remove all associated images and cannot be undone.
            </p>
            <button onClick={handleDelete} disabled={deleting}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#DC2626', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: deleting ? 0.7 : 1 }}>
              {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              {deleting ? 'Deleting…' : 'Delete room'}
            </button>
          </div>

        </div>
      </div>
    </LandlordGuard>
  );
}
