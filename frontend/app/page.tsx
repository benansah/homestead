'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HostelCard from '../components/HostelCard';
import {
  Search, ShieldCheck, Star, MapPin, ArrowRight,
  CheckCircle2, Loader2, BedDouble, Users, TrendingUp, Phone,
} from 'lucide-react';
import api from '../lib/api';
import { Hostel } from '../types';

const UNIVERSITIES = [
  { name: 'University of Ghana', short: 'UG',     location: 'Legon, Accra',  emoji: '🎓' },
  { name: 'KNUST',               short: 'KNUST',  location: 'Kumasi',        emoji: '⚙️' },
  { name: 'UCC',                 short: 'UCC',    location: 'Cape Coast',    emoji: '🌊' },
  { name: 'Univ. of Education',  short: 'UEW',    location: 'Winneba',       emoji: '📚' },
  { name: 'Ashesi University',   short: 'Ashesi', location: 'Berekuso',      emoji: '💡' },
];

const STEPS = [
  { n: '01', emoji: '🔍', title: 'Search',      desc: 'Browse verified hostels near your university. Filter by price, gender policy, and room type.' },
  { n: '02', emoji: '💳', title: 'Pay GHS 50',  desc: "Pay a small viewing fee. We verify availability with the landlord and release their contact to you." },
  { n: '03', emoji: '🏠', title: 'Move in',     desc: "Visit the hostel, confirm it's right for you, and secure your spot for the year." },
];

