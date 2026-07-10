'use client';
import { useEffect, useState } from 'react';
import AdminGuard from '../../../components/AdminGuard';
import AdminSidebar from '../../../components/AdminSidebar';
import api from '../../../lib/api';
import { Loader2, Plus, Trash2, Pencil, Check, X, MapPin, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ResidenceArea } from '../../../types';

export default function AdminResidenceAreas() {
  const [areas, setAreas] = useState<ResidenceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ university_name: '', name: '' });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ university_name: '', name: '' });

  const fetchAreas = async () => {
    try {
      const res = await api.get('/residence-areas');
      setAreas(res.data);
    } catch {
      toast.error('Failed to load residence areas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAreas(); }, []);

  const filtered = areas.filter(area =>
    area.university_name.toLowerCase().includes(search.toLowerCase()) ||
    area.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.university_name.trim() || !form.name.trim()) {
      toast.error('Please fill in both fields');
      return;
    }
    try {
      setSaving(true);
      const res = await api.post('/residence-areas', form);
      setAreas(prev => [...prev, res.data.residenceArea].sort((a, b) => `${a.university_name}${a.name}`.localeCompare(`${b.university_name}${b.name}`)));
      setForm({ university_name: '', name: '' });
      toast.success('Residence area added');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add residence area');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (area: ResidenceArea) => {
    setEditingId(area.id);
    setEditForm({ university_name: area.university_name, name: area.name });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ university_name: '', name: '' });
  };

  const handleSave = async (id: number) => {
    if (!editForm.university_name.trim() || !editForm.name.trim()) {
      toast.error('Please fill in both fields');
      return;
    }
    try {
      setSaving(true);
      const res = await api.patch(`/residence-areas/${id}`, editForm);
      setAreas(prev => prev.map(area => area.id === id ? res.data.residenceArea : area).sort((a, b) => `${a.university_name}${a.name}`.localeCompare(`${b.university_name}${b.name}`)));
      setEditingId(null);
      toast.success('Residence area updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update residence area');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/residence-areas/${id}`);
      setAreas(prev => prev.filter(area => area.id !== id));
      toast.success('Residence area deleted');
    } catch {
      toast.error('Failed to delete residence area');
    }
  };

  return (
    <AdminGuard>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <AdminSidebar />
        <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto', minWidth: 0 }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Residence areas</h1>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Manage the area list that landlords choose from and students filter by.</p>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 22px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 14 }}>Add area</p>
            <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 220px' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>University *</label>
                <input value={form.university_name} onChange={e => setForm({ ...form, university_name: e.target.value })} placeholder="e.g. University of Ghana" style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 10, outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: '1 1 220px' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Area name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. East Legon" style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 10, outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, whiteSpace: 'nowrap' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Add area
              </button>
            </form>
          </div>

          <div style={{ marginBottom: 14, position: 'relative', maxWidth: 340 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search university or area…" style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9, fontSize: 13, border: '1px solid var(--border)', borderRadius: 10, outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 220 }}>
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--blue)' }} />
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--border)' }}>
                      {['#', 'University', 'Area', 'Actions'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((area, i) => {
                      const isEditing = editingId === area.id;
                      return (
                        <tr key={area.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA', borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '13px 16px', fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{i + 1}</td>
                          <td style={{ padding: '13px 16px' }}>
                            {isEditing ? (
                              <input value={editForm.university_name} onChange={e => setEditForm({ ...editForm, university_name: e.target.value })} style={{ padding: '6px 10px', fontSize: 13, border: '1.5px solid var(--blue)', borderRadius: 8, outline: 'none', width: '100%', minWidth: 180 }} />
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><MapPin size={15} color="var(--blue)" /></div>
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{area.university_name}</span>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            {isEditing ? (
                              <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ padding: '6px 10px', fontSize: 13, border: '1.5px solid var(--blue)', borderRadius: 8, outline: 'none', width: '100%', minWidth: 160 }} />
                            ) : (
                              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{area.name}</span>
                            )}
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              {isEditing ? (
                                <>
                                  <button onClick={() => handleSave(area.id)} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 8, border: 'none', background: '#ECFDF5', color: '#065F46', fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                    Save
                                  </button>
                                  <button onClick={cancelEdit} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', color: '#6B7280', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                    <X size={12} /> Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEdit(area)} title="Edit" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: '#FAFAFA', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Pencil size={13} /></button>
                                  <button onClick={() => handleDelete(area.id, area.name)} title="Delete" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #FEE2E2', background: '#FFF5F5', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={13} /></button>
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
                  <MapPin size={32} style={{ color: '#D1D5DB', marginBottom: 10 }} />
                  <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>{search ? 'No residence areas match your search' : 'No residence areas added yet'}</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
