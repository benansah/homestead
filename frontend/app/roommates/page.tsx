'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Loader2, Users, UserCheck, Send, Inbox,
  Check, X, UserPlus, Settings, Moon, Sun,
  BookOpen, Sparkles, Home
} from 'lucide-react';
import Link from 'next/link';
import { RoommateMatch, RoommateRequest, RoommateProfile } from '../../types';

const LABEL: Record<string, string> = {
  early_bird: 'Early bird', night_owl: 'Night owl', flexible: 'Flexible',
  quiet: 'Needs quiet', noise_ok: 'Noise OK',
  very_tidy: 'Very tidy', moderate: 'Moderate', relaxed: 'Relaxed',
  frequent: 'Frequent guests', occasional: 'Occasional guests', never: 'Rarely has guests',
  same: 'Same gender', any: 'Any gender',
};

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? '#22C55E' : score >= 50 ? 'var(--blue)' : '#F59E0B';
  return (
    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full border-4"
      style={{ borderColor: color }}>
      <span className="text-lg font-black" style={{ color }}>{score}%</span>
    </div>
  );
}

function MatchCard({
  match, onRequest,
}: {
  match: RoommateMatch;
  onRequest: (userId: number) => void;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 flex gap-4 items-start"
      style={{ border: '1px solid var(--border)' }}>
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full flex items-center justify-center
                      text-white text-lg font-bold shrink-0"
        style={{ background: 'var(--blue)' }}>
        {match.fullname[0]?.toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-gray-900">{match.fullname}</p>
            {match.university && (
              <p className="text-xs text-gray-500">🎓 {match.university}</p>
            )}
          </div>
          <ScoreRing score={match.compatibility_score} />
        </div>

        {/* Traits */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {[
            LABEL[match.sleep_schedule],
            LABEL[match.study_habits],
            LABEL[match.cleanliness],
            LABEL[match.guests],
          ].map(trait => (
            <span key={trait}
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
              {trait}
            </span>
          ))}
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
            {match.gender}
          </span>
        </div>

        {match.bio && (
          <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-2">{match.bio}</p>
        )}

        <button
          onClick={() => onRequest(match.user_id)}
          className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm
                     font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: 'var(--blue)' }}>
          <UserPlus size={14} /> Send request
        </button>
      </div>
    </div>
  );
}

