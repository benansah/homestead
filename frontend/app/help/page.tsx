'use client';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQS = [
  {
    section: 'For students',
    id: 'students',
    items: [
      {
        q: 'How do I find a hostel?',
        padding: '1rem 1.25rem',
        a: 'Go to Browse Hostels, use the university filter, then click any listing to see details, photos, and available rooms.',
      },
      {
        q: 'How much does it cost?',
        padding: '1rem 1.25rem',
        a: 'Browsing is completely free. When you want to contact a landlord, you pay a one-time GHS 50 viewing fee. This gives you the landlord\'s phone number.',
      },
      {
        q: 'Is my GHS 50 refundable?',
        padding: '1rem 1.25rem',
        a: 'Yes — if the room is no longer available, or the landlord is unreachable within 48 hours, you get a full or partial refund. See our Refund Policy for full details.',
      },
      {
        q: 'How long does it take to get the landlord\'s contact?',
        padding: '1rem 1.25rem',
        a: 'After paying, our admin verifies availability with the landlord. This typically takes a few hours on business days.',
      },
      {
        q: 'What about group bookings?',
        padding: '1rem 1.25rem',
        a: 'In group bookings, each person pays GHS 50 individually — the fee is NOT split. The lead student creates the group, gets a code, and each friend joins using that code and pays their own GHS 50.',
      },
    ],
  },
  {
    section: 'For landlords',
    id: 'landlords',
    items: [
      {
        q: 'How do I list my hostel?',
        padding: '1rem 1.25rem',
        a: 'Create a landlord account, go to your dashboard and click "Add full hostel" or "List a room" for a quick single-room listing. Submit for review — listings go live within 24 hours.',
      },
      {
        q: 'Is it free to list?',
        padding: '1rem 1.25rem',
        a: 'Yes, listing on Homestead is completely free. We charge students a GHS 50 viewing fee, not landlords.',
      },
      {
        q: 'How do I get notified when a student books?',
        padding: '1rem 1.25rem',
        a: 'You\'ll receive a WhatsApp message from our admin team asking you to confirm availability. Once confirmed, we release your number to the student.',
      },
    ],
  },
  {
    section: 'Payments & refunds',
    id: 'payments',
    items: [
      {
        q: 'What payment methods are accepted?',
        padding: '1rem 1.25rem',
        a: 'We accept all major cards and mobile money through Paystack, Ghana\'s leading payment processor.',
      },
      {
        q: 'Is my payment secure?',
        padding: '1rem 1.25rem',
        a: 'Yes. All payments are processed by Paystack (PCI-DSS compliant). We never store your card details.',
      },
      {
        q: 'How long do refunds take?',
        padding: '1rem 1.25rem',
        a: 'Refunds are processed within 3–5 business days after approval.',
      },
    ],
  },
];

function FAQ({ q, a, padding }: { q: string; a: string; padding?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="faq-item" style={{ padding }}>
      <button
        onClick={() => setOpen(!open)}
        className="faq-btn"
      >
        <span>{q}</span>
        {open
          ? <ChevronUp size={18} />
          : <ChevronDown size={18} />}
      </button>
      {open && (
        <div className="faq-body">
          <p>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="help-page">
      <Navbar />

      <div className="help-hero">
        <div className="help-hero-inner">
          <span>💬</span>
          <h1>Help &amp; FAQ</h1>
          <p>
            Find answers to the most common questions about Homestead.
          </p>
        </div>
      </div>

      <div className="faq-list">
        {FAQS.map(({ section, id, items }) => (
          <div key={section} id={id} className="faq-section">
            <h2 className="faq-section-title">
              {section}
            </h2>
            {items.map(({ q, a }) => <FAQ key={q} q={q} a={a} />)}
          </div>
        ))}

        <div id="contact" className="contact-block">
          <h2>Still need help?</h2>
          <p>
            Our team is available Monday–Friday, 8am–6pm. We typically respond within a few hours.
          </p>
          <div className="contact-actions">
            <a href="mailto:support@Homestead.com" className="support-link email-link">
              Email support →
            </a>
            <Link href="/bookings" className="support-link bookings-link">
              View my bookings
            </Link>
          </div>
        </div>
      </div>

      <Footer />

      <style jsx>{`
        .help-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #191970;
          color: #111827;
        }

        .help-hero {
          background: linear-gradient(135deg, #2563eb 0%, #60a5fa 100%);
          color: #fff;
          padding: 4rem 1.5rem;
          text-align: center;
        }

        .help-hero-inner {
          max-width: 720px;
          margin: 0 auto;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .help-hero span {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 3rem;
          height: 3rem;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 9999px;
          font-size: 1.5rem;
        }

        .help-hero h1 {
          margin: 0;
          font-size: 2.5rem;
        }

        .help-hero p {
          margin: 0;
          max-width: 640px;
          font-size: 1.05rem;
          opacity: 0.92;
        }

        .faq-list {
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
          padding: 3rem 1.5rem 4rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .faq-section,
        .contact-block {
          background: #fff;
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 1rem;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          padding: 1.75rem;
        }

        .faq-section {
          display: grid;
          gap: 1rem;
        }

        .faq-section-title {
          margin: 0 0 1rem;
          font-size: 1.5rem;
          color: #111827;
          background:#FFFFF0;
           border: 2px solid #808000;
          border-radius: 0.75rem;
          padding: 0.75rem 1.25rem;
          display: inline-block;
        }

        .faq-item {
          border: 1px solid rgba(148, 163, 184, 0.24);
          border-radius: 1rem;
          background: #ffffff;
          padding: 1rem 1.25rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .faq-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
          border-color: #2563eb;
          background: #f8fafc;
        }

        .faq-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          background: #fff;
          border: 1px solid rgba(148, 163, 184, 0.24);
          border-radius: 1rem;
          padding: 1rem 1.25rem;
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
        }

        .faq-btn:hover {
          background: #eff6ff;
          border-color: #2563eb;
          color: #2563eb;
        }

        .faq-item:hover .faq-btn {
          background: #eff6ff;
        }

        .faq-btn span {
          display: block;
          flex: 1;
          min-width: 0;
          font-weight: 600;
          font-size: 1rem;
          line-height: 1.5;
        }

        .faq-body {
          margin-top: 1rem;
          padding-left: 0.25rem;
          color: #4b5563;
          font-size: 0.98rem;
          line-height: 1.75;
        }

        .faq-body p {
          margin: 0;
        }

        a[aria-current="page"],
        .active-link {
          text-decoration: none;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 0.15rem;
        }

        .contact-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 1rem;
        }

        .support-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.85rem 1.25rem;
          border-radius: 0.75rem;
          text-decoration: none;
          font-weight: 600;
          transition: background 0.2s ease, color 0.2s ease;
        }

        .email-link {
          background: #2563eb;
          color: #fff;
        }

        .email-link:hover {
          background: #1d4ed8;
        }

        .bookings-link {
          background: #2563eb;
          color: #111827;
        }

        .bookings-link:hover {
          background: #FFFFF0;
        }
sss
        @media (min-width: 768px) {
          .help-hero {
            padding: 5rem 2rem;
          }

          .faq-list {
            padding: 3.5rem 2rem 4rem;
          }
        }
      `}</style>
    </div>
  );
}
