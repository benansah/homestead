'use client';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Heart, ChevronDown, Menu, X, Bell, LogOut, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../lib/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen]           = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifCount(res.data.unread_count || 0);
      } catch {}
    };
    load();
    // poll every 60 seconds
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <nav style={{ borderBottom: '1px solid var(--border)', background: '#fff' }}
      className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">

        {/* Logo */}
        <Link href="/"
          style={{ color: 'var(--blue)', fontFamily: 'Georgia, serif', letterSpacing: '-0.5px' }}
          className="text-2xl font-black shrink-0 mr-2">
          hostelGH
        </Link>

        {/* Nav links */}
        <div className="hidden lg:flex items-center gap-1">
          {['Browse', 'Near me', 'Verified'].map(label => (
            <button key={label}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium
                         text-gray-700 hover:text-blue-600 rounded-lg hover:bg-gray-50 transition-colors">
              {label} <ChevronDown size={13} className="text-gray-400" />
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Right side */}
        <div className="hidden md:flex items-center gap-1">
          {user ? (
            <>
              <Link href="/wishlist"
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700
                           hover:bg-gray-50 rounded-lg transition-colors">
                <Heart size={15} /> Saved
              </Link>

              <Link href="/bookings"
                className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                My bookings
              </Link>

              {user.role === 'student' && (
                <Link href="/roommates"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700
                             hover:bg-gray-50 rounded-lg transition-colors">
                  <Users size={15} /> Roommates
                </Link>
              )}

              {/* Notification bell */}
              <Link href="/notifications"
                className="relative px-3 py-2 text-gray-700 hover:bg-gray-50
                           rounded-lg transition-colors flex items-center">
                <Bell size={17} />
                {notifCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full
                                   text-white flex items-center justify-center font-bold"
                    style={{ background: 'var(--blue)', fontSize: '10px' }}>
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </Link>

              {/* Avatar + role */}
              <div className="flex items-center gap-2 ml-1 pl-3"
                style={{ borderLeft: '1px solid var(--border)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center
                                text-white text-sm font-bold"
                  style={{ background: 'var(--blue)' }}>
                  {user.fullname?.[0]?.toUpperCase()}
                </div>
                <div className="hidden xl:block">
                  <p className="text-xs font-semibold text-gray-800 leading-none">
                    {user.fullname?.split(' ')[0]}
                  </p>
                  <p className="text-xs text-gray-400 capitalize mt-0.5">{user.role}</p>
                </div>

                {/* Admin link */}
                {user.role === 'admin' && (
                  <Link href="/admin"
                    className="text-xs font-semibold px-2 py-1 rounded-lg ml-1"
                    style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
                    Admin
                  </Link>
                )}

                {/* Landlord link */}
                {user.role === 'landlord' && (
                  <Link href="/landlord"
                    className="text-xs font-semibold px-2 py-1 rounded-lg ml-1"
                    style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
                    Dashboard
                  </Link>
                )}

                <button onClick={logout}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400
                             hover:text-red-500 transition-colors ml-1"
                  title="Sign out">
                  <LogOut size={15} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login"
                className="px-4 py-2 text-sm font-semibold text-gray-700
                           hover:bg-gray-50 rounded-lg transition-colors">
                Sign in
              </Link>
              <Link href="/register"
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors"
                style={{ background: 'var(--blue)' }}>
                Join
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-1" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t px-4 py-3 flex flex-col gap-2 bg-white"
          style={{ borderColor: 'var(--border)' }}>
          <Link href="/" className="text-sm py-2 text-gray-700" onClick={() => setOpen(false)}>Browse</Link>
          {user ? (
            <>
              <Link href="/wishlist" className="text-sm py-2 text-gray-700" onClick={() => setOpen(false)}>Saved</Link>
              <Link href="/bookings" className="text-sm py-2 text-gray-700" onClick={() => setOpen(false)}>My bookings</Link>
              {user.role === 'student' && (
                <Link href="/roommates" className="text-sm py-2 text-gray-700" onClick={() => setOpen(false)}>Roommates</Link>
              )}
              <Link href="/notifications"
                className="text-sm py-2 text-gray-700 flex items-center gap-2"
                onClick={() => setOpen(false)}>
                Notifications
                {notifCount > 0 && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: 'var(--blue)' }}>
                    {notifCount}
                  </span>
                )}
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="text-sm py-2 font-semibold"
                  style={{ color: 'var(--blue)' }} onClick={() => setOpen(false)}>
                  Admin panel
                </Link>
              )}
              {user.role === 'landlord' && (
                <Link href="/landlord" className="text-sm py-2 font-semibold"
                  style={{ color: 'var(--blue)' }} onClick={() => setOpen(false)}>
                  My dashboard
                </Link>
              )}
              <button onClick={logout} className="text-sm py-2 text-red-500 text-left">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm py-2 text-gray-700" onClick={() => setOpen(false)}>Sign in</Link>
              <Link href="/register" className="text-sm py-2 font-semibold text-left"
                style={{ color: 'var(--blue)' }} onClick={() => setOpen(false)}>Join free</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}