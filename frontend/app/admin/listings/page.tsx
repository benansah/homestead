'use client';
import { useState, useEffect } from 'react';
import AdminGuard from '../../../components/AdminGuard';
import AdminSidebar from '../../../components/AdminSidebar';
import api from '../../../lib/api';
import {
  CheckCircle2, XCircle, ShieldCheck, ShieldOff,
  Trash2, Plus, Loader2, MapPin, Search, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminListings() {
  const [hostels, setHostels]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [actionId, setActionId]     = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hostels');
      setHostels(res.data);
    } catch {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string, reason = '') => {
    try {
      setActionId(id);
      await api.patch(`/hostels/${id}/status`, { status, reason });
      setHostels(prev => prev.map(h => h.id === id ? { ...h, status } : h));
      toast.success(`Hostel ${status}`);
    } catch {
      toast.error('Action failed');
    } finally {
      setActionId(null);
      setRejectTarget(null);
      setRejectReason('');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    await updateStatus(rejectTarget.id, 'rejected', rejectReason);
  };

  const toggleVerified = async (id: number) => {
    try {
      setActionId(id);
      const res = await api.patch(`/hostels/${id}/verify`);
      setHostels(prev => prev.map(h =>
        h.id === id ? { ...h, is_verified: res.data.hostel.is_verified } : h
      ));
      toast.success('Verified status updated');
    } catch {
      toast.error('Action failed');
    } finally {
      setActionId(null);
    }
  };

  const deleteHostel = async (id: number) => {
    if (!confirm('Delete this hostel? This cannot be undone.')) return;
    try {
      await api.delete(`/hostels/${id}`);
      setHostels(prev => prev.filter(h => h.id !== id));
      toast.success('Hostel deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const filtered = hostels.filter(h => {
    const matchSearch = h.hostel_name?.toLowerCase().includes(search.toLowerCase()) ||
                        h.university?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || h.status === filter;
    return matchSearch && matchFilter;
  });

  const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
    approved: { color: '#065F46', bg: '#ECFDF5' },
    pending:  { color: '#B45309', bg: '#FFF9EB' },
    rejected: { color: '#9F1239', bg: '#FFF1F2' },
    hidden:   { color: '#374151', bg: '#F9FAFB' },
  };

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />

        <main className="flex-1 p-6 overflow-y-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage all hostel listings on the platform
              </p>
            </div>
            <button
              onClick={() => toast('Create listing — coming in landlord flow')}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold
                         text-white rounded-xl hover:opacity-90 transition-opacity"
              style={{ background: 'var(--blue)' }}>
              <Plus size={16} /> Add listing
            </button>
          </div>

          {/* Filters bar */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 max-w-xs relative">
              <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search hostel or university..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none
                           focus:border-blue-500 transition-colors"
                style={{ border: '1px solid var(--border)' }}
              />
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {['all', 'pending', 'approved', 'rejected', 'hidden'].map(f => (
                <button key={f}
                  onClick={() => setFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                  style={{
                    background: filter === f ? '#fff' : 'transparent',
                    color: filter === f ? 'var(--text)' : '#6B7280',
                    boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}>
                  {f}
                  {f === 'pending' && (
                    <span className="ml-1 text-xs">
                      ({hostels.filter(h => h.status === 'pending').length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={28} className="animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden"
              style={{ border: '1px solid var(--border)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#F8F9FA', borderBottom: '1px solid var(--border)' }}>
                    {['Hostel', 'University', 'Track', 'Status', 'Verified', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold
                                             text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {filtered.map(hostel => {
                    const ss = STATUS_STYLES[hostel.status] || STATUS_STYLES.hidden;
                    const isLoading = actionId === hostel.id;
                    return (
                      <tr key={hostel.id}
                        className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-900">
                            {hostel.hostel_name}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <MapPin size={10} /> {hostel.hostel_address}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {hostel.university}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={{
                              background: hostel.track === 'A' ? 'var(--blue-light)' : '#F5F3FF',
                              color: hostel.track === 'A' ? 'var(--blue)' : '#6B21A8',
                            }}>
                            Track {hostel.track}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-1 rounded-full capitalize"
                            style={{ background: ss.bg, color: ss.color }}>
                            {hostel.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {hostel.is_verified
                            ? <span className="text-xs font-semibold text-green-700
                                               flex items-center gap-1">
                                <ShieldCheck size={13} /> Yes
                              </span>
                            : <span className="text-xs text-gray-400">No</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {isLoading ? (
                              <Loader2 size={14} className="animate-spin text-blue-500" />
                            ) : (
                              <>
                                {hostel.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => updateStatus(hostel.id, 'approved')}
                                      className="p-1.5 rounded-lg hover:bg-green-50
                                                 text-gray-400 hover:text-green-600 transition-colors"
                                      title="Approve">
                                      <CheckCircle2 size={16} />
                                    </button>
                                    <button
                                      onClick={() => { setRejectTarget(hostel); setRejectReason(''); }}
                                      className="p-1.5 rounded-lg hover:bg-red-50
                                                 text-gray-400 hover:text-red-500 transition-colors"
                                      title="Reject">
                                      <XCircle size={16} />
                                    </button>
                                  </>
                                )}
                                {hostel.status === 'approved' && (
                                  <button
                                    onClick={() => updateStatus(hostel.id, 'hidden')}
                                    className="p-1.5 rounded-lg hover:bg-amber-50
                                               text-gray-400 hover:text-amber-600 transition-colors"
                                    title="Hide listing">
                                    <XCircle size={16} />
                                  </button>
                                )}
                                {hostel.status === 'hidden' && (
                                  <button
                                    onClick={() => updateStatus(hostel.id, 'approved')}
                                    className="p-1.5 rounded-lg hover:bg-green-50
                                               text-gray-400 hover:text-green-600 transition-colors"
                                    title="Restore listing">
                                    <CheckCircle2 size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={() => toggleVerified(hostel.id)}
                                  className="p-1.5 rounded-lg hover:bg-blue-50
                                             text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Toggle verified">
                                  {hostel.is_verified
                                    ? <ShieldOff size={16} />
                                    : <ShieldCheck size={16} />}
                                </button>
                                <button
                                  onClick={() => deleteHostel(hostel.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-50
                                             text-gray-400 hover:text-red-500 transition-colors"
                                  title="Delete">
                                  <Trash2 size={16} />
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

              {filtered.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">No listings found</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      {/* Reject reason modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Reject listing</h2>
              <button onClick={() => setRejectTarget(null)}>
                <X size={18} className="text-gray-400 hover:text-gray-700" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Rejecting <strong>{rejectTarget.hostel_name}</strong>. Give the landlord a reason
              so they know what to fix — this will be emailed to them.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Photos are missing, address is incomplete, description needs more detail..."
              rows={3}
              className="w-full border rounded-xl px-4 py-3 text-sm outline-none
                         focus:border-red-400 transition-colors resize-none mb-4"
              style={{ borderColor: 'var(--border)' }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRejectTarget(null)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold
                           text-gray-700 hover:bg-gray-50 transition-colors"
                style={{ borderColor: 'var(--border)' }}>
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionId === rejectTarget.id}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white
                           bg-red-500 hover:bg-red-600 transition-colors
                           flex items-center justify-center gap-2 disabled:opacity-60">
                {actionId === rejectTarget.id
                  ? <Loader2 size={14} className="animate-spin" />
                  : null}
                Reject & notify landlord
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}