function RequestCard({
  request, type, onRespond,
}: {
  request: RoommateRequest;
  type: 'incoming' | 'outgoing';
  onRespond?: (id: number, action: 'accepted' | 'rejected') => void;
}) {
  const name = type === 'incoming' ? request.sender_name : request.receiver_name;
  const university = type === 'incoming' ? request.sender_university : request.receiver_university;

  const statusColor: Record<string, string> = {
    pending: '#F59E0B', accepted: '#22C55E', rejected: '#EF4444',
  };

  return (
    <div className="bg-white rounded-2xl p-4 flex items-start gap-4"
      style={{ border: '1px solid var(--border)' }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center
                      text-white font-bold shrink-0"
        style={{ background: 'var(--blue)' }}>
        {name?.[0]?.toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-gray-900 text-sm">{name}</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
            style={{
              background: `${statusColor[request.status]}20`,
              color: statusColor[request.status],
            }}>
            {request.status}
          </span>
        </div>
        {university && <p className="text-xs text-gray-500">🎓 {university}</p>}
        {request.hostel_name && (
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <Home size={10} /> {request.hostel_name}
          </p>
        )}

        {/* Traits */}
        {request.sleep_schedule && (
          <div className="flex flex-wrap gap-1 mt-2">
            {[
              LABEL[request.sleep_schedule!],
              LABEL[request.study_habits!],
              LABEL[request.cleanliness!],
              LABEL[request.guests!],
            ].map(t => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Actions for incoming pending */}
        {type === 'incoming' && request.status === 'pending' && onRespond && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onRespond(request.id, 'accepted')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold
                         text-white hover:opacity-90 transition-opacity"
              style={{ background: '#22C55E' }}>
              <Check size={12} /> Accept
            </button>
            <button
              onClick={() => onRespond(request.id, 'rejected')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold
                         border text-red-500 hover:bg-red-50 transition-colors"
              style={{ borderColor: '#FCA5A5' }}>
              <X size={12} /> Decline
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoommatesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hostelId = searchParams.get('hostel_id');

  const [tab, setTab] = useState<'matches' | 'requests'>('matches');
  const [profile, setProfile] = useState<RoommateProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [matches, setMatches] = useState<RoommateMatch[]>([]);
  const [matchScope, setMatchScope] = useState<'hostel' | 'platform'>('platform');
  const [matchesLoading, setMatchesLoading] = useState(false);

  const [incoming, setIncoming] = useState<RoommateRequest[]>([]);
  const [outgoing, setOutgoing] = useState<RoommateRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'student') { router.push('/'); return; }

    const loadProfile = async () => {
      try {
        const res = await api.get('/roommates/profile');
        setProfile(res.data);
      } catch {
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, [user, router]);

  useEffect(() => {
    if (!profile || !profile.is_active) return;
    const loadMatches = async () => {
      setMatchesLoading(true);
      try {
        const params = hostelId ? `?hostel_id=${hostelId}` : '';
        const res = await api.get(`/roommates/matches${params}`);
        setMatches(res.data.matches || []);
        setMatchScope(res.data.scope);
      } catch {
        toast.error('Failed to load matches');
      } finally {
        setMatchesLoading(false);
      }
    };
    loadMatches();
  }, [profile, hostelId]);

  useEffect(() => {
    if (!profile || !profile.is_active || tab !== 'requests') return;
    const loadRequests = async () => {
      setRequestsLoading(true);
      try {
        const res = await api.get('/roommates/requests');
        setIncoming(res.data.incoming || []);
        setOutgoing(res.data.outgoing || []);
      } catch {
        toast.error('Failed to load requests');
      } finally {
        setRequestsLoading(false);
      }
    };
    loadRequests();
  }, [profile, tab]);

  const handleSendRequest = async (receiver_id: number) => {
    try {
      await api.post('/roommates/request', {
        receiver_id,
        hostel_id: hostelId ? Number(hostelId) : undefined,
      });
      toast.success('Request sent!');
      setMatches(prev => prev.filter(m => m.user_id !== receiver_id));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send request');
    }
  };

  const handleRespond = async (id: number, action: 'accepted' | 'rejected') => {
    try {
      await api.patch(`/roommates/request/${id}`, { action });
      toast.success(action === 'accepted' ? 'Accepted! Check your notifications for their contact.' : 'Request declined');
      setIncoming(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to respond');
    }
  };

  const pendingCount = incoming.filter(r => r.status === 'pending').length;

  if (profileLoading) return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    </div>
  );

  // No profile state
  if (!profile || !profile.is_active) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--blue-light)' }}>
          <Users size={36} style={{ color: 'var(--blue)' }} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Find your roommate</h1>
        <p className="text-gray-500 text-sm mb-8">
          Set up your lifestyle profile and we'll match you with compatible students
          {hostelId ? ' at this hostel' : ' across the platform'}.
        </p>
        <Link href="/roommates/profile"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white
                     font-bold text-sm hover:opacity-90 transition-opacity"
          style={{ background: 'var(--blue)' }}>
          <UserCheck size={16} /> Set up my profile
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roommate matching</h1>
            <p className="text-sm text-gray-500">
              {hostelId
                ? `Showing ${matchScope === 'hostel' ? 'students at this hostel' : 'platform-wide matches (no hostel matches found)'}`
                : 'Platform-wide matches'}
            </p>
          </div>
          <Link href="/roommates/profile"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm
                       font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'var(--border)' }}>
            <Settings size={14} /> Edit profile
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6"
          style={{ background: '#F3F4F6' }}>
          {[
            { key: 'matches', label: 'Matches', icon: <Sparkles size={14} /> },
            { key: 'requests', label: `Requests${pendingCount > 0 ? ` (${pendingCount})` : ''}`, icon: <Inbox size={14} /> },
          ].map(t => (
            <button key={t.key}
              onClick={() => setTab(t.key as 'matches' | 'requests')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
                         text-sm font-semibold transition-all"
              style={{
                background: tab === t.key ? '#fff' : 'transparent',
                color: tab === t.key ? 'var(--blue)' : '#6B7280',
                boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Matches tab */}
        {tab === 'matches' && (
          <>
            {matchesLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 size={24} className="animate-spin text-blue-500" />
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No matches found yet</p>
                <p className="text-sm mt-1">More students joining the platform will improve your matches</p>
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map(match => (
                  <MatchCard key={match.user_id} match={match} onRequest={handleSendRequest} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Requests tab */}
        {tab === 'requests' && (
          <div className="space-y-6">
            {/* Incoming */}
            <div>
              <h2 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-1.5">
                <Inbox size={15} /> Incoming requests
              </h2>
              {requestsLoading ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 size={20} className="animate-spin text-blue-500" />
                </div>
              ) : incoming.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No incoming requests</p>
              ) : (
                <div className="space-y-3">
                  {incoming.map(r => (
                    <RequestCard key={r.id} request={r} type="incoming" onRespond={handleRespond} />
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing */}
            <div>
              <h2 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-1.5">
                <Send size={15} /> Sent requests
              </h2>
              {outgoing.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No sent requests yet</p>
              ) : (
                <div className="space-y-3">
                  {outgoing.map(r => (
                    <RequestCard key={r.id} request={r} type="outgoing" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
