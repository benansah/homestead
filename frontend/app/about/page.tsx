'use client';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { Users, ShieldCheck, MapPin, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Navbar />

      {/* Hero */}
      <div className="static-hero" style={{ background: 'linear-gradient(135deg, #EBF3FF 0%, #EDE9FE 100%)', padding: 'clamp(48px,8vw,96px) 20px clamp(40px,7vw,80px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <span className="emoji" style={{ fontSize: 'clamp(44px,10vw,64px)', display: 'block', marginBottom: 20 }}>🏠</span>
          <h1 style={{ fontSize: 'clamp(28px,6vw,56px)', fontWeight: 900, color: '#0F172A', letterSpacing: 'clamp(-1px,-0.03em,-2px)', fontFamily: 'Georgia,serif', marginBottom: 20, lineHeight: 1.1 }}>
            About Homestead
          </h1>
          <p style={{ fontSize: 'clamp(15px,2.5vw,20px)', color: '#475569', lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
            We&apos;re on a mission to make finding student accommodation in Ghana fair, transparent, and stress-free.
          </p>
        </div>
      </div>

      {/* Story */}
      <section className="static-section" style={{ padding: 'clamp(40px,7vw,80px) 20px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2 className="static-section" style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 900, color: '#0F172A', marginBottom: 24, fontFamily: 'Georgia,serif' }}>Our story</h2>
          {[
            'Every year, thousands of Ghanaian students arrive at university with no idea where they\'ll sleep. The hostel market is fragmented, filled with false listings, and dominated by word-of-mouth that doesn\'t reach everyone equally — especially students from outside the city.',
            'Homestead was built to fix that. We created a single, trusted platform where every listing is verified, every landlord is accountable, and every student has an equal shot at finding a great home — regardless of where they\'re from.',
            'We charge students GHS 50 to get a landlord\'s contact — a small fee that ensures only serious renters reach landlords, and that students get a refund if the room turns out to be unavailable.',
          ].map((text, i) => (
            <p key={i} className="static-body-text" style={{ fontSize: 'clamp(15px,2vw,18px)', color: '#475569', lineHeight: 1.85, marginBottom: 20 }}>{text}</p>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="static-section" style={{ padding: 'clamp(36px,6vw,72px) 20px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 900, color: '#0F172A', marginBottom: 'clamp(28px,5vw,48px)', textAlign: 'center', fontFamily: 'Georgia,serif' }}>
            What we stand for
          </h2>
          <div className="values-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20, transition: 'transform 200ms ease, box-shadow 200ms ease' }}>
            {[
              { icon: <ShieldCheck size={26} style={{ color: 'var(--blue)' }} />,  title: 'Transparency',   desc: 'Every listing is manually verified. No fake rooms, no ghost landlords.' },
              { icon: <Users size={26} style={{ color: '#8B5CF6' }} />,            title: 'Accessibility',  desc: 'Equal access for every student, regardless of background or connections.' },
              { icon: <Heart size={26} style={{ color: '#EF4444' }} />,            title: 'Student-first',  desc: 'Every decision prioritises student safety and affordability.' },
              { icon: <MapPin size={26} style={{ color: '#10B981' }} />,           title: 'Local focus',    desc: 'Built for Ghana, by people who understand Ghanaian universities.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="value-card">
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>{icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section style={{ padding: 'clamp(36px,6vw,72px) 20px', background: 'var(--blue)', textAlign: 'center' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 900, color: 'white', marginBottom: 'clamp(28px,5vw,48px)', fontFamily: 'Georgia,serif' }}>
            Homestead by the numbers
          </h2>
          <div className="r-stats r-about-numbers" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[['500+', 'Verified rooms'], ['5', 'Universities covered'], ['GHS 50', 'Viewing fee'], ['100%', 'Refund if unavailable']].map(([n, l], i) => (
              <div key={i} style={{ padding: '16px 12px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
                <p style={{ fontSize: 'clamp(24px,5vw,40px)', fontWeight: 900, color: 'white', lineHeight: 1, marginBottom: 8 }}>{n}</p>
                <p style={{ fontSize: 'clamp(12px,1.5vw,16px)', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'clamp(44px,7vw,80px) 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(22px,4vw,40px)', fontWeight: 900, color: '#0F172A', marginBottom: 16, fontFamily: 'Georgia,serif' }}>Join the community</h2>
        <p style={{ fontSize: 'clamp(14px,2vw,18px)', color: '#64748B', marginBottom: 32 }}>Find your hostel or list your property today.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/hostels" className="btn btn-primary btn-lg">Browse hostels</Link>
          <Link href="/register" className="btn btn-secondary btn-lg">Create account</Link>
        </div>
      </section>

      <style jsx>{`
        .value-card {
          background: white;
          border-radius: 18px;
          padding: clamp(20px, 3vw, 28px);
          border: 1px solid var(--border);
          box-shadow: var(--sh-sm);
          transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
        }

        .value-card:hover {
          transform: translateY(-6px);
          border-color: rgba(59, 130, 246, 0.25);
          box-shadow: 0 22px 45px rgba(15, 23, 42, 0.12);
        }
      `}</style>

      <Footer />
    </div>
  );
}
