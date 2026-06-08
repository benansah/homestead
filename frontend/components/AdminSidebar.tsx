'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Building2, CalendarCheck, Users, LogOut, ExternalLink, GraduationCap } from 'lucide-react';

const NAV = [
  { href: '/admin',              label: 'Overview',      icon: LayoutDashboard },
  { href: '/admin/listings',     label: 'Listings',      icon: Building2 },
  { href: '/admin/bookings',     label: 'Bookings',      icon: CalendarCheck },
  { href: '/admin/users',        label: 'Users',         icon: Users },
  { href: '/admin/universities', label: 'Universities',  icon: GraduationCap },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─── shown md and up ── */}
      <aside className="hidden md:flex" style={{
        width: 220, flexShrink: 0, minHeight: '100vh',
        background: '#0F172A', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Link href="/" style={{ display: 'block', textDecoration: 'none' }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#60A5FA', fontFamily: 'Georgia,serif' }}>Homestead</span>
          </Link>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3, display: 'block', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Admin panel
          </span>
        </div>

        {/* User chip */}
        {user && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1E40AF', color: '#93C5FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                {user.fullname?.[0]?.toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'white', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.fullname?.split(' ')[0]}
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px' }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 10, marginBottom: 2,
                fontSize: 15, fontWeight: active ? 600 : 500,
                background: active ? 'rgba(96,165,250,0.15)' : 'transparent',
                color: active ? '#93C5FD' : 'rgba(255,255,255,0.6)',
                transition: 'all 0.15s', textDecoration: 'none',
              }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)'; } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; } }}>
                <Icon size={16} />
                {label}
                {active && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: '#60A5FA' }} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, marginBottom: 2, fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}>
            <ExternalLink size={15} /> View site
          </Link>
          <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: '#F87171', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.1)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── MOBILE TAB BAR ─── shown below md ── */}
      <div className="md:hidden" style={{
        background: '#0F172A',
        position: 'sticky', top: 0, zIndex: 40,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        {/* Logo + user row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#60A5FA', fontFamily: 'Georgia,serif' }}>Homestead</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Admin
              </span>
            )}
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#F87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', cursor: 'pointer' }}>
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>

        {/* Nav tabs — scrollable */}
        <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '10px 18px', flexShrink: 0,
                color: active ? '#93C5FD' : 'rgba(255,255,255,0.45)',
                borderBottom: `2px solid ${active ? '#60A5FA' : 'transparent'}`,
                textDecoration: 'none', fontSize: 11, fontWeight: active ? 700 : 500,
                transition: 'color 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap',
              }}>
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
          <Link href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 18px', flexShrink: 0, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontSize: 11, fontWeight: 500 }}>
            <ExternalLink size={17} />
            Site
          </Link>
        </div>
      </div>
    </>
  );
}
