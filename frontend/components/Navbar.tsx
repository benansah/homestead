'use client';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import {
  Heart, Bell, LogOut, LayoutDashboard,
  Home, Users, Info, HelpCircle, BookOpen, Bookmark,
  ShieldCheck, X, UserCircle, GitCompareArrows,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../lib/api';

const NAV_LINKS = [
  { href: '/hostels',   label: 'Browse hostels',  Icon: Home },
  { href: '/compare',   label: 'Compare',          Icon: GitCompareArrows },
  { href: '/roommates', label: 'Find a roommate', Icon: Users },
  { href: '/about',     label: 'About',            Icon: Info },
  { href: '/help',      label: 'Help',             Icon: HelpCircle },
];

/* Three-bar hamburger SVG — cleaner than lucide Menu on mobile */
function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="5"  width="18" height="2" rx="1" fill="currentColor"/>
      <rect x="2" y="10" width="14" height="2" rx="1" fill="currentColor"/>
      <rect x="2" y="15" width="18" height="2" rx="1" fill="currentColor"/>
    </svg>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen]             = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [scrolled, setScrolled]     = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* lock body scroll while drawer is open */
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = open ? 'hidden' : '';
    }
    return () => { if (typeof document !== 'undefined') document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try { const r = await api.get('/notifications'); setNotifCount(r.data.unread_count || 0); } catch {}
    };
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [user]);

  const close = () => setOpen(false);

  const desktopLink: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '9px 16px', borderRadius: 99,
    fontSize: 14, fontWeight: 500, color: 'var(--text-2)',
    transition: 'background 0.15s, color 0.15s', whiteSpace: 'nowrap',
    textDecoration: 'none',
  };

  const drawerRow: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 16px', borderRadius: 12,
    fontSize: 15, fontWeight: 500, color: 'var(--text)',
    marginBottom: 2, transition: 'background 0.12s',
    textDecoration: 'none', cursor: 'pointer',
    border: 'none', background: 'transparent', width: '100%',
    textAlign: 'left',
  };

  const iconBox = (bg: string, border: string): React.CSSProperties => ({
    width: 36, height: 36, borderRadius: 10,
    background: bg, border: `1px solid ${border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  });

  return (
    <>
      {/* ── NAVBAR BAR ─────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: scrolled ? 'rgba(255,255,255,0.96)' : '#fff',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,106,255,0.10)' : '1px solid var(--border)',
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.07)' : 'none',
        transition: 'all 0.25s ease',
      }}>
        <div style={{
          maxWidth: 1440, margin: '0 auto',
          padding: '0 40px',
          height: 68,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>

          {/* Logo */}
          <Link href="/" style={{ flexShrink: 0, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }} onClick={close}>
            <img src="/icon.png" alt="" style={{ height: 42, width: 42, display: 'block' }} />
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#7C4A1E', letterSpacing: '-0.01em', lineHeight: 1 }}>
              Homestead
            </span>
          </Link>

          {/* Desktop nav links — hidden below lg */}
          <div className="hidden lg:flex" style={{ alignItems: 'center', gap: 2, marginLeft: 24 }}>
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} style={desktopLink}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--blue-light)'; el.style.color = 'var(--blue)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--text-2)'; }}>
                {label}
              </Link>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Desktop right side — hidden below md */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 2 }}>
            {user ? (
              <>
                <Link href="/wishlist" style={desktopLink}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  <Heart size={15} /> Saved
                </Link>
                <Link href="/bookings" style={desktopLink}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  Bookings
                </Link>
                <Link href="/notifications" style={{ ...desktopLink, padding: '8px 10px', position: 'relative' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  <Bell size={17} />
                  {notifCount > 0 && (
                    <span style={{
                      position: 'absolute', top: 4, right: 4,
                      minWidth: 16, height: 16, borderRadius: 99,
                      background: 'var(--blue)', color: 'white',
                      fontSize: 10, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                    }}>{notifCount > 9 ? '9+' : notifCount}</span>
                  )}
                </Link>
                <Link href="/profile" style={desktopLink} title="Profile & settings"
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  <UserCircle size={15} /> Profile
                </Link>
                <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 6px' }} />
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), #3B82F6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,106,255,0.3)' }}>
                  {user.fullname?.[0]?.toUpperCase()}
                </div>
                {(user.role === 'admin' || user.role === 'landlord') && (
                  <Link href={user.role === 'admin' ? '/admin' : '/landlord'}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700, background: 'var(--blue)', color: 'white', textDecoration: 'none', transition: 'opacity 0.15s', marginLeft: 4, boxShadow: '0 2px 10px rgba(0,106,255,0.35)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.88')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}>
                    <LayoutDashboard size={13} />
                    {user.role === 'admin' ? 'Admin' : 'Dashboard'}
                  </Link>
                )}
                <button onClick={logout} title="Sign out"
                  style={{ padding: '7px', borderRadius: 10, color: '#9CA3AF', transition: 'all 0.15s', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLElement).style.color = '#DC2626'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}>
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" style={{ ...desktopLink, fontWeight: 600 }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  Sign in
                </Link>
                <Link href="/register" className="btn btn-primary btn-sm">Join free</Link>
              </>
            )}
          </div>

          {/* ── MOBILE RIGHT CLUSTER ─ shown below md ── */}
          <div className="flex md:hidden" style={{ alignItems: 'center', gap: 6 }}>

            {/* Bell with badge (logged in only) */}
            {user && (
              <Link href="/notifications"
                style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 10, color: 'var(--text-2)', textDecoration: 'none' }}>
                <Bell size={20} />
                {notifCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    minWidth: 16, height: 16, borderRadius: 99,
                    background: '#EF4444', color: 'white',
                    fontSize: 9, fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                  }}>{notifCount > 9 ? '9+' : notifCount}</span>
                )}
              </Link>
            )}

            {/* Avatar (logged in) or Sign in link (guest) */}
            {user ? (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                {user.fullname?.[0]?.toUpperCase()}
              </div>
            ) : (
              <Link href="/login"
                style={{ fontSize: 14, fontWeight: 600, color: 'var(--blue)', textDecoration: 'none', padding: '6px 10px', borderRadius: 8, background: 'var(--blue-light)' }}>
                Sign in
              </Link>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 38, height: 38, borderRadius: 10,
                border: '1.5px solid var(--border)',
                background: 'white', cursor: 'pointer',
                color: 'var(--text)', flexShrink: 0,
              }}>
              <HamburgerIcon />
            </button>
          </div>

        </div>
      </nav>

      {/* ── BACKDROP ─────────────────────────────────────────── */}
      {open && (
        <div
          onClick={close}
          style={{
            position: 'fixed', inset: 0, zIndex: 90,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
          }}
        />
      )}

      {/* ── SLIDE-IN DRAWER ──────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(300px, 86vw)',
        background: 'white',
        zIndex: 100,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '-16px 0 48px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>

        {/* Drawer top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 16px 14px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <Link href="/" onClick={close} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/icon.png" alt="" style={{ height: 30, width: 30 }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: '#7C4A1E', fontFamily: 'Georgia,serif' }}>
              Homestead
            </span>
          </Link>
          <button onClick={close} aria-label="Close"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 34, height: 34, borderRadius: 8,
              border: '1.5px solid var(--border)', background: 'white',
              cursor: 'pointer', color: 'var(--text-muted)',
            }}>
            <X size={16} />
          </button>
        </div>

        {/* Nav links */}
        <div style={{ padding: '8px 10px 0', flexShrink: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 6px 6px' }}>
            Explore
          </p>
          {NAV_LINKS.map(({ href, label, Icon }) => (
            <Link key={href} href={href} onClick={close}
              style={{ ...drawerRow, color: 'var(--text)' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
              <span style={iconBox('var(--blue-light)', 'var(--blue-mid)')}>
                <Icon size={16} style={{ color: 'var(--blue)' }} />
              </span>
              {label}
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '10px 10px 0' }} />

        {/* Account section */}
        <div style={{ padding: '8px 10px', flexShrink: 0 }}>
          {user ? (
            <>
              {/* User card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 6px 14px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                  {user.fullname?.[0]?.toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.fullname}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1, textTransform: 'capitalize' }}>
                    {user.role} account
                  </p>
                </div>
              </div>

              {[
                { href: '/wishlist',      label: 'Saved hostels',  Icon: Heart,          note: null },
                { href: '/bookings',      label: 'My bookings',    Icon: BookOpen,        note: null },
                { href: '/notifications', label: 'Notifications',  Icon: Bell,            note: notifCount > 0 ? String(notifCount) : null },
                { href: '/profile',       label: 'Profile & settings', Icon: UserCircle,   note: null },
                ...(user.role === 'admin'    ? [{ href: '/admin',    label: 'Admin panel',  Icon: ShieldCheck,     note: null }] : []),
                ...(user.role === 'landlord' ? [{ href: '/landlord', label: 'My dashboard', Icon: LayoutDashboard, note: null }] : []),
              ].map(({ href, label, Icon, note }) => (
                <Link key={href} href={href} onClick={close}
                  style={{ ...drawerRow }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  <span style={iconBox('var(--surface)', 'var(--border)')}>
                    <Icon size={15} style={{ color: 'var(--text-muted)' }} />
                  </span>
                  <span style={{ flex: 1 }}>{label}</span>
                  {note && (
                    <span style={{ background: '#EF4444', color: 'white', fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 99 }}>
                      {note}
                    </span>
                  )}
                </Link>
              ))}

              <button
                onClick={() => { close(); logout(); }}
                style={{ ...drawerRow, color: '#DC2626' } as React.CSSProperties}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#FEF2F2')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                <span style={iconBox('#FEF2F2', '#FCA5A5')}>
                  <LogOut size={15} style={{ color: '#DC2626' }} />
                </span>
                Sign out
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 4px 4px' }}>
              <Link href="/login" onClick={close}
                style={{ display: 'block', padding: '13px 16px', borderRadius: 12, fontSize: 15, fontWeight: 600, color: 'var(--text-2)', border: '1.5px solid var(--border)', textAlign: 'center', textDecoration: 'none' }}>
                Sign in
              </Link>
              <Link href="/register" onClick={close}
                style={{ display: 'block', padding: '13px 16px', borderRadius: 12, fontSize: 15, fontWeight: 700, color: 'white', background: 'var(--blue)', textAlign: 'center', textDecoration: 'none', boxShadow: 'var(--sh-blue)' }}>
                Join free →
              </Link>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Footer tag */}
        <div style={{ padding: '14px 16px 24px', borderTop: '1px solid var(--border)', flexShrink: 0, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>🇬🇭 Ghana&apos;s student hostel finder</p>
        </div>
      </div>
    </>
  );
}
