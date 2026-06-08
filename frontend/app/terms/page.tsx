'use client';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const P: React.CSSProperties  = { fontSize: 17, color: '#475569', lineHeight: 1.85, marginBottom: 18 };
const H2: React.CSSProperties = { fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 14, marginTop: 48, fontFamily: 'Georgia,serif' };
const LI: React.CSSProperties = { fontSize: 17, color: '#475569', lineHeight: 1.8, marginBottom: 8 };

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Navbar />

      {/* Header */}
      <div className="page-header" style={{ background: 'var(--surface)', padding: 'clamp(32px,5vw,60px) 20px clamp(24px,4vw,40px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(26px,5vw,48px)', fontWeight: 900, color: '#0F172A', fontFamily: 'Georgia,serif', marginBottom: 10, letterSpacing: 'clamp(-0.5px,-0.03em,-1.5px)' }}>Terms &amp; Conditions</h1>
          <p style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>Last updated: January 2025</p>
        </div>
      </div>

      <div className="static-content-pad" style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(24px,4vw,48px) 20px clamp(48px,8vw,96px)' }}>
        <p style={P}>By using Homestead ("the Platform"), you agree to these Terms and Conditions. Please read them carefully before using our services.</p>

        <h2 style={H2}>1. Use of the Platform</h2>
        <p style={P}>Homestead is a marketplace connecting students seeking accommodation with landlords who have available rooms. We do not own, manage, or operate any listed properties.</p>
        <p style={P}>You must be at least 16 years old to use this platform. By registering, you confirm that the information you provide is accurate and up to date.</p>

        <h2 style={H2}>2. Student Accounts</h2>
        <p style={P}>Students may browse listings for free. To receive a landlord&apos;s contact information, students must pay a viewing fee of <strong>GHS 50</strong> per booking, subject to our Refund Policy.</p>
        <p style={P}>Students agree not to misuse landlord contact information, to treat all parties respectfully, and to complete viewings they have booked in good faith.</p>

        <h2 style={H2}>3. Landlord Accounts</h2>
        <p style={P}>Landlords may list properties for free. By listing, landlords confirm that:</p>
        <ul style={{ paddingLeft: 24, marginBottom: 18 }}>
          {['The property is legally theirs to rent', 'All information provided is accurate, including availability', 'They will respond promptly when contacted by Homestead admin', 'They will not discriminate unlawfully against any student'].map(item => (
            <li key={item} style={LI}>{item}</li>
          ))}
        </ul>

        <h2 style={H2}>4. Viewing Fees &amp; Group Bookings</h2>
        <p style={P}>The GHS 50 viewing fee grants the student access to the landlord&apos;s phone number to arrange a viewing. In group bookings, <strong>each member pays GHS 50 individually</strong> — it is not shared or split.</p>
        <p style={P}>The viewing fee does <strong>not</strong> constitute a deposit, rent payment, or guarantee of a room. Students and landlords must negotiate all rental terms independently.</p>

        <h2 style={H2}>5. Prohibited Conduct</h2>
        <ul style={{ paddingLeft: 24, marginBottom: 18 }}>
          {['Post false, misleading, or fraudulent listings', 'Harass, threaten, or abuse other users', 'Scrape or reproduce platform content without permission', 'Circumvent the payment system to avoid fees', 'Use the platform for any unlawful purpose'].map(item => (
            <li key={item} style={LI}>{item}</li>
          ))}
        </ul>

        <h2 style={H2}>6. Liability</h2>
        <p style={P}>Homestead is a marketplace and is not responsible for the condition, legality, or accuracy of listings. We strongly recommend students visit properties in person before signing any rental agreement.</p>

        <h2 style={H2} id="privacy">7. Privacy</h2>
        <p style={P}>We collect and use personal data in accordance with our Privacy Policy. We do not sell your data to third parties. Landlord contact details are only shared with students who have paid the viewing fee for a specific listing.</p>

        <h2 style={H2}>8. Changes to Terms</h2>
        <p style={P}>We reserve the right to update these Terms at any time. Continued use of the platform constitutes acceptance of the new Terms.</p>

        <h2 style={H2}>9. Contact</h2>
        <p style={P}>For questions, contact us at <a href="mailto:legal@Homestead.com" style={{ color: 'var(--blue)', fontWeight: 600 }}>legal@Homestead.com</a>.</p>
      </div>

      <Footer />
    </div>
  );
}
