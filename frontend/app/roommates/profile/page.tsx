'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Loader2, Save, UserCheck, Trash2, ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';
import { RoommateProfile } from '../../../types';

const SLEEP_OPTIONS = [
  { value: 'early_bird', label: '🌅 Early bird',  desc: 'Up by 6 AM, in bed by 10 PM' },
  { value: 'night_owl',  label: '🦉 Night owl',   desc: 'Active late into the night' },
  { value: 'flexible',   label: '⚡ Flexible',     desc: 'No strong preference' },
];
const STUDY_OPTIONS = [
  { value: 'quiet',      label: '🤫 Needs quiet', desc: 'Silence when studying' },
  { value: 'noise_ok',   label: '🎵 Noise is fine',desc: 'Can focus with background noise' },
  { value: 'flexible',   label: '⚡ Flexible',     desc: 'No strong preference' },
];
const CLEAN_OPTIONS = [
  { value: 'very_tidy',  label: '✨ Very tidy',   desc: 'Everything in its place' },
  { value: 'moderate',   label: '👍 Moderate',    desc: 'Reasonably clean' },
  { value: 'relaxed',    label: '😌 Relaxed',     desc: 'Comfortable with some mess' },
];
const GUEST_OPTIONS = [
  { value: 'frequent',   label: '🎉 Frequent',    desc: 'Friends over most days' },
  { value: 'occasional', label: '🙂 Occasional',  desc: 'Guests once in a while' },
  { value: 'never',      label: '🔒 Rarely',      desc: 'Prefer to keep it private' },
];

function OptionPicker({ options, value, onChange }: {
  options: { value: string; label: string; desc: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="option-picker-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {options.map(opt => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
          style={{
            padding: '16px 12px', borderRadius: 14, textAlign: 'left', cursor: 'pointer',
            border: `2px solid ${value === opt.value ? 'var(--blue)' : 'var(--border)'}`,
            background: value === opt.value ? 'var(--blue-light)' : 'white',
            transition: 'all 0.15s',
          }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: value === opt.value ? 'var(--blue)' : '#0F172A', marginBottom: 4 }}>
            {opt.label}
          </p>
          <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.4 }}>{opt.desc}</p>
        </button>
      ))}
    </div>
  );
}

const Card = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <div style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', padding: '28px', boxShadow: 'var(--sh-sm)' }}>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 18 }}>{title}</h2>
    {children}
  </div>
);

