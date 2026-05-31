'use client';
import { useState, useEffect } from 'react';
import AdminGuard from '../../../components/AdminGuard';
import AdminSidebar from '../../../components/AdminSidebar';
import api from '../../../lib/api';
import { Search, Loader2, GraduationCap, Home, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/users');
        setUsers(res.data);
      } catch {
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const ROLE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    student:  { icon: <GraduationCap size={13} />, color: '#1D4ED8', bg: '#EFF6FF' },
    landlord: { icon: <Home size={13} />,          color: '#065F46', bg: '#ECFDF5' },
    admin:    { icon: <Shield size={13} />,        color: '#6B21A8', bg: '#F5F3FF' },
  };

  const filtered = users.filter(u => {
    const matchSearch =
      u.fullname?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.role === filter;
    return matchSearch && matchFilter;
  });

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-sm text-gray-500 mt-1">
              {users.length} total users on the platform
            </p>
          </div>

          {/* Summary pills */}
          <div className="flex gap-3 mb-5">
            {[
              { role: 'student',  label: 'Students',  color: '#1D4ED8', bg: '#EFF6FF' },
              { role: 'landlord', label: 'Landlords', color: '#065F46', bg: '#ECFDF5' },
              { role: 'admin',    label: 'Admins',    color: '#6B21A8', bg: '#F5F3FF' },
            ].map(({ role, label, color, bg }) => (
              <div key={role} className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: bg, color }}>
                {users.filter(u => u.role === role).length} {label}
              </div>
            ))}
          </div>

          {/* Search + filter */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 max-w-xs relative">
              <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search name or email..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none"
                style={{ border: '1px solid var(--border)' }} />
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {['all', 'student', 'landlord', 'admin'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                  style={{
                    background: filter === f ? '#fff' : 'transparent',
                    color: filter === f ? 'var(--text)' : '#6B7280',
                    boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

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
                    {['User', 'Email', 'Phone', 'University', 'Role', 'Joined'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold
                                             text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {filtered.map(user => {
                    const rc = ROLE_CONFIG[user.role] || ROLE_CONFIG.student;
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center
                                            justify-center text-white text-xs font-bold shrink-0"
                              style={{ background: 'var(--blue)' }}>
                              {user.fullname?.[0]?.toUpperCase()}
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              {user.fullname}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.phone}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {user.university || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-xs font-semibold
                                           px-2 py-1 rounded-full w-fit capitalize"
                            style={{ background: rc.bg, color: rc.color }}>
                            {rc.icon} {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString('en-GB')
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-400">No users found</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}