'use client';
import { useState, useEffect } from 'react';
import AdminGuard from '../../../components/AdminGuard';
import AdminSidebar from '../../../components/AdminSidebar';
import api from '../../../lib/api';
import {
  CheckCircle2, XCircle, ShieldCheck, ShieldOff,
  Trash2, Plus, Loader2, Search, X, Flag,
  Building2, Eye, EyeOff, RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  approved: { label: 'Approved', color: '#065F46', bg: '#ECFDF5', dot: '#10B981' },
  pending:  { label: 'Pending',  color: '#92400E', bg: '#FFFBEB', dot: '#F59E0B' },
  rejected: { label: 'Rejected', color: '#9F1239', bg: '#FFF1F2', dot: '#F43F5E' },
  hidden:   { label: 'Hidden',   color: '#374151', bg: '#F3F4F6', dot: '#9CA3AF' },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.hidden;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

function IconAction({ onClick, title, icon, danger }: { onClick: () => void; title: string; icon: React.ReactNode; danger?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${hov ? (danger ? '#FECACA' : 'var(--blue-mid)') : 'var(--border)'}`, background: hov ? (danger ? '#FEF2F2' : 'var(--blue-light)') : 'white', color: hov ? (danger ? '#DC2626' : 'var(--blue)') : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.12s', flexShrink: 0 }}>
      {icon}
    </button>
  );
}

function StatusAction({ hostel, updateStatus, setRejectTarget, setRejectReason }: any) {
  if (hostel.status === 'pending') return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button onClick={() => updateStatus(hostel.id, 'approved')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', cursor: 'pointer', whiteSpace: 'nowrap' }}>
        <CheckCircle2 size={12} /> Approve
      </button>
      <button onClick={() => { setRejectTarget(hostel); setRejectReason(''); }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer', whiteSpace: 'nowrap' }}>
        <XCircle size={12} /> Reject
      </button>
    </div>
  );
  if (hostel.status === 'approved') return (
    <button onClick={() => updateStatus(hostel.id, 'hidden')}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', cursor: 'pointer', whiteSpace: 'nowrap' }}>
      <EyeOff size={12} /> Hide
    </button>
  );
  if (hostel.status === 'hidden' || hostel.status === 'rejected') return (
    <button onClick={() => updateStatus(hostel.id, 'approved')}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', cursor: 'pointer', whiteSpace: 'nowrap' }}>
      <RotateCcw size={12} /> Restore
    </button>
  );
  return null;
}

export default function AdminListings() {
  const [hostels, setHostels]           = useState<any[]>([]);
  const [flagged, setFlagged]           = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filter, setFilter]             = useState('all');
  const [actionId, setActionId]         = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [hostelRes, flagRes] = await Promise.all([
        api.get('/hostels'),
        api.get('/hostels/flagged').catch(() => ({ data: [] })),
      ]);
      setHostels(hostelRes.data);
      setFlagged(flagRes.data);
    } catch { toast.error('Failed to load listings'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id: number, status: string, reason = '') => {
    try {
      setActionId(id);
      await api.patch(`/hostels/${id}/status`, { status, reason });
      setHostels(prev => prev.map(h => h.id === id ? { ...h, status } : h));
      toast.success(`Hostel ${status}`);
    } catch { toast.error('Action failed'); }
    finally { setActionId(null); setRejectTarget(null); setRejectReason(''); }
  };

  const toggleVerified = async (id: number) => {
    try {
      setActionId(id);
      const res = await api.patch(`/hostels/${id}/verify`);
      setHostels(prev => prev.map(h => h.id === id ? { ...h, is_verified: res.data.hostel.is_verified } : h));
      toast.success('Verified status updated');
    } catch { toast.error('Action failed'); }
    finally { setActionId(null); }
  };

  const deleteHostel = async (id: number) => {
    if (!confirm('Delete this hostel? This cannot be undone.')) return;
    try {
      await api.delete(`/hostels/${id}`);
      setHostels(prev => prev.filter(h => h.id !== id));
      toast.success('Hostel deleted');
    } catch { toast.error('Delete failed'); }
  };

  const dismissFlags = async (id: number) => {
    if (!confirm('Dismiss all flags for this hostel?')) return;
    try {
      await api.delete(`/hostels/${id}/flags`);
      setFlagged(prev => prev.filter(h => h.id !== id));
      toast.success('Flags dismissed');
    } catch { toast.error('Failed'); }
  };

  const filtered = hostels.filter(h => {
    const q = search.toLowerCase();
    const matchSearch = !q || h.hostel_name?.toLowerCase().includes(q) || h.university?.toLowerCase().includes(q);
    const matchFilter = filter === 'all' || h.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all:      hostels.length,
    pending:  hostels.filter(h => h.status === 'pending').length,
    approved: hostels.filter(h => h.status === 'approved').length,
    rejected: hostels.filter(h => h.status === 'rejected').length,
    hidden:   hostels.filter(h => h.status === 'hidden').length,
    flagged:  flagged.length,
  };

  const TABS = [
    { key: 'all',      label: 'All' },
    { key: 'pending',  label: 'Pending',  alert: true },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'hidden',   label: 'Hidden' },
    { key: 'flagged',  label: 'Flagged',  alert: true },
  ];

  const thStyle: React.CSSProperties = {
    padding: '11px 14px', textAlign: 'left', fontSize: 11,
    fontWeight: 700, color: '#64748B', textTransform: 'uppercase',
    letterSpacing: '0.07em', whiteSpace: 'nowrap', background: '#F8FAFC',
    borderBottom: '1px solid var(--border)',
  };
  const tdStyle: React.CSSProperties = {
    padding: '12px 14px', fontSize: 13, color: '#374151',
    borderBottom: '1px solid #F1F5F9', verticalAlign: 'middle',
  };

  return (
    <AdminGuard>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <AdminSidebar />

        <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px 80px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Listings</h1>
                <p style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>Manage all hostel listings on the platform</p>
              </div>
              <Link href="/admin/create-listing"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: 'var(--blue)', color: 'white', textDecoration: 'none', boxShadow: '0 2px 10px rgba(0,106,255,0.28)', flexShrink: 0 }}>
                <Plus size={15} /> Add listing
              </Link>
            </div>

            {/* Stats row */}
            {!loading && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
                {([
                  { label: 'Total',    value: counts.all,      color: '#1E40AF', bg: '#EFF6FF' },
                  { label: 'Pending',  value: counts.pending,  color: '#92400E', bg: '#FFFBEB' },
                  { label: 'Approved', value: counts.approved, color: '#065F46', bg: '#ECFDF5' },
                  { label: 'Flagged',  value: counts.flagged,  color: '#9F1239', bg: '#FFF1F2' },
                ] as const).map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
                    <p style={{ fontSize: 26, fontWeight: 900, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: s.color, opacity: 0.65, marginTop: 5 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Search + filter bar */}
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '14px 16px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
                <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search name or university…"
                  style={{ width: '100%', paddingLeft: 34, paddingRight: search ? 32 : 12, paddingTop: 8, paddingBottom: 8, fontSize: 13, borderRadius: 9, border: '1.5px solid var(--border)', outline: 'none', background: '#FAFAFA', transition: 'border-color 0.15s', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--blue)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: 4, overflowX: 'auto', flexShrink: 0 }}>
                {TABS.map(tab => {
                  const count = counts[tab.key as keyof typeof counts];
                  const active = filter === tab.key;
                  return (
                    <button key={tab.key} onClick={() => setFilter(tab.key)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 8, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', border: active ? 'none' : '1.5px solid var(--border)', cursor: 'pointer', transition: 'all 0.13s', flexShrink: 0, background: active ? 'var(--blue)' : 'white', color: active ? 'white' : '#64748B' }}>
                      {tab.label}
                      {count > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', background: active ? 'rgba(255,255,255,0.25)' : (tab.alert ? '#FEE2E2' : '#F1F5F9'), color: active ? 'white' : (tab.alert ? '#DC2626' : '#475569') }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
                <Loader2 size={22} style={{ color: 'var(--blue)', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 13, color: '#94A3B8' }}>Loading listings…</span>
              </div>
            ) : filter === 'flagged' ? (
              /* ── Flagged table ── */
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                {flagged.length === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <Flag size={32} style={{ color: '#FCA5A5', margin: '0 auto 10px' }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>No flagged listings</p>
                    <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>All clear — no reports to review.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Hostel', 'University', 'Status', 'Flags', 'Reasons', 'Actions'].map(h => (
                            <th key={h} style={thStyle}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {flagged.map((h, i) => (
                          <tr key={h.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#FFF7F7')}
                            onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#FAFAFA')}>
                            <td style={tdStyle}>
                              <Link href={`/hostels/${h.id}`} target="_blank"
                                style={{ fontWeight: 700, color: '#0F172A', textDecoration: 'none', fontSize: 13 }}>
                                {h.hostel_name}
                              </Link>
                            </td>
                            <td style={{ ...tdStyle, color: '#64748B' }}>{h.university}</td>
                            <td style={tdStyle}><StatusBadge status={h.status} /></td>
                            <td style={tdStyle}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: '#FEF2F2', color: '#DC2626' }}>
                                <Flag size={11} /> {h.flag_count}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, maxWidth: 240 }}>
                              {(h.reasons || []).slice(0, 2).map((r: string, ri: number) => (
                                <p key={ri} style={{ fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '1px 0' }}>• {r}</p>
                              ))}
                              {h.reasons?.length > 2 && <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>+{h.reasons.length - 2} more</p>}
                            </td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <button onClick={() => dismissFlags(h.id)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: '#F8FAFC', color: '#475569', border: '1px solid var(--border)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                  <X size={11} /> Dismiss
                                </button>
                                <button onClick={() => updateStatus(h.id, 'hidden')}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                  <EyeOff size={11} /> Hide
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '60px 20px', textAlign: 'center' }}>
                <Building2 size={32} style={{ color: '#CBD5E1', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>No listings found</p>
                <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Try adjusting your search or filter.</p>
              </div>
            ) : (
              /* ── Main listings table ── */
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Hostel</th>
                        <th style={thStyle}>University</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Verified</th>
                        <th style={thStyle}>Views</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((h, i) => {
                        const isLoading = actionId === h.id;
                        const rowBg = i % 2 === 0 ? 'white' : '#FAFAFA';
                        return (
                          <tr key={h.id} style={{ background: rowBg, transition: 'background 0.1s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#F0F7FF')}
                            onMouseLeave={e => (e.currentTarget.style.background = rowBg)}>

                            {/* Hostel */}
                            <td style={{ ...tdStyle, minWidth: 180 }}>
                              <Link href={`/hostels/${h.id}`} target="_blank"
                                style={{ fontWeight: 700, color: '#0F172A', textDecoration: 'none', fontSize: 13, display: 'block' }}>
                                {h.hostel_name}
                              </Link>
                              {h.hostel_address && (
                                <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                                  {h.hostel_address}
                                </span>
                              )}
                            </td>

                            {/* University */}
                            <td style={{ ...tdStyle, minWidth: 140 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: 'var(--blue-light)', color: 'var(--blue)', whiteSpace: 'nowrap' }}>
                                {h.university}
                              </span>
                            </td>

                            {/* Status */}
                            <td style={tdStyle}><StatusBadge status={h.status} /></td>

                            {/* Verified */}
                            <td style={tdStyle}>
                              {h.is_verified
                                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#065F46' }}><ShieldCheck size={13} /> Yes</span>
                                : <span style={{ fontSize: 12, color: '#94A3B8' }}>—</span>
                              }
                            </td>

                            {/* Views */}
                            <td style={{ ...tdStyle, color: '#64748B' }}>
                              {h.view_count != null
                                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}><Eye size={12} style={{ color: '#94A3B8' }} />{h.view_count}</span>
                                : <span style={{ color: '#CBD5E1' }}>—</span>}
                            </td>

                            {/* Actions */}
                            <td style={{ ...tdStyle, minWidth: 200 }}>
                              {isLoading ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Loader2 size={14} style={{ color: 'var(--blue)', animation: 'spin 1s linear infinite' }} />
                                  <span style={{ fontSize: 11, color: '#94A3B8' }}>Processing…</span>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <StatusAction hostel={h} updateStatus={updateStatus} setRejectTarget={setRejectTarget} setRejectReason={setRejectReason} />
                                  <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />
                                  <IconAction
                                    onClick={() => toggleVerified(h.id)}
                                    title={h.is_verified ? 'Remove verification' : 'Mark as verified'}
                                    icon={h.is_verified ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                                  />
                                  <IconAction
                                    onClick={() => deleteHostel(h.id)}
                                    title="Delete hostel"
                                    icon={<Trash2 size={13} />}
                                    danger
                                  />
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table footer */}
                <div style={{ padding: '10px 16px', borderTop: '1px solid #F1F5F9', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>
                    {filtered.length} listing{filtered.length !== 1 ? 's' : ''}
                    {search || filter !== 'all' ? ` (filtered from ${hostels.length} total)` : ''}
                  </span>
                  {(search || filter !== 'all') && (
                    <button onClick={() => { setSearch(''); setFilter('all'); }}
                      style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 440, padding: 28, boxShadow: '0 24px 60px rgba(0,0,0,0.22)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <XCircle size={18} style={{ color: '#EF4444' }} />
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Reject listing</h2>
              </div>
              <button onClick={() => setRejectTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 16, lineHeight: 1.7 }}>
              Rejecting <strong style={{ color: '#0F172A' }}>{rejectTarget.hostel_name}</strong>. This reason will be emailed to the landlord.
            </p>
            <textarea
              value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Photos are missing, address is incomplete…"
              rows={3}
              style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 12, padding: '12px 14px', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 18, fontFamily: 'inherit', lineHeight: 1.6, transition: 'border-color 0.15s' }}
              onFocus={e => (e.target.style.borderColor = '#EF4444')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setRejectTarget(null)}
                style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, fontWeight: 600, color: '#374151', background: 'white', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={async () => { if (!rejectTarget) return; await updateStatus(rejectTarget.id, 'rejected', rejectReason); }}
                disabled={actionId === rejectTarget?.id}
                style={{ flex: 1, padding: '11px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 700, color: 'white', background: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: actionId === rejectTarget?.id ? 0.6 : 1 }}>
                {actionId === rejectTarget?.id && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                Reject & notify
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}
