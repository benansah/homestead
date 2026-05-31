'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Building2, CalendarCheck,
  Users, LogOut, Home, Bell
} from 'lucide-react';

const NAV = [
  { href: '/admin',           label: 'Overview',   icon: LayoutDashboard },
  { href: '/admin/listings',  label: 'Listings',   icon: Building2 },
  { href: '/admin/bookings',  label: 'Bookings',   icon: CalendarCheck },
  { href: '/admin/users',     label: 'Users',      icon: Users },
  { href: '/admin/broadcast', label: 'Broadcast',  icon: Bell },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="w-56 shrink-0 bg-white min-h-screen flex flex-col"
      style={{ borderRight: '1px solid var(--border)' }}>

      {/* Logo */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/"
          className="text-xl font-black"
          style={{ color: 'var(--blue)', fontFamily: 'Georgia, serif' }}>
          hostelGH
        </Link>
        <p className="text-xs text-gray-400 mt-0.5">Admin panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                         font-medium transition-all"
              style={{
                background: active ? 'var(--blue-light)' : 'transparent',
                color: active ? 'var(--blue)' : '#374151',
              }}>
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 space-y-1"
        style={{ borderTop: '1px solid var(--border)' }}>
        <Link href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                     text-gray-600 hover:bg-gray-50 transition-colors">
          <Home size={17} /> View site
        </Link>
        <button onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                     text-red-500 hover:bg-red-50 transition-colors">
          <LogOut size={17} /> Sign out
        </button>
      </div>
    </aside>
  );
}