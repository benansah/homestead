'use client';
import { useState, useEffect } from 'react';
import AdminGuard from '../../../components/AdminGuard';
import AdminSidebar from '../../../components/AdminSidebar';
import api from '../../../lib/api';
import {
  Search, Loader2, GraduationCap, Home, Shield,
  Trash2, Users, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_CFG = {
  student:  { label: 'Student',  color: '#1D4ED8', bg: '#EFF6FF', dot: '#3B82F6', Icon: GraduationCap, grad: 'linear-gradient(135deg,#60A5FA,#2563EB)' },
  landlord: { label: 'Landlord', color: '#065F46', bg: '#ECFDF5', dot: '#10B981', Icon: Home,          grad: 'linear-gradient(135deg,#34D399,#059669)' },
  admin:    { label: 'Admin',    color: '#6B21A8', bg: '#F5F3FF', dot: '#8B5CF6', Icon: Shield,        grad: 'linear-gradient(135deg,#A78BFA,#7C3AED)' },
} as const;

const TABS = [
  { key: 'all',      label: 'All' },
  { key: 'student',  label: 'Students' },
  { key: 'landlord', label: 'Landlords' },
  { key: 'admin',    label: 'Admins' },
];

export default function AdminUsers() {
  const [users, setUsers]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [tab, setTab]         = useState('all');

  useEffect(() => {
    api.get('/users')
      .then(r => setUsers(r.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    all:      users.length,
    student:  users.filter(u => u.role === 'student').length,
    landlord: users.filter(u => u.role === 'landlord').length,
    admin:    users.filter(u => u.role === 'admin').length,
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch =
      u.fullname?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q);
    const matchTab = tab === 'all' || u.role === tab;
    return matchSearch && matchTab;
  });

  async function changeRole(userId: number, newRole: string) {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  }

  async function handleDelete(user: any) {
    if (!confirm(`Delete ${user.fullname}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
    }
  }

  const stats = [
    { label: 'Total users', value: counts.all,      color: '#006AFF', bg: '#EFF6FF', Icon: Users },
    { label: 'Students',    value: counts.student,   color: '#1D4ED8', bg: '#DBEAFE', Icon: GraduationCap },
    { label: 'Landlords',   value: counts.landlord,  color: '#065F46', bg: '#D1FAE5', Icon: Home },
    { label: 'Admins',      value: counts.admin,     color: '#6B21A8', bg: '#EDE9FE', Icon: Shield },
  ];

  const clearAll = () => { setSearch(''); setTab('all'); };
  const hasFilter = search || tab !== 'all';

  return (
    <AdminGuard>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <AdminSidebar />

        <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto', minWidth: 0 }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Users</h1>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
              Manage student, landlord, and admin accounts
            </p>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
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

          {/* Search + tabs */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: 300 }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Name, email or phone…"
                style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 13, border: '1px solid var(--border)', borderRadius: 10, outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TABS.map(t => {
                const active = tab === t.key;
                const count = counts[t.key as keyof typeof counts];
                return (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s', background: active ? 'var(--blue)' : '#F3F4F6', color: active ? '#fff' : '#374151', boxShadow: active ? '0 2px 8px rgba(0,106,255,0.25)' : 'none' }}>
                    {t.label}
                    <span style={{ background: active ? 'rgba(255,255,255,0.22)' : '#E5E7EB', color: active ? '#fff' : '#6B7280', borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {hasFilter && (
              <button onClick={clearAll}
                style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>
                <X size={13} /> Clear
              </button>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--blue)' }} />
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--border)' }}>
                      {['#', 'User', 'Contact', 'University', 'Role', 'Joined', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((user, i) => {
                      const cfg = ROLE_CFG[user.role as keyof typeof ROLE_CFG] ?? ROLE_CFG.student;
                      const RoleIcon = cfg.Icon;
                      return (
                        <tr key={user.id}
                          style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA', borderBottom: '1px solid var(--border)', transition: 'background 0.12s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#F0F7FF')}
                          onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFAFA')}>

                          {/* # */}
                          <td style={{ padding: '13px 16px', fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>
                            {i + 1}
                          </td>

                          {/* User */}
                          <td style={{ padding: '13px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: '50%', background: cfg.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                                {user.fullname?.[0]?.toUpperCase() ?? '?'}
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
                                {user.fullname}
                              </span>
                            </div>
                          </td>

                          {/* Contact */}
                          <td style={{ padding: '13px 16px' }}>
                            <div style={{ fontSize: 13, color: '#374151' }}>{user.email}</div>
                            {user.phone && (
                              <a href={`tel:${user.phone}`} style={{ fontSize: 12, color: '#6B7280', textDecoration: 'none' }}>
                                {user.phone}
                              </a>
                            )}
                          </td>

                          {/* University */}
                          <td style={{ padding: '13px 16px' }}>
                            {user.university
                              ? (
                                <span style={{ display: 'inline-block', background: '#EFF6FF', color: '#1D4ED8', borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {user.university}
                                </span>
                              )
                              : <span style={{ color: '#D1D5DB', fontSize: 13 }}>—</span>
                            }
                          </td>

                          {/* Role badge */}
                          <td style={{ padding: '13px 16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: cfg.bg, color: cfg.color, borderRadius: 99, padding: '4px 11px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                              <RoleIcon size={12} />
                              {cfg.label}
                            </span>
                          </td>

                          {/* Joined */}
                          <td style={{ padding: '13px 16px', fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                            {user.created_at
                              ? new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—'
                            }
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '13px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <select
                                value={user.role}
                                onChange={e => changeRole(user.id, e.target.value)}
                                title="Change role"
                                style={{ fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: '#FAFAFA', color: '#374151', cursor: 'pointer', outline: 'none' }}>
                                <option value="student">Student</option>
                                <option value="landlord">Landlord</option>
                                <option value="admin">Admin</option>
                              </select>

                              <button
                                onClick={() => handleDelete(user)}
                                title="Delete user"
                                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #FEE2E2', background: '#FFF5F5', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.12s' }}
                                onMouseEnter={e => { const b = e.currentTarget; b.style.background = '#EF4444'; b.style.color = '#fff'; b.style.borderColor = '#EF4444'; }}
                                onMouseLeave={e => { const b = e.currentTarget; b.style.background = '#FFF5F5'; b.style.color = '#EF4444'; b.style.borderColor = '#FEE2E2'; }}>
                                <Trash2 size={13} />
                              </button>
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
                  <Users size={32} style={{ color: '#D1D5DB', marginBottom: 10 }} />
                  <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>No users match your filters</p>
                  {hasFilter && (
                    <button onClick={clearAll} style={{ marginTop: 10, fontSize: 13, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                      Clear filters
                    </button>
                  )}
                </div>
              )}

              {/* Footer */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                  Showing {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
                </span>
                {hasFilter && (
                  <button onClick={clearAll} style={{ fontSize: 12, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