export default function Home() {
  const router = useRouter();
  const [university, setUniversity] = useState('');
  const [featured, setFeatured]     = useState<Hostel[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    api.get('/search')
      .then(r => setFeatured((r.data.hostels || []).slice(0, 4)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = university ? `?university=${encodeURIComponent(university)}` : '';
    router.push(`/hostels${q}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Navbar />

      {/* ══════════════════════════════════════════════════════
          HERO — 2-column on desktop
      ══════════════════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(150deg, #EBF3FF 0%, #DBEAFE 45%, #EDE9FE 100%)',
        padding: 'clamp(48px, 8vw, 96px) 20px clamp(56px, 9vw, 100px)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -80,  right: -80,  width: 380, height: 380, borderRadius: '50%', background: 'rgba(96,165,250,0.12)',  pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -40, width: 280, height: 280, borderRadius: '50%', background: 'rgba(167,139,250,0.10)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', left: '25%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(0,106,255,0.05)',   pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 52, alignItems: 'center', position: 'relative' }} className="r-2to1">

          {/* ── Left: copy + search ── */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 99, background: 'rgba(0,106,255,0.1)', fontSize: 12, fontWeight: 700, color: 'var(--blue)', marginBottom: 22 }}>
              🇬🇭 Ghana&apos;s #1 Student Hostel Platform
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 58px)',
              fontWeight: 900,
              color: '#0F172A',
              lineHeight: 1.1,
              letterSpacing: 'clamp(-1px, -0.03em, -2px)',
              fontFamily: 'Georgia, serif',
              marginBottom: 18,
            }}>
              Find your perfect<br />
              <span style={{ color: 'var(--blue)' }}>student home</span><br />
              in Ghana
            </h1>

            <p style={{ fontSize: 'clamp(15px, 2vw, 17px)', color: '#475569', lineHeight: 1.75, marginBottom: 32, maxWidth: 480 }}>
              Verified hostels near every university. Book a viewing for just{' '}
              <strong style={{ color: '#0F172A' }}>GHS 50</strong> — refunded if the room isn&apos;t available.
            </p>

            {/* Search card */}
            <form onSubmit={handleSearch} className="r-hero-search" style={{
              background: 'white',
              borderRadius: 18,
              padding: 8,
              boxShadow: '0 20px 60px rgba(0,0,0,0.14)',
              display: 'flex',
              border: '1px solid rgba(229,231,235,0.7)',
              marginBottom: 24,
            }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px' }}>
                <Search size={17} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                <select
                  value={university}
                  onChange={e => setUniversity(e.target.value)}
                  style={{ flex: 1, fontSize: 15, fontWeight: 500, background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', padding: '15px 0', color: university ? '#111827' : '#9CA3AF' }}>
                  <option value="">Search by university…</option>
                  {UNIVERSITIES.map(u => (
                    <option key={u.name} value={u.name}>{u.name} ({u.short})</option>
                  ))}
                </select>
              </div>
              <button type="submit"
                style={{ padding: '13px 26px', background: 'var(--blue)', color: 'white', borderRadius: 12, fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: 'var(--sh-blue)', transition: 'background 0.15s, transform 0.15s' }}
                onMouseEnter={e => { (e.currentTarget.style.background = 'var(--blue-dark)'); (e.currentTarget.style.transform = 'translateY(-1px)'); }}
                onMouseLeave={e => { (e.currentTarget.style.background = 'var(--blue)'); (e.currentTarget.style.transform = 'translateY(0)'); }}>
                Find hostels →
              </button>
            </form>

            {/* Trust chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
              {[
                ['✅', 'Verified listings'],
                ['🔒', 'Secure payments'],
                ['💰', 'GHS 50 fee'],
                ['📞', 'Direct contact'],
              ].map(([icon, label]) => (
                <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', fontWeight: 500 }}>
                  <span>{icon}</span>{label}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: floating preview cards ── */}
          <div className="r-hide-mobile" style={{ position: 'relative', height: 420 }}>
            {/* Main preview card */}
            <div style={{ position: 'absolute', top: 20, left: 20, right: 0, background: 'white', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.16)', overflow: 'hidden', border: '1px solid rgba(229,231,235,0.8)' }}>
              <div style={{ height: 180, background: 'linear-gradient(135deg, #1E3A5F 0%, #006AFF 100%)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BedDouble size={52} style={{ color: 'rgba(255,255,255,0.25)' }} />
                <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.95)', borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={10} /> Verified
                </div>
                <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: 'white', backdropFilter: 'blur(4px)' }}>
                  3 rooms left
                </div>
              </div>
              <div style={{ padding: '14px 16px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <p style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>GHS 1,800 <span style={{ fontSize: 12, fontWeight: 400, color: '#9CA3AF' }}>/yr</span></p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Star size={12} fill="#F59E0B" color="#F59E0B" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>4.8</span>
                  </div>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Premium Student Hostel</p>
                <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9CA3AF', marginBottom: 10 }}>
                  <MapPin size={11} /> East Legon, Accra
                </p>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: 'var(--blue-light)', color: 'var(--blue)' }}>
                  🎓 University of Ghana
                </span>
              </div>
            </div>

            {/* Floating badge */}
            <div style={{ position: 'absolute', bottom: 40, right: 12, background: 'white', borderRadius: 14, padding: '12px 16px', boxShadow: '0 12px 32px rgba(0,0,0,0.14)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} style={{ color: 'white' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', margin: 0 }}>Contact released!</p>
                <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>View confirmed today</p>
              </div>
            </div>

            {/* Stat chip */}
            <div style={{ position: 'absolute', top: 0, right: 30, background: 'white', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={14} style={{ color: 'var(--blue)' }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', margin: 0 }}>500+ students</p>
                <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0 }}>found homes this year</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--blue)', padding: '28px 20px' }}>
        <div className="r-stats" style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center', gap: 0 }}>
          {[
            { n: '500+',    l: 'Verified rooms',     icon: <BedDouble size={18} style={{ color: 'rgba(255,255,255,0.8)' }} /> },
            { n: '5',       l: 'Universities',        icon: <span style={{ fontSize: 18 }}>🎓</span> },
            { n: 'GHS 50',  l: 'Viewing fee',         icon: <TrendingUp size={18} style={{ color: 'rgba(255,255,255,0.8)' }} /> },
            { n: '100%',    l: 'Refund guarantee',    icon: <ShieldCheck size={18} style={{ color: 'rgba(255,255,255,0.8)' }} /> },
          ].map(({ n, l, icon }, i) => (
            <div key={i} style={{ padding: '8px 12px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.18)' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              {icon}
              <p style={{ fontSize: 'clamp(20px, 3.5vw, 28px)', fontWeight: 900, color: 'white', lineHeight: 1 }}>{n}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(52px, 7vw, 88px) 20px', background: 'white' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px, 5vw, 56px)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Simple process</p>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-1px', fontFamily: 'Georgia,serif' }}>How it works</h2>
          </div>

          <div className="r-3to1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {STEPS.map(({ n, emoji, title, desc }, i) => (
              <div key={n} style={{ position: 'relative' }}>
                {i < 2 && (
                  <div className="r-connector" style={{ position: 'absolute', top: 28, left: 'calc(100% - 12px)', width: 24, height: 2, background: 'linear-gradient(to right, var(--blue-mid), var(--blue-mid))', zIndex: 0 }} />
                )}
                <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid var(--border)', padding: 'clamp(22px, 3vw, 28px)', height: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s, transform 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,106,255,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--blue-mid)', flexShrink: 0 }}>
                      <span style={{ fontSize: 24 }}>{emoji}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#CBD5E1', letterSpacing: '0.05em' }}>{n}</span>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>{title}</h3>
                  <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.75 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURED HOSTELS
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(48px, 7vw, 80px) 20px', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 'clamp(24px, 4vw, 36px)', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Featured</p>
              <h2 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-1px', fontFamily: 'Georgia,serif' }}>Top-rated hostels</h2>
            </div>
            <Link href="/hostels" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 700, color: 'var(--blue)', textDecoration: 'none', whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: 99, background: 'var(--blue-light)' }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 20 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div className="shimmer" style={{ height: 200 }} />
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="shimmer" style={{ height: 20, borderRadius: 6, width: '60%' }} />
                    <div className="shimmer" style={{ height: 14, borderRadius: 6, width: '80%' }} />
                    <div className="shimmer" style={{ height: 14, borderRadius: 6, width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
              {featured.map(h => <HostelCard key={h.id} hostel={h} />)}
            </div>
          ) : null}

          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Link href="/hostels" className="btn btn-primary btn-lg">
              Browse all hostels
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          UNIVERSITIES — infinite ticker
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(48px, 7vw, 80px) 0', background: 'white', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 4vw, 36px)', padding: '0 20px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>We cover</p>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-1px', fontFamily: 'Georgia,serif' }}>
            Every major university
          </h2>
        </div>

        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...UNIVERSITIES, ...UNIVERSITIES].map((u, i) => (
              <Link key={i} href={`/hostels?university=${encodeURIComponent(u.name)}`}
                style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, width: 192, margin: '0 8px', padding: '18px 16px', borderRadius: 16, border: '1.5px solid var(--border)', background: 'white', textDecoration: 'none', transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--blue)'; el.style.background = 'var(--blue-light)'; el.style.boxShadow = '0 8px 24px rgba(0,106,255,0.15)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.background = 'white'; el.style.boxShadow = 'none'; }}>
                <span style={{ fontSize: 30, marginBottom: 10 }}>{u.emoji}</span>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 3 }}>{u.short}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 4 }}>{u.name}</p>
                <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94A3B8' }}>
                  <MapPin size={10} style={{ flexShrink: 0 }} />{u.location}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 'clamp(20px, 3vw, 28px)', padding: '0 20px' }}>
          <Link href="/hostels" style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            Browse near your university <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOR LANDLORDS
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(52px, 8vw, 80px) 20px', background: 'linear-gradient(135deg, #0F172A 0%, #1a2e4a 100%)' }}>
        <div className="r-2to1" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>

          {/* Left: copy */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>For landlords</p>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, color: 'white', letterSpacing: '-1px', fontFamily: 'Georgia,serif', marginBottom: 16, lineHeight: 1.2 }}>
              Reach thousands of students looking for accommodation
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, marginBottom: 28 }}>
              List your hostel for free. We verify your property and connect you with genuine students ready to move in.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {[
                'Free to list — no upfront cost',
                'Students pay GHS 50 viewing fee',
                'We verify students before contact',
                'WhatsApp alerts for new bookings',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle2 size={16} style={{ color: '#34D399', flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{item}</span>
                </div>
              ))}
            </div>
            <Link href="/register" className="btn btn-primary btn-lg">
              List your hostel free →
            </Link>
          </div>

          {/* Right: feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { icon: '🏠', title: 'Free listing',    desc: 'No cost to join the platform' },
              { icon: '📱', title: 'WhatsApp alerts', desc: 'Instant booking notifications' },
              { icon: '✅', title: 'Verified only',   desc: 'We screen every student' },
              { icon: '💰', title: 'Guaranteed fee',  desc: 'Students pay before contact' },
            ].map(({ icon, title, desc }) => (
              <div key={title}
                style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 16px', border: '1px solid rgba(255,255,255,0.1)', transition: 'background 0.15s' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)')}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 10 }}>{icon}</span>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 4 }}>{title}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHY STUDENTS TRUST US
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(48px, 7vw, 80px) 20px', background: 'white' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Trust</p>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-1px', fontFamily: 'Georgia,serif', marginBottom: 14 }}>
            Why students trust Homestead
          </h2>
          <p style={{ fontSize: 15, color: '#64748B', marginBottom: 'clamp(32px, 5vw, 52px)', maxWidth: 480, margin: '0 auto clamp(32px, 5vw, 52px)' }}>
            Built specifically for Ghanaian students — we understand the challenges of finding safe, affordable accommodation.
          </p>
          <div className="r-3to1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { icon: <ShieldCheck size={24} style={{ color: 'var(--blue)' }} />,  bg: 'var(--blue-light)',  title: 'Verified listings', desc: 'Every hostel is manually reviewed and verified before going live on the platform.' },
              { icon: <Star size={24} style={{ color: '#F59E0B' }} />,              bg: '#FFF9EB',            title: 'Student reviews',  desc: 'Read honest reviews from students who have visited and stayed at these hostels.' },
              { icon: <CheckCircle2 size={24} style={{ color: '#10B981' }} />,      bg: '#ECFDF5',           title: 'Safe payments',    desc: 'Pay securely via Paystack. Full refund guaranteed if the room is unavailable.' },
            ].map(({ icon, bg, title, desc }) => (
              <div key={title}
                style={{ padding: 'clamp(22px, 3vw, 30px)', borderRadius: 20, border: '1.5px solid var(--border)', textAlign: 'left', transition: 'box-shadow 0.2s, transform 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  {icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.75 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* last Call to action */}
      <section style={{ padding: 'clamp(52px, 8vw, 80px) 20px', background: 'linear-gradient(150deg, #EBF3FF 0%, #DBEAFE 60%, #EDE9FE 100%)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(96,165,250,0.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(167,139,250,0.10)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 99, background: 'rgba(0,106,255,0.1)', fontSize: 12, fontWeight: 700, color: 'var(--blue)', marginBottom: 20 }}>
            <Phone size={12} /> Join 500+ students who found their home
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 4.5vw, 40px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-1px', fontFamily: 'Georgia,serif', marginBottom: 14 }}>
            Ready to find your home?
          </h2>
          <p style={{ fontSize: 15, color: '#475569', marginBottom: 32, lineHeight: 1.75 }}>
            Join thousands of students who found their hostel through Homestead. It takes less than 2 minutes.
          </p>
          <div className="cta-btns" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
            <Link href="/hostels" className="btn btn-primary btn-lg" style={{ minWidth: 200, justifyContent: 'center' }}>
              Browse hostels →
            </Link>
            <Link href="/register" className="btn btn-secondary btn-lg" style={{ minWidth: 200, justifyContent: 'center' }}>
              Create free account
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
