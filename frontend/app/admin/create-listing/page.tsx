'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AdminGuard from '../../../components/AdminGuard';
import AdminSidebar from '../../../components/AdminSidebar';
import api from '../../../lib/api';
import { Loader2, ArrowLeft, MapPin, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUniversities } from '../../../hooks/useUniversities';

const LocationPicker = dynamic(() => import('../../../components/LocationPicker'), {
  ssr: false,
  loading: () => <div style={{ height: 300, borderRadius: 12, background: 'var(--surface)' }} />,
});

const input: React.CSSProperties = { width: '100%', border: '1.5px solid var(--border)', borderRadius: 12, padding: '12px 16px', fontSize: 15, color: 'var(--text)', background: 'white', outline: 'none', fontFamily: 'inherit' };
const label: React.CSSProperties = { display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6 };

interface RoomRow { room_type: string; price: string; gender_policy: string; quantity: string; max_occupants: string; }
const EMPTY_ROOM: RoomRow = { room_type: '', price: '', gender_policy: 'Both', quantity: '1', max_occupants: '1' };
const ROOM_TYPES = ['Self-contained Single', 'Self-contained Double', 'Shared Room', 'Chamber and Hall', 'Single Room'];

export default function AdminCreateListing() {
  const router = useRouter();
  const { universities } = useUniversities();
  const [landlords, setLandlords] = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [rooms, setRooms]         = useState<RoomRow[]>([{ ...EMPTY_ROOM }]);

  const addRoom    = () => setRooms(p => [...p, { ...EMPTY_ROOM }]);
  const removeRoom = (i: number) => setRooms(p => p.filter((_, j) => j !== i));
  const setRoom    = (i: number, k: string, v: string) => setRooms(p => p.map((r, j) => j === i ? { ...r, [k]: v } : r));

  const [form, setForm] = useState({
    landlord_id: '',
    hostel_name: '',
    hostel_address: '',
    university: '',
    description: '',
    latitude: '5.6502',
    longitude: '-0.1869',
    track: 'A',
  });

  useEffect(() => {
    api.get('/users').then(r => setLandlords(r.data.filter((u: any) => u.role === 'landlord'))).catch(() => {});
  }, []);

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.landlord_id || !form.hostel_name || !form.university || !form.hostel_address) {
      toast.error('Please fill in all required fields'); return;
    }
    try {
      setLoading(true);
      const hRes = await api.post('/hostels', {
        ...form,
        landlord_id: Number(form.landlord_id),
        latitude:  parseFloat(form.latitude)  || 5.6502,
        longitude: parseFloat(form.longitude) || -0.1869,
      });
      const hostelId = hRes.data.hostel.id;
      const validRooms = rooms.filter(r => r.room_type && r.price);
      if (validRooms.length > 0) {
        await api.post(`/hostels/${hostelId}/rooms/bulk`, {
          rooms: validRooms.map(r => ({ room_type: r.room_type, price: parseFloat(r.price), gender_policy: r.gender_policy, quantity: parseInt(r.quantity), max_occupants: parseInt(r.max_occupants) || 1 })),
        });
      }
      toast.success(`Listing created${validRooms.length > 0 ? ` with ${validRooms.length} room(s)` : ''} — approved!`);
      router.push('/admin/listings');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminGuard>
      <div className="admin-page-wrap" style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <AdminSidebar />
        <main className="admin-page-main" style={{ flex: 1, padding: '32px', overflowY: 'auto', minWidth: 0 }}>

          <div style={{ marginBottom: 24 }}>
            <Link href="/admin/listings" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#64748B', textDecoration: 'none', marginBottom: 16 }}>
              <ArrowLeft size={15} /> Back to listings
            </Link>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Create listing</h1>
            <p style={{ fontSize: 14, color: '#64748B' }}>Admin-created listings are automatically approved and verified.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ maxWidth: 680 }}>
            <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E2E8F0', padding: '28px', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Hostel details</h2>

              <div style={{ display: 'grid', gap: 18 }}>
                <div>
                  <p style={label}>Assign to landlord *</p>
                  <select value={form.landlord_id} onChange={e => setF('landlord_id', e.target.value)} style={input}>
                    <option value="">Select a landlord</option>
                    {landlords.map(l => <option key={l.id} value={l.id}>{l.fullname} · {l.email}</option>)}
                  </select>
                  <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Don't see the landlord? They must register first.</p>
                </div>

                <div>
                  <p style={label}>Hostel name *</p>
                  <input value={form.hostel_name} onChange={e => setF('hostel_name', e.target.value)} placeholder="e.g. Nana Ama Hostel" style={input} />
                </div>

                <div>
                  <p style={label}>University *</p>
                  <select value={form.university} onChange={e => setF('university', e.target.value)} style={input}>
                    <option value="">Select university</option>
                    {universities.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>

                <div>
                  <p style={label}>Full address *</p>
                  <input value={form.hostel_address} onChange={e => setF('hostel_address', e.target.value)} placeholder="e.g. Legon Road, East Legon, Accra" style={input} />
                </div>

                <div>
                  <p style={label}>Description</p>
                  <textarea value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Describe the hostel — amenities, security, proximity to campus..." rows={3} style={{ ...input, resize: 'none' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <p style={label}>Track</p>
                    <select value={form.track} onChange={e => setF('track', e.target.value)} style={input}>
                      <option value="A">Track A — Self-managed</option>
                      <option value="B">Track B — Admin-managed</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E2E8F0', padding: '28px', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Location</h2>
              <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={12} /> Click the map or drag the pin to set the exact location
              </p>
              <LocationPicker
                lat={form.latitude}
                lng={form.longitude}
                onChange={(lat, lng) => { setF('latitude', lat); setF('longitude', lng); }}
              />
            </div>

            {/* Rooms */}
            <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E2E8F0', padding: '28px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>Rooms</h2>
                  <p style={{ fontSize: 13, color: '#94A3B8' }}>Optional — add rooms now or after creating the listing</p>
                </div>
                <button type="button" onClick={addRoom}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: '1.5px solid var(--border)', background: 'white', color: 'var(--text-2)', cursor: 'pointer' }}>
                  <Plus size={14} /> Add room
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {rooms.map((room, i) => (
                  <div key={i} style={{ border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Room {i + 1}</p>
                      {rooms.length > 1 && (
                        <button type="button" onClick={() => removeRoom(i)}
                          style={{ padding: 6, borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <p style={label}>Room type</p>
                        <select value={room.room_type} onChange={e => setRoom(i, 'room_type', e.target.value)} style={input}>
                          <option value="">Select type</option>
                          {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <p style={label}>Price/yr (GHS)</p>
                        <input type="number" value={room.price} onChange={e => setRoom(i, 'price', e.target.value)} placeholder="e.g. 3500" style={input} />
                      </div>
                      <div>
                        <p style={label}>Quantity</p>
                        <input type="number" min="1" value={room.quantity} onChange={e => setRoom(i, 'quantity', e.target.value)} style={input} />
                      </div>
                      <div>
                        <p style={label}>Max occupants</p>
                        <input type="number" min="1" value={room.max_occupants} onChange={e => setRoom(i, 'max_occupants', e.target.value)} style={input} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <p style={label}>Gender policy</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {['Male', 'Female', 'Both'].map(g => (
                            <button key={g} type="button" onClick={() => setRoom(i, 'gender_policy', g)}
                              style={{ flex: 1, padding: '8px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `2px solid ${room.gender_policy === g ? 'var(--blue)' : 'var(--border)'}`, background: room.gender_policy === g ? 'var(--blue-light)' : 'white', color: room.gender_policy === g ? 'var(--blue)' : 'var(--text-2)' }}>
                              {g === 'Both' ? 'Mixed' : `${g} only`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" disabled={loading}
                style={{ flex: 1, padding: '14px', background: 'var(--blue)', color: 'white', borderRadius: 14, fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Creating...' : 'Create & approve listing'}
              </button>
              <Link href="/admin/listings"
                style={{ padding: '14px 24px', border: '1.5px solid var(--border)', borderRadius: 14, fontSize: 15, fontWeight: 600, color: 'var(--text-2)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                Cancel
              </Link>
            </div>
          </form>
        </main>
      </div>
    </AdminGuard>
  );
}
