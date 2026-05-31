'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import {
  Bell, CheckCheck, Trash2, Loader2,
  Home, CreditCard, Star, Users, Settings, Gift
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Notification } from '../../types';

const TYPE_CONFIG: Record<string, {
  icon: React.ReactNode;
  color: string;
  bg: string;
}> = {
  booking:      { icon: <Home size={16} />,       color: '#1D4ED8', bg: '#EFF6FF' },
  payment:      { icon: <CreditCard size={16} />, color: '#065F46', bg: '#ECFDF5' },
  availability: { icon: <Bell size={16} />,       color: '#B45309', bg: '#FFF9EB' },
  review:       { icon: <Star size={16} />,       color: '#6B21A8', bg: '#F5F3FF' },
  referral:     { icon: <Gift size={16} />,       color: '#BE185D', bg: '#FDF2F8' },
  system:       { icon: <Settings size={16} />,   color: '#374151', bg: '#F9FAFB' },
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [unread, setUnread]               = useState(0);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/notifications');
        setNotifications(res.data.notifications || []);
        setUnread(res.data.unread_count || 0);
      } catch {
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user, authLoading]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnread(0);
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to update');
    }
  };

  const markOneRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnread(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const deleteOne = async (id: number) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification removed');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Notifications
              {unread > 0 && (
                <span className="text-sm font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: 'var(--blue)' }}>
                  {unread}
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {unread > 0 ? `${unread} unread` : 'All caught up'}
            </p>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold
                         rounded-lg border hover:bg-gray-50 transition-colors text-gray-700"
              style={{ borderColor: 'var(--border)' }}>
              <CheckCheck size={15} /> Mark all read
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl"
            style={{ border: '1px solid var(--border)' }}>
            <Bell size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="font-semibold text-gray-600 mb-1">No notifications yet</p>
            <p className="text-sm text-gray-400">
              We'll notify you about bookings, availability, and more
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => {
              const cfg = TYPE_CONFIG[notif.not_type] || TYPE_CONFIG.system;
              return (
                <div key={notif.id}
                  onClick={() => !notif.is_read && markOneRead(notif.id)}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white cursor-pointer
                             hover:shadow-sm transition-all"
                  style={{
                    border: `1px solid ${notif.is_read ? 'var(--border)' : '#BFDBFE'}`,
                    background: notif.is_read ? '#fff' : '#F0F7FF',
                  }}>

                  {/* Icon */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${
                      notif.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'
                    }`}>
                      {notif.not_message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {notif.not_type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {notif.created_at
                          ? new Date(notif.created_at).toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })
                          : '—'}
                      </span>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full ml-auto shrink-0"
                          style={{ background: 'var(--blue)' }} />
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={e => { e.stopPropagation(); deleteOne(notif.id); }}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-red-50
                               text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}