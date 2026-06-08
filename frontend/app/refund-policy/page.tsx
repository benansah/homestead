'use client';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

const P: React.CSSProperties = { fontSize: 17, color: '#475569', lineHeight: 1.85, marginBottom: 18 };
const LI: React.CSSProperties = { fontSize: 17, color: '#475569', lineHeight: 1.8, marginBottom: 8 };
const H2: React.CSSProperties = { fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 14, marginTop: 48, fontFamily: 'Georgia,serif' };

export default function RefundPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Navbar />

      {/* Header */}
      <div className="page-header" style={{ background: 'var(--surface)', padding: 'clamp(32px,5vw,60px) 20px clamp(24px,4vw,40px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(26px,5vw,48px)', fontWeight: 900, color: '#0F172A', fontFamily: 'Georgia,serif', marginBottom: 10, letterSpacing: 'clamp(-0.5px,-0.03em,-1.5px)' }}>Refund Policy</h1>
          <p style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>Last updated: January 2025</p>
        </div>
      </div>

      <div className="static-content-pad" style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(24px,4vw,48px) 20px clamp(48px,8vw,96px)' }}>
        <p style={P}>Homestead charges a <strong>GHS 50 viewing fee</strong> when a student books a hostel viewing. In group bookings, <strong>each member pays GHS 50 individually</strong>. This policy explains when and how refunds are issued.</p>

        {/* Summary cards */}
        <div className="r-refund-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, margin: '32px 0' }}>
          {[
            { icon: <CheckCircle2 size={24} style={{ color: '#10B981' }} />, label: 'Full refund', desc: 'Room no longer available', bg: '#F0FDF4', border: '#86EFAC' },
            { icon: <CheckCircle2 size={24} style={{ color: '#3B82F6' }} />, label: 'Half refund', desc: 'Landlord unresponsive 24–48h', bg: '#EFF6FF', border: '#93C5FD' },
            { icon: <XCircle size={24} style={{ color: '#EF4444' }} />, label: 'No refund', desc: 'Student no-show or changed mind', bg: '#FEF2F2', border: '#FCA5A5' },
          ].map(({ icon, label, desc, bg, border }) => (
            <div key={label} style={{ background: bg, borderRadius: 16, padding: '24px 20px', border: `1.5px solid ${border}`, textAlign: 'center' }}>
              <div style={{ marginBottom: 12 }}>{icon}</div>
              <p style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>{label}</p>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>

        <h2 style={H2}>When you get a full refund</h2>
        <ul style={{ paddingLeft: 24, marginBottom: 20 }}>
          {[
            'The room is no longer available at booking confirmation',
            'The landlord cannot be reached within 48 hours of contact being released',
            'The landlord cancels the viewing after confirmation',
            'The listing contains materially false information not disclosed upfront',
          ].map(item => <li key={item} style={LI}>✅ {item}</li>)}
        </ul>

        <h2 style={H2}>When you get a 50% refund</h2>
        <ul style={{ paddingLeft: 24, marginBottom: 20 }}>
          {[
            'The landlord is unresponsive for 24–48 hours after contact is released',
            'The viewing cannot happen within a reasonable timeframe due to landlord unavailability',
          ].map(item => <li key={item} style={LI}>⚡ {item}</li>)}
        </ul>

        <h2 style={H2}>When no refund is issued</h2>
        <ul style={{ paddingLeft: 24, marginBottom: 20 }}>
          {[
            "Student chooses not to proceed after receiving the landlord's contact",
            'Student misses the agreed viewing appointment',
            'Student finds alternative accommodation after booking',
            'Student does not like the hostel after visiting in person',
          ].map(item => <li key={item} style={LI}>❌ {item}</li>)}
        </ul>

        <h2 style={H2}>How to request a refund</h2>
        <ol style={{ paddingLeft: 24, marginBottom: 20 }}>
          {[
            'Log in and go to My Bookings',
            'Select the relevant booking',
            'Contact our team at support@Homestead.com',
            'We review your case within 2 business days',
          ].map((item, i) => <li key={item} style={{ ...LI }}>{i + 1}. {item}</li>)}
        </ol>

        <div style={{ background: '#FFFBEB', border: '1px solid #FDE047', borderRadius: 16, padding: '24px 28px', marginTop: 40, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <Clock size={22} style={{ color: '#CA8A04', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#854D0E', marginBottom: 6 }}>Processing time</p>
            <p style={{ fontSize: 16, color: '#92400E', lineHeight: 1.7 }}>Approved refunds are processed within 3–5 business days and returned to your original payment method via Paystack.</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
