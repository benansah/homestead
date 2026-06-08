'use client';
import { useState, useEffect } from 'react';
import AdminGuard from '../../../components/AdminGuard';
import AdminSidebar from '../../../components/AdminSidebar';
import api from '../../../lib/api';
import {
  Trash2, Plus, Loader2, GraduationCap, MapPin,
  Pencil, Check, X, Building2, Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { University } from '../../../types';

type UniversityWithCount = University & { hostel_count: number };

export default function AdminUniversities() {
  const [universities, setUniversities] = useState<UniversityWithCount[]>([]);
  const [loading, setLoading]           = useState(true);
  const [adding, setAdding]             = useState(false);
  const [search, setSearch]             = useState('');
  const [form, setForm]                 = useState({ name: '', location: '' });
  const [editingId, setEditingId]       = useState<number | null>(null);
  const [editForm, setEditForm]         = useState({ name: '', location: '' });
  const [saving, setSaving]             = useState(false);

  useEffect(() => {
    api.get('/universities')
      .then(res => setUniversities(res.data))
      .catch(() => toast.error('Failed to load universities'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = universities.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.location?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('University name is required'); return; }
    try {
      setAdding(true);
      const res = await api.post('/universities', form);
      const added = { ...res.data.university, hostel_count: 0 };
      setUniversities(prev => [...prev, added].sort((a, b) => a.name.localeCompare(b.name)));
      setForm({ name: '', location: '' });
      toast.success('University added');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add university');
    } finally {
      setAdding(false);
    }
  }

  function startEdit(u: UniversityWithCount) {
    setEditingId(u.id);
    setEditForm({ name: u.name, location: u.location ?? '' });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ name: '', location: '' });
  }

  async function handleSave(id: number) {
    if (!editForm.name.trim()) { toast.error('Name is required'); return; }
    try {
      setSaving(true);
      const res = await api.patch(`/universities/${id}`, editForm);
      const updated = res.data.university;
      setUniversities(prev =>
        prev.map(u => u.id === id ? { ...u, name: updated.name, location: updated.location } : u)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
      toast.success('University updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}"? This won't affect existing hostel or user records.`)) return;
    try {
      await api.delete(`/universities/${id}`);
      setUniversities(prev => prev.filter(u => u.id !== id));
      toast.success('University deleted');
    } catch {
      toast.error('Failed to delete university');
    }
  }

  const withHostels = universities.filter(u => u.hostel_count > 0).length;
  const noHostels   = universities.length - withHostels;

  const stats = [
    { label: 'Total',           value: universities.length, color: '#006AFF', bg: '#EFF6FF', Icon: GraduationCap },
    { label: 'Have listings',   value: withHostels,         color: '#065F46', bg: '#D1FAE5', Icon: Building2 },
    { label: 'No listings yet', value: noHostels,           color: '#92400E', bg: '#FEF3C7', Icon: MapPin },
  ];

  return (
    <AdminGuard>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <AdminSidebar />

        <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto', minWidth: 0 }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Universities</h1>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
              Manage the reference list shown in dropdowns and filters across the platform
            </p>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
            {stats.map(({ label, value, color, bg, Icon }) => (
              <div key={label} style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{value}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Add form */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 22px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 14 }}>Add university</p>
            <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Name *
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. University of Cape Coast"
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 10, outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Location (optional)
                </label>
                <input
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Cape Coast, Ghana"
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 10, outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' }}
                />
              </div>
              <button
                type="submit"
                disabled={adding}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.7 : 1, whiteSpace: 'nowrap' }}>
                {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Add university
              </button>
            </form>
          </div>

          {/* Search */}
          <div style={{ marginBottom: 14, position: 'relative', maxWidth: 340 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or location…"
              style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9, fontSize: 13, border: '1px solid var(--border)', borderRadius: 10, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--blue)' }} />
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--border)' }}>
                      {['#', 'University', 'Location', 'Hostels', 'Added', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => {
                      const isEditing = editingId === u.id;
                      return (
                        <tr key={u.id}
                          style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA', borderBottom: '1px solid var(--border)', transition: 'background 0.12s' }}
                          onMouseEnter={e => !isEditing && (e.currentTarget.style.background = '#F0F7FF')}
                          onMouseLeave={e => !isEditing && (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFAFA')}>

                          {/* # */}
                          <td style={{ padding: '13px 16px', fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>
                            {i + 1}
                          </td>

                          {/* Name */}
                          <td style={{ padding: '13px 16px' }}>
                            {isEditing ? (
                              <input
                                value={editForm.name}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                autoFocus
                                style={{ padding: '6px 10px', fontSize: 13, border: '1.5px solid var(--blue)', borderRadius: 8, outline: 'none', width: '100%', minWidth: 180 }}
                              />
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <GraduationCap size={15} color="var(--blue)" />
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{u.name}</span>
                              </div>
                            )}
                          </td>

                          {/* Location */}
                          <td style={{ padding: '13px 16px' }}>
                            {isEditing ? (
                              <input
                                value={editForm.location}
                                onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                                placeholder="e.g. Accra, Ghana"
                                style={{ padding: '6px 10px', fontSize: 13, border: '1.5px solid var(--blue)', borderRadius: 8, outline: 'none', width: '100%', minWidth: 160 }}
                              />
                            ) : (
                              u.location
                                ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280' }}>
                                    <MapPin size={11} style={{ color: '#9CA3AF' }} />{u.location}
                                  </span>
                                )
                                : <span style={{ color: '#D1D5DB', fontSize: 12 }}>—</span>
                            )}
                          </td>

                          {/* Hostel count */}
                          <td style={{ padding: '13px 16px' }}>
                            {u.hostel_count > 0
                              ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#ECFDF5', color: '#065F46', borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                                  <Building2 size={11} />{u.hostel_count}
                                </span>
                              )
                              : <span style={{ fontSize: 12, color: '#D1D5DB' }}>0</span>
                            }
                          </td>

                          {/* Added */}
                          <td style={{ padding: '13px 16px', fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                            {u.created_at
                              ? new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—'
                            }
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '13px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSave(u.id)}
                                    disabled={saving}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 8, border: 'none', background: '#ECFDF5', color: '#065F46', fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', color: '#6B7280', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                    <X size={12} /> Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEdit(u)}
                                    title="Edit"
                                    style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: '#FAFAFA', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.12s' }}
                                    onMouseEnter={e => { const b = e.currentTarget; b.style.background = '#EFF6FF'; b.style.color = 'var(--blue)'; b.style.borderColor = 'var(--blue)'; }}
                                    onMouseLeave={e => { const b = e.currentTarget; b.style.background = '#FAFAFA'; b.style.color = '#6B7280'; b.style.borderColor = 'var(--border)'; }}>
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(u.id, u.name)}
                                    title="Delete"
                                    style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #FEE2E2', background: '#FFF5F5', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.12s' }}
                                    onMouseEnter={e => { const b = e.currentTarget; b.style.background = '#EF4444'; b.style.color = '#fff'; b.style.borderColor = '#EF4444'; }}
                                    onMouseLeave={e => { const b = e.currentTarget; b.style.background = '#FFF5F5'; b.style.color = '#EF4444'; b.style.borderColor = '#FEE2E2'; }}>
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filtered.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '52px 0' }}>
                  <GraduationCap size={32} style={{ color: '#D1D5DB', marginBottom: 10 }} />
                  <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>
                    {search ? 'No universities match your search' : 'No universities added yet'}
                  </p>
                </div>
              )}

              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                  {filtered.length} of {universities.length} {universities.length === 1 ? 'university' : 'universities'}
                </span>
              </div>
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
