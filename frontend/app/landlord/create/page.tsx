'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import LandlordGuard from '../../../components/LandlordGuard';
import Navbar from '../../../components/Navbar';
import api from '../../../lib/api';
import { Plus, Trash2, Loader2, MapPin, ArrowLeft, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LocationPicker = dynamic(() => import('../../../components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-72 rounded-xl bg-gray-100 animate-pulse" />,
});

const UNIVERSITIES = [
  'University of Ghana',
  'KNUST',
  'UCC',
  'University of Education',
  'Ashesi University',
];

interface RoomForm {
  room_type: string;
  price: string;
  gender_policy: string;
  quantity: string;
}

const EMPTY_ROOM: RoomForm = {
  room_type: '',
  price: '',
  gender_policy: 'Both',
  quantity: '1',
};

export default function CreateHostel() {
  const router = useRouter();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);

  const [hostel, setHostel] = useState({
    hostel_name:    '',
    hostel_address: '',
    university:     '',
    description:    '',
    latitude:       '',
    longitude:      '',
    track:          'A',
  });

  const [rooms, setRooms]         = useState<RoomForm[]>([{ ...EMPTY_ROOM }]);
  const [roomImages, setRoomImages] = useState<Record<number, File[]>>({});

  const setH = (key: string, val: string) =>
    setHostel(prev => ({ ...prev, [key]: val }));

  const addRoom = () => setRooms(prev => [...prev, { ...EMPTY_ROOM }]);

  const removeRoom = (i: number) => {
    setRooms(prev => prev.filter((_, idx) => idx !== i));
    setRoomImages(prev => {
      const next = { ...prev };
      delete next[i];
      return next;
    });
  };

  const setRoom = (i: number, key: string, val: string) =>
    setRooms(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));

  const addImages = (i: number, files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 6);
    setRoomImages(prev => ({
      ...prev,
      [i]: [...(prev[i] || []), ...newFiles].slice(0, 6),
    }));
  };

  const removeImage = (roomIdx: number, fileIdx: number) => {
    setRoomImages(prev => ({
      ...prev,
      [roomIdx]: prev[roomIdx].filter((_, i) => i !== fileIdx),
    }));
  };

  const uploadImages = async (roomId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    await api.post(`/upload/rooms/${roomId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  const handleSubmit = async () => {
    if (!hostel.hostel_name || !hostel.university || !hostel.hostel_address) {
      toast.error('Please fill in all hostel details');
      return;
    }
    if (rooms.some(r => !r.room_type || !r.price)) {
      toast.error('Please fill in all room details');
      return;
    }
    try {
      setLoading(true);

      // 1. Create hostel
      const hRes = await api.post('/hostels', {
        ...hostel,
        latitude:  parseFloat(hostel.latitude)  || 5.6502,
        longitude: parseFloat(hostel.longitude) || -0.1869,
      });
      const hostelId = hRes.data.hostel.id;

      // 2. Bulk create rooms
      const rRes = await api.post(`/hostels/${hostelId}/rooms/bulk`, {
        rooms: rooms.map(r => ({
          ...r,
          price:    parseFloat(r.price),
          quantity: parseInt(r.quantity),
        })),
      });

      // 3. Upload images per room
      const createdRooms = rRes.data.rooms;
      for (let i = 0; i < createdRooms.length; i++) {
        const files = roomImages[i];
        if (files && files.length > 0) {
          try {
            await uploadImages(createdRooms[i].id, files);
          } catch {
            toast.error(`Images for room ${i + 1} failed — you can add them later`);
          }
        }
      }

      toast.success('Hostel submitted for approval!');
      router.push('/landlord');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full border rounded-xl px-4 py-3 text-sm outline-none
    focus:border-blue-500 transition-colors bg-white`;
  const inputStyle = { border: '1px solid var(--border)' };

  return (
    <LandlordGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-2xl mx-auto px-4 py-8">

          {/* Back */}
          <Link href="/landlord"
            className="flex items-center gap-1.5 text-sm text-gray-500
                       hover:text-gray-800 mb-6 transition-colors">
            <ArrowLeft size={15} /> Back to dashboard
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Add your hostel</h1>
          <p className="text-sm text-gray-500 mb-6">
            Fill in the details below. Your listing will go live after admin approval.
          </p>

          {/* Progress steps */}
          <div className="flex items-center gap-2 mb-8">
            {[
              { n: 1, label: 'Hostel details' },
              { n: 2, label: 'Add rooms' },
              { n: 3, label: 'Review & submit' },
            ].map(({ n, label }) => (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center
                                  text-xs font-bold transition-all"
                    style={{
                      background: step >= n ? 'var(--blue)' : '#E5E7EB',
                      color: step >= n ? '#fff' : '#9CA3AF',
                    }}>
                    {n}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${
                    step >= n ? 'text-gray-800' : 'text-gray-400'
                  }`}>
                    {label}
                  </span>
                </div>
                {n < 3 && (
                  <div className="flex-1 h-px mx-2"
                    style={{ background: step > n ? 'var(--blue)' : '#E5E7EB' }} />
                )}
              </div>
            ))}
          </div>

          {/* ── STEP 1: Hostel details ── */}
          {step === 1 && (
            <div className="bg-white rounded-2xl p-6"
              style={{ border: '1px solid var(--border)' }}>
              <h2 className="text-lg font-bold text-gray-900 mb-5">Hostel details</h2>
              <div className="space-y-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hostel name *
                  </label>
                  <input value={hostel.hostel_name}
                    onChange={e => setH('hostel_name', e.target.value)}
                    placeholder="e.g. Nana Ama Hostel"
                    className={inputClass} style={inputStyle} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    University *
                  </label>
                  <select value={hostel.university}
                    onChange={e => setH('university', e.target.value)}
                    className={inputClass} style={inputStyle}>
                    <option value="">Select university</option>
                    {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full address *
                  </label>
                  <input value={hostel.hostel_address}
                    onChange={e => setH('hostel_address', e.target.value)}
                    placeholder="e.g. Legon Road, East Legon, Accra"
                    className={inputClass} style={inputStyle} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea value={hostel.description}
                    onChange={e => setH('description', e.target.value)}
                    placeholder="Describe your hostel — location benefits, amenities, security..."
                    rows={3}
                    className={`${inputClass} resize-none`} style={inputStyle} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hostel location on map
                    <span className="text-xs text-gray-400 ml-2 font-normal">
                      (click the map or drag the pin to your exact location)
                    </span>
                  </label>
                  <LocationPicker
                    lat={hostel.latitude}
                    lng={hostel.longitude}
                    onChange={(lat, lng) => {
                      setH('latitude', lat);
                      setH('longitude', lng);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Listing type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: 'A', label: 'Self-managed', desc: 'I manage my own listing' },
                      { val: 'B', label: 'Admin-managed', desc: 'Admin manages on my behalf' },
                    ].map(({ val, label, desc }) => (
                      <button key={val} type="button"
                        onClick={() => setH('track', val)}
                        className="p-3 rounded-xl border-2 text-left transition-all"
                        style={{
                          borderColor: hostel.track === val ? 'var(--blue)' : 'var(--border)',
                          background:  hostel.track === val ? 'var(--blue-light)' : 'transparent',
                        }}>
                        <p className="text-sm font-semibold"
                          style={{ color: hostel.track === val ? 'var(--blue)' : '#374151' }}>
                          Track {val} · {label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={() => {
                if (!hostel.hostel_name || !hostel.university || !hostel.hostel_address) {
                  toast.error('Please fill in required fields');
                  return;
                }
                setStep(2);
              }}
                className="w-full mt-6 py-3 text-white font-semibold rounded-xl
                           hover:opacity-90 transition-opacity"
                style={{ background: 'var(--blue)' }}>
                Next — add rooms
              </button>
            </div>
          )}

          {/* ── STEP 2: Rooms ── */}
          {step === 2 && (
            <div className="space-y-4">
              {rooms.map((room, i) => (
                <div key={i} className="bg-white rounded-2xl p-5"
                  style={{ border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Room {i + 1}</h3>
                    {rooms.length > 1 && (
                      <button onClick={() => removeRoom(i)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400
                                   hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Room type *
                      </label>
                      <select value={room.room_type}
                        onChange={e => setRoom(i, 'room_type', e.target.value)}
                        className={inputClass} style={inputStyle}>
                        <option value="">Select type</option>
                        <option value="Self-contained Single">Self-contained Single</option>
                        <option value="Self-contained Double">Self-contained Double</option>
                        <option value="Shared Room">Shared Room</option>
                        <option value="Chamber and Hall">Chamber and Hall</option>
                        <option value="Single Room">Single Room</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price per year (GHS) *
                      </label>
                      <input type="number" value={room.price}
                        onChange={e => setRoom(i, 'price', e.target.value)}
                        placeholder="e.g. 2500"
                        className={inputClass} style={inputStyle} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of rooms
                      </label>
                      <input type="number" min="1" value={room.quantity}
                        onChange={e => setRoom(i, 'quantity', e.target.value)}
                        className={inputClass} style={inputStyle} />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender policy
                      </label>
                      <div className="flex gap-2">
                        {['Male', 'Female', 'Both'].map(g => (
                          <button key={g} type="button"
                            onClick={() => setRoom(i, 'gender_policy', g)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-medium
                                       border-2 transition-all"
                            style={{
                              borderColor: room.gender_policy === g ? 'var(--blue)' : 'var(--border)',
                              background:  room.gender_policy === g ? 'var(--blue-light)' : 'transparent',
                              color:       room.gender_policy === g ? 'var(--blue)' : '#374151',
                            }}>
                            {g === 'Both' ? 'Mixed' : `${g} only`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── Image upload ── */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Room photos
                        <span className="text-xs text-gray-400 ml-1 font-normal">
                          (up to 6 photos)
                        </span>
                      </label>

                      {/* Upload zone */}
                      <label className="flex flex-col items-center gap-2 p-4 rounded-xl
                                        cursor-pointer hover:bg-gray-50 transition-colors border-2
                                        border-dashed"
                        style={{ borderColor: 'var(--border)' }}>
                        <Upload size={20} className="text-gray-400" />
                        <span className="text-xs text-gray-500 text-center">
                          Click to upload photos
                          <br />
                          <span className="text-gray-400">JPG, PNG, WEBP up to 5MB each</span>
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={e => addImages(i, e.target.files)}
                        />
                      </label>

                      {/* Image previews */}
                      {roomImages[i]?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {roomImages[i].map((file, fi) => (
                            <div key={fi} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Room ${i + 1} photo ${fi + 1}`}
                                className="w-20 h-20 object-cover rounded-xl"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(i, fi)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500
                                           rounded-full flex items-center justify-center
                                           opacity-0 group-hover:opacity-100 transition-opacity
                                           shadow-md">
                                <X size={11} className="text-white" />
                              </button>
                            </div>
                          ))}
                          {roomImages[i].length < 6 && (
                            <label className="w-20 h-20 rounded-xl border-2 border-dashed
                                              flex items-center justify-center cursor-pointer
                                              hover:bg-gray-50 transition-colors"
                              style={{ borderColor: 'var(--border)' }}>
                              <Plus size={18} className="text-gray-400" />
                              <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={e => addImages(i, e.target.files)}
                              />
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={addRoom}
                className="w-full py-3 rounded-xl border-2 border-dashed text-sm
                           font-semibold transition-colors hover:bg-gray-50 flex items-center
                           justify-center gap-2 text-gray-500"
                style={{ borderColor: 'var(--border)' }}>
                <Plus size={16} /> Add another room type
              </button>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border font-semibold text-sm
                             text-gray-700 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: 'var(--border)' }}>
                  Back
                </button>
                <button onClick={() => {
                  if (rooms.some(r => !r.room_type || !r.price)) {
                    toast.error('Fill in all room details');
                    return;
                  }
                  setStep(3);
                }}
                  className="flex-1 py-3 rounded-xl text-white font-semibold text-sm
                             hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--blue)' }}>
                  Next — review
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Review ── */}
          {step === 3 && (
            <div className="space-y-4">

              {/* Hostel summary */}
              <div className="bg-white rounded-2xl p-5"
                style={{ border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-900">Hostel details</h2>
                  <button onClick={() => setStep(1)}
                    className="text-xs font-semibold" style={{ color: 'var(--blue)' }}>
                    Edit
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Name',       value: hostel.hostel_name },
                    { label: 'University', value: hostel.university },
                    { label: 'Address',    value: hostel.hostel_address },
                    { label: 'Track',      value: `Track ${hostel.track}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-semibold text-gray-900 text-right max-w-xs">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rooms summary */}
              <div className="bg-white rounded-2xl p-5"
                style={{ border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-900">Rooms ({rooms.length})</h2>
                  <button onClick={() => setStep(2)}
                    className="text-xs font-semibold" style={{ color: 'var(--blue)' }}>
                    Edit
                  </button>
                </div>
                <div className="space-y-2">
                  {rooms.map((room, i) => (
                    <div key={i} className="flex items-center justify-between py-2"
                      style={{
                        borderBottom: i < rooms.length - 1
                          ? '1px solid var(--border)' : 'none'
                      }}>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{room.room_type}</p>
                        <p className="text-xs text-gray-500">
                          {room.gender_policy === 'Both' ? 'Mixed' : `${room.gender_policy} only`}
                          · {room.quantity} unit{Number(room.quantity) > 1 ? 's' : ''}
                          · {roomImages[i]?.length || 0} photo{roomImages[i]?.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <p className="font-bold text-sm" style={{ color: 'var(--blue)' }}>
                        GHS {Number(room.price).toLocaleString()}/yr
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* What happens next */}
              <div className="rounded-xl p-4"
                style={{ background: '#F0F7FF', border: '1px solid #BFDBFE' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--blue)' }}>
                  What happens after you submit?
                </p>
                <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Your listing goes to admin for review</li>
                  <li>Admin verifies your hostel details</li>
                  <li>Once approved, students can find and book viewings</li>
                  <li>Admin contacts you on WhatsApp when a student books</li>
                </ol>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl border font-semibold text-sm
                             text-gray-700 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: 'var(--border)' }}>
                  Back
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 py-3 rounded-xl text-white font-semibold text-sm
                             hover:opacity-90 transition-opacity disabled:opacity-60
                             flex items-center justify-center gap-2"
                  style={{ background: 'var(--blue)' }}>
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Submitting...' : 'Submit for approval'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </LandlordGuard>
  );
}