export default function RoommateProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [existing, setExisting] = useState<RoommateProfile | null>(null);

  const [gender, setGender]         = useState('');
  const [sleep, setSleep]           = useState('');
  const [study, setStudy]           = useState('');
  const [clean, setClean]           = useState('');
  const [guests, setGuests]         = useState('');
  const [genderPref, setGenderPref] = useState('any');
  const [bio, setBio]               = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'student') { router.push('/'); return; }

    api.get('/roommates/profile')
      .then(r => {
        const p: RoommateProfile = r.data;
        setExisting(p);
        setGender(p.gender);
        setSleep(p.sleep_schedule);
        setStudy(p.study_habits);
        setClean(p.cleanliness);
        setGuests(p.guests);
        setGenderPref(p.gender_preference);
        setBio(p.bio || '');
      })
      .catch(() => {/* 404 = no profile yet */})
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gender || !sleep || !study || !clean || !guests) {
      toast.error('Please fill in all preference fields'); return;
    }
    try {
      setSaving(true);
      await api.post('/roommates/profile', {
        gender,
        sleep_schedule:    sleep,
        study_habits:      study,
        cleanliness:       clean,
        guests,
        gender_preference: genderPref,
        bio:               bio || null,
      });
      toast.success(existing ? 'Profile updated!' : 'Profile created! Finding your matches…');
      router.push('/roommates');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('This will hide you from roommate matches. Continue?')) return;
    try {
      await api.delete('/roommates/profile');
      toast.success('Profile deactivated');
      router.push('/roommates');
    } catch {
      toast.error('Failed to deactivate');
    }
  };

  if (authLoading || loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Loader2 size={32} style={{ color: 'var(--blue)' }} className="animate-spin" />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />

      <div className="form-page-pad" style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <Link href="/roommates" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, color: '#64748B', textDecoration: 'none', marginBottom: 20 }}>
            <ArrowLeft size={16} /> Back to matches
          </Link>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <UserCheck size={28} style={{ color: 'var(--blue)' }} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', letterSpacing: '-1px', marginBottom: 8 }}>
            {existing ? 'Edit your profile' : 'Set up roommate profile'}
          </h1>
          <p style={{ fontSize: 17, color: '#64748B', lineHeight: 1.6 }}>
            Tell us about your lifestyle so we can match you with compatible students.
          </p>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Gender */}
          <Card title="Your gender">
            <div style={{ display: 'flex', gap: 12 }}>
              {['Male', 'Female', 'Other'].map(g => (
                <button key={g} type="button" onClick={() => setGender(g)}
                  style={{ flex: 1, padding: '14px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', border: `2px solid ${gender === g ? 'var(--blue)' : 'var(--border)'}`, background: gender === g ? 'var(--blue-light)' : 'white', color: gender === g ? 'var(--blue)' : '#374151', transition: 'all 0.15s' }}>
                  {g}
                </button>
              ))}
            </div>
          </Card>

          {/* Sleep */}
          <Card title="Sleep schedule">
            <OptionPicker options={SLEEP_OPTIONS} value={sleep} onChange={setSleep} />
          </Card>

          {/* Study */}
          <Card title="Study habits">
            <OptionPicker options={STUDY_OPTIONS} value={study} onChange={setStudy} />
          </Card>

          {/* Cleanliness */}
          <Card title="Cleanliness level">
            <OptionPicker options={CLEAN_OPTIONS} value={clean} onChange={setClean} />
          </Card>

          {/* Guests */}
          <Card title="Guests &amp; visitors">
            <OptionPicker options={GUEST_OPTIONS} value={guests} onChange={setGuests} />
          </Card>

          {/* Gender preference */}
          <Card title="Roommate gender preference">
            <div style={{ display: 'flex', gap: 12 }}>
              {[{ value: 'same', label: '👥 Same gender only' }, { value: 'any', label: '🌍 Any gender' }].map(opt => (
                <button key={opt.value} type="button" onClick={() => setGenderPref(opt.value)}
                  style={{ flex: 1, padding: '14px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', border: `2px solid ${genderPref === opt.value ? 'var(--blue)' : 'var(--border)'}`, background: genderPref === opt.value ? 'var(--blue-light)' : 'white', color: genderPref === opt.value ? 'var(--blue)' : '#374151', transition: 'all 0.15s' }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Bio */}
          <Card title="Short bio (optional)">
            <p style={{ fontSize: 15, color: '#64748B', marginBottom: 14 }}>Tell potential roommates a bit about yourself</p>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} maxLength={300}
              placeholder="e.g. 2nd year CS student at UG. I love music but keep it quiet at night. Looking for someone tidy and respectful."
              style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 12, padding: '14px 16px', fontSize: 15, color: 'var(--text)', fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.6 }}
              onFocus={e => (e.target.style.borderColor = 'var(--blue)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'right', marginTop: 6 }}>{bio.length}/300</p>
          </Card>

          {/* Submit */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" disabled={saving}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 14, fontSize: 17, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1, boxShadow: 'var(--sh-blue)' }}>
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {existing ? 'Save changes' : 'Create profile'}
            </button>

            {existing?.is_active && (
              <button type="button" onClick={handleDeactivate}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px', border: '1.5px solid #FCA5A5', borderRadius: 14, fontSize: 15, fontWeight: 600, color: '#DC2626', background: 'white', cursor: 'pointer' }}>
                <Trash2 size={16} /> Deactivate
              </button>
            )}
          </div>

          {user?.university && (
            <Link href={`/hostels?university=${encodeURIComponent(user.university)}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px', border: '1.5px solid var(--border)', borderRadius: 14,
                fontSize: 15, fontWeight: 600, color: '#374151', textDecoration: 'none',
                background: 'white', transition: 'background 0.15s' }}>
              <Building2 size={16} style={{ color: 'var(--blue)' }} />
              Browse hostels at {user.university} →
            </Link>
          )}
        </form>
      </div>
    </div>
  );
}
