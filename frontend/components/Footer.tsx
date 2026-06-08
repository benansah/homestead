import Link from 'next/link';

const COL = { display: 'flex' as const, flexDirection: 'column' as const, gap: 10 };
const H: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 };
const A: React.CSSProperties = { fontSize: 14, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', transition: 'color 0.15s' };

export default function Footer() {
  return (
    <footer style={{ background: '#0F172A', color: 'white', paddingTop: 60, paddingBottom: 40 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* Top row */}
        <div className="r-footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 40, marginBottom: 56 }}>

          {/* Brand */}
          <div className="r-footer-brand">
            <Link href="/" style={{ display: 'inline-block', marginBottom: 12 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#60A5FA', fontFamily: 'Georgia,serif' }}>Homestead</span>
            </Link>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 260 }}>
              Ghana's most trusted student hostel finder. Verified listings near every major university.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              {['🇬🇭', '🏠', '🎓'].map(e => (
                <span key={e} style={{ fontSize: 20 }}>{e}</span>
              ))}
            </div>
          </div>

          {/* Company */}
          <div style={COL}>
            <p style={H}>Company</p>
            {[{ href: '/about', label: 'About us' }, { href: '/help', label: 'Help & FAQ' }, { href: '/help#contact', label: 'Contact' }].map(({ href, label }) => (
              <Link key={href} href={href} style={A}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = 'white')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.65)')}>
                {label}
              </Link>
            ))}
          </div>

          {/* For students */}
          <div style={COL}>
            <p style={H}>Students</p>
            {[{ href: '/hostels', label: 'Browse hostels' }, { href: '/roommates', label: 'Find a roommate' }, { href: '/bookings', label: 'My bookings' }, { href: '/wishlist', label: 'Saved hostels' }].map(({ href, label }) => (
              <Link key={href} href={href} style={A}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = 'white')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.65)')}>
                {label}
              </Link>
            ))}
          </div>

          {/* For landlords */}
          <div style={COL}>
            <p style={H}>Landlords</p>
            {[{ href: '/register?role=landlord', label: 'List your hostel' }, { href: '/landlord', label: 'Dashboard' }, { href: '/help#landlords', label: 'How it works' }].map(({ href, label }) => (
              <Link key={href} href={href} style={A}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = 'white')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.65)')}>
                {label}
              </Link>
            ))}
          </div>

          {/* Legal */}
          <div style={COL}>
            <p style={H}>Legal</p>
            {[{ href: '/terms', label: 'Terms & Conditions' }, { href: '/refund-policy', label: 'Refund Policy' }, { href: '/terms#privacy', label: 'Privacy Policy' }].map(({ href, label }) => (
              <Link key={href} href={href} style={A}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = 'white')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.65)')}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* University chips */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 28, marginBottom: 28 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>AVAILABLE NEAR</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['University of Ghana', 'KNUST', 'UCC', 'University of Education', 'Ashesi University'].map(u => (
              <Link key={u} href={`/hostels?university=${encodeURIComponent(u)}`}
                style={{ fontSize: 12, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'all 0.15s' }}
                onMouseEnter={e => { const el = e.target as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.3)'; el.style.color = 'white'; }}
                onMouseLeave={e => { const el = e.target as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.12)'; el.style.color = 'rgba(255,255,255,0.55)'; }}>
                {u}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>© 2025 Homestead · Made in Ghana 🇬🇭</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Viewing fee: GHS 50 · Refundable if room unavailable</p>
        </div>
      </div>
    </footer>
  );
}
