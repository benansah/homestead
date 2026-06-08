'use client';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQS = [
  {
    section: 'For students',
    items: [
      { q: 'How do I find a hostel?', a: 'Go to Browse Hostels, use the university filter, then click any listing to see details, photos, and available rooms.' },
      { q: 'How much does it cost?', a: "Browsing is completely free. When you want to contact a landlord, you pay a one-time GHS 50 viewing fee. This gives you the landlord's phone number." },
      { q: 'Is my GHS 50 refundable?', a: 'Yes — if the room is no longer available, or the landlord is unreachable within 48 hours, you get a full or partial refund. See our Refund Policy for full details.' },
      { q: "How long does it take to get the landlord's contact?", a: 'After paying, our admin verifies availability with the landlord. This typically takes a few hours on business days.' },
      { q: 'What about group bookings?', a: 'In group bookings, each person pays GHS 50 individually — the fee is NOT split. The lead student creates the group, gets a code, and each friend joins using that code and pays their own GHS 50.' },
    ],
  },
  {
    section: 'For landlords',
    id: 'landlords',
    items: [
      { q: 'How do I list my hostel?', a: 'Create a landlord account, go to your dashboard and click "Add full hostel" or "List a room" for a quick single-room listing. Submit for review — listings go live within 24 hours.' },
      { q: 'Is it free to list?', a: 'Yes, listing on Homestead is completely free. We charge students a GHS 50 viewing fee, not landlords.' },
      { q: 'How do I get notified when a student books?', a: "You'll receive a WhatsApp message from our admin team asking you to confirm availability. Once confirmed, we release your number to the student." },
    ],
  },
  {
    section: 'Payments & refunds',
    items: [
      { q: 'What payment methods are accepted?', a: "We accept all major cards and mobile money through Paystack, Ghana's leading payment processor." },
      { q: 'Is my payment secure?', a: 'Yes. All payments are processed by Paystack (PCI-DSS compliant). We never store your card details.' },
      { q: 'How long do refunds take?', a: 'Refunds are processed within 3–5 business days after approval.' },
    ],
  },
];

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 10 }}>
      <button
        onClick={() => setOpen(!open)}
        className="faq-btn"
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: open ? 'var(--blue-light)' : 'white', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 14, transition: 'background 0.15s' }}>
        <span style={{ fontSize: 'clamp(14px,2vw,17px)', fontWeight: 700, color: '#0F172A', lineHeight: 1.4 }}>{q}</span>
        {open
          ? <ChevronUp size={18} style={{ color: 'var(--blue)', flexShrink: 0 }} />
          : <ChevronDown size={18} style={{ color: '#94A3B8', flexShrink: 0 }} />}
      </button>
      {open && (
        <div className="faq-body" style={{ padding: '16px 24px 20px', background: 'var(--surface)' }}>
          <p style={{ fontSize: 'clamp(14px,2vw,16px)', color: '#475569', lineHeight: 1.8 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #EBF3FF, #EDE9FE)', padding: 'clamp(44px,8vw,80px) 20px clamp(36px,7vw,64px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <span style={{ fontSize: 'clamp(40px,10vw,64px)', display: 'block', marginBottom: 16 }}>💬</span>
          <h1 style={{ fontSize: 'clamp(26px,6vw,52px)', fontWeight: 900, color: '#0F172A', letterSpacing: 'clamp(-1px,-0.03em,-2px)', fontFamily: 'Georgia,serif', marginBottom: 16 }}>
            Help &amp; FAQ
          </h1>
          <p style={{ fontSize: 'clamp(15px,2.5vw,20px)', color: '#475569', lineHeight: 1.7 }}>
            Find answers to the most common questions about Homestead.
          </p>
        </div>
      </div>

      {/* FAQs */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(32px,5vw,64px) 20px clamp(48px,7vw,96px)' }}>
        {FAQS.map(({ section, id, items }) => (
          <div key={section} id={id} style={{ marginBottom: 'clamp(36px,5vw,56px)' }}>
            <h2 style={{ fontSize: 'clamp(18px,3vw,28px)', fontWeight: 900, color: '#0F172A', marginBottom: 20, fontFamily: 'Georgia,serif', paddingBottom: 14, borderBottom: '2px solid var(--border)' }}>
              {section}
            </h2>
            {items.map(({ q, a }) => <FAQ key={q} q={q} a={a} />)}
          </div>
        ))}

        {/* Contact block */}
        <div id="contact" style={{ background: '#0F172A', borderRadius: 20, padding: 'clamp(28px,5vw,48px) clamp(20px,4vw,40px)', textAlign: 'center', color: 'white' }}>
          <h2 style={{ fontSize: 'clamp(20px,4vw,32px)', fontWeight: 900, marginBottom: 14, fontFamily: 'Georgia,serif' }}>Still need help?</h2>
          <p style={{ fontSize: 'clamp(14px,2vw,18px)', color: 'rgba(255,255,255,0.65)', marginBottom: 28, lineHeight: 1.7 }}>
            Our team is available Monday–Friday, 8am–6pm. We typically respond within a few hours.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="mailto:support@Homestead.com"
              style={{ padding: '13px 24px', background: 'var(--blue)', color: 'white', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
              Email support →
            </a>
            <Link href="/bookings"
              style={{ padding: '13px 24px', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>
              View my bookings
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
