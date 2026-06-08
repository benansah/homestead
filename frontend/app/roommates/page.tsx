'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Loader2, Users, UserCheck, Send, Inbox,
  Check, X, UserPlus, Settings, Home, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { RoommateMatch, RoommateRequest, RoommateProfile } from '../../types';

const LABEL: Record<string, string> = {
  early_bird: '🌅 Early bird',  night_owl: '🦉 Night owl',        flexible: '⚡ Flexible',
  quiet:      '🤫 Quiet study', noise_ok: '🎵 Noise OK',
  very_tidy:  '✨ Very tidy',   moderate: '👍 Moderate',           relaxed: '😌 Relaxed',
  frequent:   '🎉 Frequent guests', occasional: '🙂 Occasional', never: '🔒 Rarely guests',
  same: '👥 Same gender',       any: '🌍 Any gender',
};

const GRAD_PAIRS = [
  ['#006AFF', '#8B5CF6'],
  ['#10B981', '#06B6D4'],
  ['#F59E0B', '#EF4444'],
  ['#8B5CF6', '#EC4899'],
];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function ScoreBadge({ score }: { score: number }) {
  const isGreen = score >= 75;
  const isBlue  = score >= 50 && score < 75;
  const color  = isGreen ? '#16A34A' : isBlue ? 'var(--blue)' : '#D97706';
  const bg     = isGreen ? '#DCFCE7' : isBlue ? 'var(--blue-light)' : '#FFFBEB';
  const border = isGreen ? '#86EFAC' : isBlue ? '#BFDBFE'            : '#FDE68A';
  return (
    <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 12,
      padding: '6px 12px', textAlign: 'center', flexShrink: 0 }}>
      <p style={{ fontSize: 20, fontWeight: 900, color, lineHeight: 1 }}>{score}%</p>
      <p style={{ fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>match</p>
    </div>
  );
}

