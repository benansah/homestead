'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import api from '../../lib/api';
import {
  MapPin, Star, ShieldCheck, Check, X,
  Loader2, Plus, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Hostel } from '../../types';

export default function ComparePage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [hostels, setHostels]   = useState<Hostel[]>([]);
  const [all, setAll]           = useState<Hostel[]>([]);
  const [loading, setLoading]   = useState(true);
  const [adding, setAdding]     = useState(false);

  // ids from URL e.g. /compare?ids=1,2,3
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [compareRes, allRes] = await Promise.all([
          ids.length > 0
            ? api.get(`/search/compare?ids=${ids.join(',')}`)
            : Promise.resolve({ data: { hostels: [] } }),
          api.get('/search'),
        ]);
        setHostels(compareRes.data.hostels || []);
        setAll(allRes.data.hostels || []);
      } catch {
        toast.error('Failed to load comparison');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchParams]);

  const addHostel = (id: number) => {
    if (hostels.length >= 3) {
      toast.error('You can compare up to 3 hostels at a time');
      return;
    }
    if (ids.includes(String(id))) {
      toast.error('Already in comparison');
      return;
    }
    const newIds = [...ids, String(id)];
    router.push(`/compare?ids=${newIds.join(',')}`);
    setAdding(false);
  };

  const removeHostel = (id: number) => {
    const newIds = ids.filter(i => i !== String(id));
    router.push(newIds.length > 0 ? `/compare?ids=${newIds.join(',')}` : '/compare');
  };

  // rows to compare
  const ROWS = [
    {
      label: 'Starting price',
      render: (h: Hostel) => (
        <span className="font-bold text-lg" style={{ color: 'var(--blue)' }}>
          GHS {Number(h.min_price || 0).toLocaleString()}
          <span className="text-xs font-normal text-gray-400">/yr</span>
        </span>
      ),
    },
    {
      label: 'University',
      render: (h: Hostel) => (
        <span className="text-sm font-medium text-gray-800">{h.university}</span>
      ),
    },
    {
      label: 'Rating',
      render: (h: Hostel) => h.avg_rating ? (
        <div className="flex items-center gap-1">
          <Star size={14} fill="#F59E0B" color="#F59E0B" />
          <span className="font-semibold text-sm">{Number(h.avg_rating).toFixed(1)}</span>
          <span className="text-xs text-gray-400">({h.total_reviews || 0})</span>
        </div>
      ) : <span className="text-xs text-gray-400">No reviews yet</span>,
    },
    {
      label: 'Available rooms',
      render: (h: Hostel) => (
        <span className={`text-sm font-semibold ${
          Number(h.available_rooms) > 0 ? 'text-green-600' : 'text-red-500'
        }`}>
          {h.available_rooms || 0} rooms
        </span>
      ),
    },
    {
      label: 'Verified',
      render: (h: Hostel) => h.is_verified
        ? <span className="flex items-center gap-1 text-xs font-semibold text-green-700">
            <Check size={14} /> Verified
          </span>
        : <span className="flex items-center gap-1 text-xs text-gray-400">
            <X size={14} /> Not verified
          </span>,
    },
    {
      label: 'Distance from campus',
      render: (h: Hostel) => h.distance_km
        ? <span className="text-sm text-gray-700">{h.distance_km} km</span>
        : <span className="text-xs text-gray-400">—</span>,
    },
    {
      label: 'Room types',
      render: (h: Hostel) => (
        <div className="flex flex-wrap gap-1">
          {((h as any).room_types || []).map((t: string) => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
              {t}
            </span>
          ))}
        </div>
      ),
    },
    {
      label: 'Gender policy',
      render: (h: Hostel) => (
        <div className="flex flex-wrap gap-1">
          {((h as any).gender_policies || []).map((g: string) => (
            <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {g === 'Both' ? 'Mixed' : `${g} only`}
            </span>
          ))}
        </div>
      ),
    },
    {
      label: 'Address',
      render: (h: Hostel) => (
        <div className="flex items-start gap-1 text-xs text-gray-600">
          <MapPin size={11} className="mt-0.5 shrink-0" />
          {h.hostel_address}
        </div>
      ),
    },
  ];

  const available = all.filter(h => !ids.includes(String(h.id)));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compare hostels</h1>
            <p className="text-sm text-gray-500 mt-1">
              Compare up to 3 hostels side by side
            </p>
          </div>
          <Link href="/"
            className="text-sm font-medium px-4 py-2 rounded-lg border
                       hover:bg-gray-50 transition-colors text-gray-700"
            style={{ borderColor: 'var(--border)' }}>
            Back to browse
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--border)' }}>

            {/* Column headers */}
            <div className="grid gap-0"
              style={{ gridTemplateColumns: `200px repeat(${Math.max(hostels.length, 1) + (hostels.length < 3 ? 1 : 0)}, 1fr)` }}>

              {/* Empty top-left cell */}
              <div className="p-4 border-b border-r"
                style={{ borderColor: 'var(--border)', background: '#F8F9FA' }} />

              {/* Hostel columns */}
              {hostels.map(hostel => (
                <div key={hostel.id} className="p-4 border-b border-r relative"
                  style={{ borderColor: 'var(--border)' }}>

                  {/* Remove button */}
                  <button onClick={() => removeHostel(hostel.id)}
                    className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gray-100
                               flex items-center justify-center hover:bg-red-100
                               hover:text-red-500 transition-colors text-gray-400">
                    <X size={12} />
                  </button>

                  {/* Hostel photo */}
                  <div className="h-32 rounded-xl overflow-hidden bg-gray-100 mb-3">
                    {hostel.images?.[0] ? (
                      <img src={hostel.images[0]} alt={hostel.hostel_name}
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">
                        🏠
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-1 mb-1">
                    {hostel.is_verified && (
                      <ShieldCheck size={13} style={{ color: 'var(--blue)', marginTop: 2 }} />
                    )}
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">
                      {hostel.hostel_name}
                    </h3>
                  </div>

                  <Link href={`/hostels/${hostel.id}`}
                    className="text-xs font-semibold mt-2 inline-block"
                    style={{ color: 'var(--blue)' }}>
                    View details →
                  </Link>
                </div>
              ))}

              {/* Add hostel column */}
              {hostels.length < 3 && (
                <div className="p-4 border-b flex flex-col items-center justify-center
                                min-h-[220px]"
                  style={{ borderColor: 'var(--border)', background: '#FAFAFA' }}>
                  {adding ? (
                    <div className="w-full">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        Select a hostel
                      </p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {available.slice(0, 10).map(h => (
                          <button key={h.id}
                            onClick={() => addHostel(h.id)}
                            className="w-full text-left text-xs px-3 py-2 rounded-lg
                                       hover:bg-blue-50 transition-colors flex items-center
                                       justify-between gap-2">
                            <span className="truncate font-medium text-gray-800">
                              {h.hostel_name}
                            </span>
                            <span className="text-gray-400 shrink-0">
                              {h.university?.split(' ')[0]}
                            </span>
                          </button>
                        ))}
                        {available.length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-2">
                            No more hostels to add
                          </p>
                        )}
                      </div>
                      <button onClick={() => setAdding(false)}
                        className="mt-2 text-xs text-gray-400 hover:text-gray-600">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setAdding(true)}
                      className="flex flex-col items-center gap-2 text-gray-400
                                 hover:text-blue-500 transition-colors group">
                      <div className="w-10 h-10 rounded-full border-2 border-dashed
                                      flex items-center justify-center group-hover:border-blue-400
                                      transition-colors"
                        style={{ borderColor: 'var(--border)' }}>
                        <Plus size={18} />
                      </div>
                      <span className="text-xs font-medium">Add hostel</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Empty state */}
            {hostels.length === 0 && (
              <div className="text-center py-16 px-4">
                <p className="text-4xl mb-4">🏠</p>
                <p className="font-semibold text-gray-700 mb-2">No hostels selected</p>
                <p className="text-sm text-gray-400 mb-6">
                  Click "Add hostel" above to start comparing
                </p>
              </div>
            )}

            {/* Comparison rows */}
            {hostels.length > 0 && ROWS.map((row, ri) => (
              <div key={row.label}
                className="grid"
                style={{
                  gridTemplateColumns: `200px repeat(${Math.max(hostels.length, 1) + (hostels.length < 3 ? 1 : 0)}, 1fr)`,
                  background: ri % 2 === 0 ? '#fff' : '#FAFAFA',
                }}>

                {/* Row label */}
                <div className="px-4 py-3 flex items-center border-r text-xs font-semibold
                                text-gray-500 uppercase tracking-wide"
                  style={{ borderColor: 'var(--border)' }}>
                  {row.label}
                </div>

                {/* Row values */}
                {hostels.map(hostel => (
                  <div key={hostel.id}
                    className="px-4 py-3 flex items-center border-r"
                    style={{ borderColor: 'var(--border)' }}>
                    {row.render(hostel)}
                  </div>
                ))}

                {/* Empty add column filler */}
                {hostels.length < 3 && (
                  <div className="px-4 py-3"
                    style={{ background: '#FAFAFA' }} />
                )}
              </div>
            ))}

            {/* Book row */}
            {hostels.length > 0 && (
              <div className="grid border-t"
                style={{
                  gridTemplateColumns: `200px repeat(${Math.max(hostels.length, 1) + (hostels.length < 3 ? 1 : 0)}, 1fr)`,
                  borderColor: 'var(--border)',
                }}>
                <div className="px-4 py-4 border-r text-xs font-semibold text-gray-500
                                uppercase tracking-wide flex items-center"
                  style={{ borderColor: 'var(--border)' }}>
                  Action
                </div>
                {hostels.map(hostel => (
                  <div key={hostel.id} className="px-4 py-4 border-r"
                    style={{ borderColor: 'var(--border)' }}>
                    <Link href={`/hostels/${hostel.id}`}
                      className="block w-full text-center py-2 rounded-xl text-sm
                                 font-semibold text-white hover:opacity-90 transition-opacity"
                      style={{ background: 'var(--blue)' }}>
                      Book viewing
                    </Link>
                  </div>
                ))}
                {hostels.length < 3 && <div style={{ background: '#FAFAFA' }} />}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}