'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import LandlordGuard from '../../../../components/LandlordGuard';
import Navbar from '../../../../components/Navbar';
import api from '../../../../lib/api';
import { ArrowLeft, Loader2, MapPin, Plus, BedDouble, Pencil, Trash2, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useUniversities } from '../../../../hooks/useUniversities';

const LocationPicker = dynamic(() => import('../../../../components/LocationPicker'), {
  ssr: false,
  loading: () => <div style={{ height: 280, borderRadius: 12, background: '#F9FAFB' }} />,
});

const inp: React.CSSProperties = { width: '100%', border: '1.5px solid var(--border)', borderRadius: 12, padding: '13px 16px', fontSize: 15, color: 'var(--text)', background: 'white', outline: 'none', fontFamily: 'inherit' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6 };
const card: React.CSSProperties = { background: 'white', borderRadius: 20, border: '1px solid var(--border)', padding: 28, marginBottom: 20 };

export default function EditHostelPage() {
  const { hostelId } = useParams() as { hostelId: string };
  const router = useRouter();
  const { universities } = useUniversities();

  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [rooms, setRooms]         = useState<any[]>([]);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [addingRoom, setAddingRoom]   = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);
  const ROOM_TYPES = ['Self-contained Single', 'Self-contained Double', 'Shared Room', 'Chamber and Hall', 'Single Room'];
  const EMPTY_ROOM = { room_type: '', price: '', gender_policy: 'Both', quantity: '1', max_occupants: '1' };
  const [addRoomForm, setAddRoomForm] = useState({ ...EMPTY_ROOM });
  const setRF = (k: string, v: string) => setAddRoomForm(p => ({ ...p, [k]: v }));
  const [form, setForm] = useState({
    hostel_name:    '',
    hostel_address: '',
    university:     '',
    description:    '',
    latitude:       '5.6502',
    longitude:      '-0.1869',
    track:          'A',
  });

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    api.get(`/hostels/${hostelId}`)
      .then(res => {
        const h = res.data.hostel;
        setForm({
          hostel_name:    h.hostel_name    || '',
          hostel_address: h.hostel_address || '',
          university:     h.university     || '',
          description:    h.description   || '',
          latitude:       String(h.latitude  ?? 5.6502),
          longitude:      String(h.longitude ?? -0.1869),
          track:          h.track          || 'A',
        });
      })
      .catch(() => { toast.error('Hostel not found'); router.push('/landlord'); })
      .finally(() => setLoading(false));
    api.get(`/rooms/${hostelId}/rooms`).then(r => setRooms(r.data)).catch(() => {});
  }, [hostelId]);

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addRoomForm.room_type || !addRoomForm.price) { toast.error('Room type and price are required'); return; }
    try {
      setAddingRoom(true);
      const res = await api.post(`/rooms/${hostelId}/rooms`, {
        room_type:     addRoomForm.room_type,
        price:         parseFloat(addRoomForm.price),
        gender_policy: addRoomForm.gender_policy,
        quantity:      parseInt(addRoomForm.quantity) || 1,
        max_occupants: parseInt(addRoomForm.max_occupants) || 1,
      });
      setRooms(prev => [...prev, res.data.room]);
      setAddRoomForm({ ...EMPTY_ROOM });
      setShowAddRoom(false);
      toast.success('Room added');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add room');
    } finally { setAddingRoom(false); }
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm('Delete this room? This cannot be undone.')) return;
    try {
      setDeletingRoomId(roomId);
      await api.delete(`/rooms/${roomId}`);
      setRooms(prev => prev.filter(r => r.id !== roomId));
      toast.success('Room deleted');
    } catch { toast.error('Failed to delete room'); }
    finally { setDeletingRoomId(null); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hostel_name || !form.university || !form.hostel_address) {
      toast.error('Please fill in all required fields'); return;
    }
    try {
      setSaving(true);
      await api.put(`/hostels/${hostelId}`, {
        ...form,
        latitude:  parseFloat(form.latitude)  || 5.6502,
        longitude: parseFloat(form.longitude) || -0.1869,
      });
      toast.success('Hostel updated');
      router.push('/landlord');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
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
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 60px' }}>

          <Link href="/landlord" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#64748B', textDecoration: 'none', marginBottom: 20 }}>
            <ArrowLeft size={15} /> Back to dashboard
          </Link>

          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginBottom: 6, letterSpacing: '-0.5px' }}>Edit hostel</h1>
          <p style={{ fontSize: 15, color: '#64748B', marginBottom: 32 }}>
            Update your hostel details below. Changes are visible immediately after saving.
          </p>

          <form onSubmit={handleSubmit}>

            <div style={card}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Hostel details</h2>
              <div style={{ display: 'grid', gap: 18 }}>

                <div>
                  <p style={lbl}>Hostel name *</p>
                  <input value={form.hostel_name} onChange={e => setF('hostel_name', e.target.value)}
                    placeholder="e.g. Nana Ama Hostel" style={inp}
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
                  <p style={lbl}>Full address *</p>
                  <input value={form.hostel_address} onChange={e => setF('hostel_address', e.target.value)}
                    placeholder="e.g. 14 Legon Road, East Legon, Accra" style={inp}
                    onFocus={e => ((e.target as HTMLElement).style.borderColor = 'var(--blue)')}
                    onBlur={e => ((e.target as HTMLElement).style.borderColor = 'var(--border)')} />
                </div>

                <div>
                  <p style={lbl}>Description <span style={{ fontWeight: 400, color: '#94A3B8', fontSize: 13 }}>(optional)</span></p>
                  <textarea value={form.description} onChange={e => setF('description', e.target.value)}
                    placeholder="Describe the property — security, amenities, proximity to campus…"
                    rows={3} style={{ ...inp, resize: 'none' }}
                    onFocus={e => ((e.target as HTMLElement).style.borderColor = 'var(--blue)')}
                    onBlur={e => ((e.target as HTMLElement).style.borderColor = 'var(--border)')} />
                </div>

                <div>
                  <p style={lbl}>Listing type</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { val: 'A', label: 'Self-managed', desc: 'I manage my own listing' },
                      { val: 'B', label: 'Admin-managed', desc: 'Admin manages on my behalf' },
                    ].map(({ val, label, desc }) => (
                      <button key={val} type="button" onClick={() => setF('track', val)}
                        style={{ padding: '12px 14px', borderRadius: 14, border: `2px solid ${form.track === val ? 'var(--blue)' : 'var(--border)'}`, background: form.track === val ? 'var(--blue-light)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: form.track === val ? 'var(--blue)' : '#374151', marginBottom: 2 }}>Track {val} · {label}</p>
                        <p style={{ fontSize: 12, color: '#94A3B8' }}>{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={card}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Update location</h2>
              <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={13} /> Click the map or drag the pin to your exact location
              </p>
              <LocationPicker
                lat={form.latitude} lng={form.longitude}
                onChange={(lat, lng) => { setF('latitude', lat); setF('longitude', lng); }}
              />
            </div>

            <button type="submit" disabled={saving}
              style={{ width: '100%', padding: '16px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 14, fontSize: 17, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1, boxShadow: 'var(--sh-blue)' }}>
              {saving && <Loader2 size={18} className="animate-spin" />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>

          {/* ── Rooms manager ── */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>Rooms</h2>
                <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{rooms.length} room type{rooms.length !== 1 ? 's' : ''} listed</p>
              </div>
              <button onClick={() => setShowAddRoom(v => !v)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1.5px solid var(--blue)', background: showAddRoom ? 'var(--blue)' : 'var(--blue-light)', color: showAddRoom ? 'white' : 'var(--blue)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {showAddRoom ? <X size={14} /> : <Plus size={14} />}
                {showAddRoom ? 'Cancel' : 'Add room'}
              </button>
            </div>

            {/* Add room form */}
            {showAddRoom && (
              <form onSubmit={handleAddRoom} style={{ background: 'var(--blue-light)', borderRadius: 14, padding: 18, marginBottom: 18, border: '1.5px solid var(--blue-mid)' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue)', marginBottom: 14 }}>New room type</p>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <p style={lbl}>Room type *</p>
                    <select value={addRoomForm.room_type} onChange={e => setRF('room_type', e.target.value)} style={inp}
                      onFocus={e => ((e.target as HTMLElement).style.borderColor = 'var(--blue)')}
                      onBlur={e => ((e.target as HTMLElement).style.borderColor = 'var(--border)')}>
                      <option value="">Select type</option>
                      {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                      <p style={lbl}>Price/yr (GHS) *</p>
                      <input type="number" min="0" value={addRoomForm.price} onChange={e => setRF('price', e.target.value)} placeholder="3500" style={inp}
                        onFocus={e => ((e.target as HTMLElement).style.borderColor = 'var(--blue)')}
                        onBlur={e => ((e.target as HTMLElement).style.borderColor = 'var(--border)')} />
                    </div>
                    <div>
                      <p style={lbl}>Quantity</p>
                      <input type="number" min="1" value={addRoomForm.quantity} onChange={e => setRF('quantity', e.target.value)} style={inp}
                        onFocus={e => ((e.target as HTMLElement).style.borderColor = 'var(--blue)')}
                        onBlur={e => ((e.target as HTMLElement).style.borderColor = 'var(--border)')} />
                    </div>
                    <div>
                      <p style={lbl}>Max occupants</p>
                      <input type="number" min="1" value={addRoomForm.max_occupants} onChange={e => setRF('max_occupants', e.target.value)} style={inp}
                        onFocus={e => ((e.target as HTMLElement).style.borderColor = 'var(--blue)')}
                        onBlur={e => ((e.target as HTMLElement).style.borderColor = 'var(--border)')} />
                    </div>
                  </div>
                  <div>
                    <p style={lbl}>Gender policy</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[['Male','♂ Male only'],['Female','♀ Female only'],['Both','⚥ Mixed']].map(([val, label]) => (
                        <button key={val} type="button" onClick={() => setRF('gender_policy', val)}
                          style={{ flex: 1, padding: '9px 6px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center', border: `2px solid ${addRoomForm.gender_policy === val ? 'var(--blue)' : 'var(--border)'}`, background: addRoomForm.gender_policy === val ? 'white' : 'var(--blue-light)', color: addRoomForm.gender_policy === val ? 'var(--blue)' : 'var(--text-2)' }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={addingRoom}
                  style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: addingRoom ? 'not-allowed' : 'pointer', opacity: addingRoom ? 0.7 : 1 }}>
                  {addingRoom ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  {addingRoom ? 'Adding…' : 'Add room'}
                </button>
              </form>
            )}

            {/* Existing rooms */}
            {rooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: '#94A3B8' }}>
                <BedDouble size={28} style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 13 }}>No rooms yet — add one above.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rooms.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: '#FAFAFA', flexWrap: 'wrap' }}>
                    <BedDouble size={16} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>{r.room_type}</p>
                      <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                        GHS {Number(r.price).toLocaleString()} · {r.quantity} unit{r.quantity !== 1 ? 's' : ''} · {r.gender_policy}
                      </p>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: r.is_available ? '#ECFDF5' : '#FEF2F2', color: r.is_available ? '#065F46' : '#DC2626', flexShrink: 0 }}>
                      <CheckCircle2 size={10} /> {r.is_available ? 'Available' : 'Full'}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link href={`/landlord/edit-room/${r.id}`}
                        style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'white', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                        <Pencil size={13} />
                      </Link>
                      <button onClick={() => handleDeleteRoom(r.id)} disabled={deletingRoomId === r.id}
                        style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #FEE2E2', background: '#FFF5F5', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        {deletingRoomId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </LandlordGuard>
  );
}