function MatchCard({ match, onRequest }: { match: RoommateMatch; onRequest: (id: number) => void }) {
  const grad   = GRAD_PAIRS[match.user_id % 4];
  const traits = [LABEL[match.sleep_schedule], LABEL[match.study_habits], LABEL[match.cleanliness], LABEL[match.guests]].filter(Boolean);

  return (
    <div style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', padding: '20px', boxShadow: 'var(--sh-sm)' }}>
      {/* Avatar + name + score */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 18, fontWeight: 800,
          boxShadow: '0 2px 10px rgba(0,0,0,0.18)' }}>
          {getInitials(match.fullname)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 4, lineHeight: 1.3 }}>{match.fullname}</p>
          {match.university && (
            <span style={{ fontSize: 12, color: '#64748B', background: 'var(--surface)',
              borderRadius: 99, padding: '2px 8px', display: 'inline-block' }}>
              🎓 {match.university}
            </span>
          )}
        </div>
        <ScoreBadge score={match.compatibility_score} />
      </div>

      {/* Trait chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: match.bio ? 10 : 16 }}>
        {traits.map(t => (
          <span key={t} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, fontWeight: 600,
            background: 'var(--blue-light)', color: 'var(--blue)' }}>{t}</span>
        ))}
        <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, fontWeight: 600,
          background: '#F3F4F6', color: '#6B7280' }}>{match.gender}</span>
      </div>

      {match.bio && (
        <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.65, marginBottom: 16,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as 'vertical', overflow: 'hidden' }}>
          &ldquo;{match.bio}&rdquo;
        </p>
      )}

      <button onClick={() => onRequest(match.user_id)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '12px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 12,
          fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--sh-blue)', transition: 'opacity 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
        <UserPlus size={15} /> Send request
      </button>
      {match.university && (
        <Link href={`/hostels?university=${encodeURIComponent(match.university)}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8,
            fontSize: 13, fontWeight: 600, color: '#64748B', textDecoration: 'none' }}>
          <Home size={13} /> Find hostels at {match.university} →
        </Link>
      )}
    </div>
  );
}

function RequestCard({ request, type, onRespond }: {
  request: RoommateRequest;
  type: 'incoming' | 'outgoing';
  onRespond?: (id: number, action: 'accepted' | 'rejected') => void;
}) {
  const name       = type === 'incoming' ? request.sender_name     : request.receiver_name;
  const university = type === 'incoming' ? request.sender_university : request.receiver_university;
  const initials   = name ? getInitials(name) : '?';

  const STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
    pending:  { label: 'Pending',  color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    accepted: { label: 'Accepted', color: '#16A34A', bg: '#DCFCE7', border: '#86EFAC' },
    rejected: { label: 'Declined', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  };
  const st = STATUS[request.status] ?? STATUS.pending;
  const traits = request.sleep_schedule
    ? [LABEL[request.sleep_schedule!], LABEL[request.study_habits!], LABEL[request.cleanliness!], LABEL[request.guests!]].filter(Boolean)
    : [];

  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: '16px 18px', boxShadow: 'var(--sh-sm)' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--blue), #8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 800, fontSize: 16 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>{name}</p>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
              background: st.bg, color: st.color, border: `1px solid ${st.border}`, flexShrink: 0 }}>
              {st.label}
            </span>
          </div>
          {university && <p style={{ fontSize: 12, color: '#64748B', marginBottom: 3 }}>🎓 {university}</p>}
          {request.hostel_name && (
            <p style={{ fontSize: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <Home size={11} /> {request.hostel_name}
            </p>
          )}
          {traits.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {traits.map(t => (
                <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: '#F3F4F6', color: '#6B7280' }}>{t}</span>
              ))}
            </div>
          )}
          {type === 'incoming' && request.status === 'pending' && onRespond && (
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={() => onRespond(request.id, 'accepted')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px', background: '#16A34A', color: 'white', border: 'none', borderRadius: 10,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <Check size={14} /> Accept
              </button>
              <button onClick={() => onRespond(request.id, 'rejected')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px', background: 'white', color: '#DC2626', border: '1.5px solid #FECACA',
                  borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <X size={14} /> Decline
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RoommatesContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hostelId = searchParams.get('hostel_id');

  const [tab, setTab] = useState<'matches' | 'requests'>('matches');
  const [profile, setProfile] = useState<RoommateProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [matches, setMatches]         = useState<RoommateMatch[]>([]);
  const [matchScope, setMatchScope]   = useState<'hostel' | 'platform'>('platform');
  const [matchesLoading, setMatchesLoading] = useState(false);

  const [incoming, setIncoming]               = useState<RoommateRequest[]>([]);
  const [outgoing, setOutgoing]               = useState<RoommateRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'student') { router.push('/'); return; }
    api.get('/roommates/profile')
      .then(r => setProfile(r.data))
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!profile?.is_active) return;
    setMatchesLoading(true);
    const params = hostelId ? `?hostel_id=${hostelId}` : '';
    api.get(`/roommates/matches${params}`)
      .then(r => { setMatches(r.data.matches || []); setMatchScope(r.data.scope); })
      .catch(() => toast.error('Failed to load matches'))
      .finally(() => setMatchesLoading(false));
  }, [profile, hostelId]);

  useEffect(() => {
    if (!profile?.is_active || tab !== 'requests') return;
    setRequestsLoading(true);
    api.get('/roommates/requests')
      .then(r => { setIncoming(r.data.incoming || []); setOutgoing(r.data.outgoing || []); })
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setRequestsLoading(false));
  }, [profile, tab]);

  const handleSendRequest = async (receiver_id: number) => {
    try {
      await api.post('/roommates/request', { receiver_id, hostel_id: hostelId ? Number(hostelId) : undefined });
      toast.success('Request sent!');
      setMatches(prev => prev.filter(m => m.user_id !== receiver_id));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send request');
    }
  };

  const handleRespond = async (id: number, action: 'accepted' | 'rejected') => {
    try {
      await api.patch(`/roommates/request/${id}`, { action });
      toast.success(action === 'accepted' ? 'Accepted!' : 'Request declined');
      setIncoming(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to respond');
    }
  };

  const pendingCount = incoming.filter(r => r.status === 'pending').length;

  /* ── Loading ── */
  if (authLoading || profileLoading) return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Loader2 size={32} style={{ color: 'var(--blue)' }} className="animate-spin" />
      </div>
    </div>
  );

  /* ── No profile ── */
  if (!profile || !profile.is_active) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #EBF3FF 0%, #EDE9FE 100%)', padding: 'clamp(48px,8vw,80px) 20px clamp(40px,7vw,64px)', textAlign: 'center', borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: 'var(--sh-md)' }}>
            <Users size={38} style={{ color: 'var(--blue)' }} />
          </div>
          <h1 style={{ fontSize: 'clamp(26px,5vw,44px)', fontWeight: 900, color: '#0F172A', letterSpacing: 'clamp(-0.5px,-0.03em,-1.5px)', fontFamily: 'Georgia,serif', marginBottom: 16 }}>
            Find your perfect roommate
          </h1>
          <p style={{ fontSize: 'clamp(15px,2.5vw,18px)', color: '#475569', lineHeight: 1.75, marginBottom: 32 }}>
            Tell us about your lifestyle and we&apos;ll match you with compatible students
            {hostelId ? ' at this hostel' : ' across the platform'}.
          </p>
          <Link href="/roommates/profile"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 32px', borderRadius: 14, background: 'var(--blue)', color: 'white', fontWeight: 700, fontSize: 17, textDecoration: 'none', boxShadow: 'var(--sh-blue)' }}>
            <UserCheck size={20} /> Set up my profile →
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(36px,6vw,60px) 20px clamp(48px,7vw,80px)' }}>
        <h2 style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, color: '#0F172A', textAlign: 'center', marginBottom: 28, fontFamily: 'Georgia,serif' }}>
          How it works
        </h2>
        <div className="r-3to1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { icon: <UserCheck size={22} style={{ color: 'var(--blue)' }} />,   step: '1', title: 'Set up your profile', desc: 'Share your sleep schedule, study habits, and lifestyle preferences.',                                   bg: 'var(--blue-light)' },
            { icon: <Sparkles   size={22} style={{ color: '#8B5CF6' }} />,       step: '2', title: 'Get matched',          desc: 'Our algorithm finds students with compatible habits and a similar lifestyle.',                        bg: '#EDE9FE' },
            { icon: <Send       size={22} style={{ color: '#10B981' }} />,       step: '3', title: 'Connect',              desc: 'Send a request and, when accepted, exchange contacts to arrange a viewing together.', bg: '#DCFCE7' },
          ].map(({ icon, step, title, desc, bg }) => (
            <div key={step} style={{ background: 'white', borderRadius: 18, padding: 'clamp(20px,3vw,28px)', border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)', textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>{icon}</div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Step {step}</p>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── Main view ── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />

      {/* Hero header */}
      <div style={{ background: 'linear-gradient(135deg, #EBF3FF 0%, #EDE9FE 100%)', borderBottom: '1px solid rgba(99,102,241,0.12)', padding: 'clamp(22px,4vw,36px) 20px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--sh-blue)', flexShrink: 0 }}>
              <Users size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 'clamp(18px,3vw,24px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.4px', lineHeight: 1.2 }}>
                Roommate matching
              </h1>
              <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                {hostelId
                  ? (matchScope === 'hostel' ? 'Students at this hostel' : 'Platform-wide matches')
                  : (matches.length > 0 ? `${matches.length} compatible student${matches.length !== 1 ? 's' : ''} found` : 'Platform-wide matches')}
              </p>
            </div>
          </div>
          <Link href="/roommates/profile"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'white', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#374151', boxShadow: 'var(--sh-sm)', textDecoration: 'none' }}>
            <Settings size={14} /> Edit profile
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 20px', display: 'flex' }}>
          {[
            { key: 'matches',  label: 'Matches',  icon: <Sparkles size={14} />, badge: null },
            { key: 'requests', label: 'Requests', icon: <Inbox    size={14} />, badge: pendingCount > 0 ? pendingCount : null },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as 'matches' | 'requests')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 4px', marginRight: 28,
                fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'none',
                color: tab === t.key ? 'var(--blue)' : '#6B7280',
                borderBottom: `2px solid ${tab === t.key ? 'var(--blue)' : 'transparent'}`,
                transition: 'color 0.15s, border-color 0.15s' }}>
              {t.icon} {t.label}
              {t.badge !== null && (
                <span style={{ background: 'var(--blue)', color: 'white', borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(16px,3vw,28px) 20px 80px' }}>

        {/* Matches tab */}
        {tab === 'matches' && (
          matchesLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
              <Loader2 size={24} style={{ color: 'var(--blue)' }} className="animate-spin" />
            </div>
          ) : matches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'clamp(40px,8vw,72px) 20px' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Users size={32} style={{ color: 'var(--blue)', opacity: 0.5 }} />
              </div>
              <p style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>No matches found yet</p>
              <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 340, margin: '0 auto' }}>
                More students joining the platform will improve your matches. Check back soon!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {matches.map(match => (
                <MatchCard key={match.user_id} match={match} onRequest={handleSendRequest} />
              ))}
            </div>
          )
        )}

        {/* Requests tab */}
        {tab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Incoming */}
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Inbox size={14} /> Incoming requests
              </h2>
              {requestsLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80 }}>
                  <Loader2 size={20} style={{ color: 'var(--blue)' }} className="animate-spin" />
                </div>
              ) : incoming.length === 0 ? (
                <p style={{ fontSize: 14, color: '#94A3B8', padding: '20px', textAlign: 'center', background: 'white', borderRadius: 14, border: '1px solid var(--border)' }}>
                  No incoming requests yet
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {incoming.map(r => <RequestCard key={r.id} request={r} type="incoming" onRespond={handleRespond} />)}
                </div>
              )}
            </div>

            {/* Outgoing */}
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Send size={14} /> Sent requests
              </h2>
              {outgoing.length === 0 ? (
                <p style={{ fontSize: 14, color: '#94A3B8', padding: '20px', textAlign: 'center', background: 'white', borderRadius: 14, border: '1px solid var(--border)' }}>
                  No sent requests yet
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {outgoing.map(r => <RequestCard key={r.id} request={r} type="outgoing" />)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoommatesPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'white' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
          <Loader2 size={28} style={{ color: 'var(--blue)' }} className="animate-spin" />
        </div>
      </div>
    }>
      <RoommatesContent />
    </Suspense>
  );
}
