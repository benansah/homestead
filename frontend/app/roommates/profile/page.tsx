'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Loader2, Save, UserCheck, Trash2 } from 'lucide-react';
import { RoommateProfile } from '../../../types';

const SLEEP_OPTIONS = [
  { value: 'early_bird', label: 'Early bird', desc: 'Up by 6 AM, in bed by 10 PM' },
  { value: 'night_owl', label: 'Night owl', desc: 'Active late into the night' },
  { value: 'flexible', label: 'Flexible', desc: 'No strong preference' },
];
const STUDY_OPTIONS = [
  { value: 'quiet', label: 'Needs quiet', desc: 'Silence when studying' },
  { value: 'noise_ok', label: 'Noise is fine', desc: 'Can focus with background noise' },
  { value: 'flexible', label: 'Flexible', desc: 'No strong preference' },
];
const CLEAN_OPTIONS = [
  { value: 'very_tidy', label: 'Very tidy', desc: 'Everything in its place, always' },
  { value: 'moderate', label: 'Moderate', desc: 'Reasonably clean, not obsessive' },
  { value: 'relaxed', label: 'Relaxed', desc: 'Comfortable with some mess' },
];
const GUEST_OPTIONS = [
  { value: 'frequent', label: 'Frequent', desc: 'Friends over most days' },
  { value: 'occasional', label: 'Occasional', desc: 'Guests once in a while' },
  { value: 'never', label: 'Rarely', desc: 'Prefer to keep it private' },
];

function OptionCard({
  options, value, onChange,
}: {
  options: { value: string; label: string; desc: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="text-left p-3 rounded-xl border text-sm transition-all"
          style={{
            borderColor: value === opt.value ? 'var(--blue)' : 'var(--border)',
            background: value === opt.value ? 'var(--blue-light)' : '#fff',
          }}
        >
          <p className="font-semibold text-gray-900">{opt.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
        </button>
      ))}
    </div>
  );
}

export default function RoommateProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<RoommateProfile | null>(null);

  const [gender, setGender] = useState('');
  const [sleepSchedule, setSleepSchedule] = useState('');
  const [studyHabits, setStudyHabits] = useState('');
  const [cleanliness, setCleanliness] = useState('');
  const [guests, setGuests] = useState('');
  const [genderPref, setGenderPref] = useState('any');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'student') { router.push('/'); return; }

    const load = async () => {
      try {
        const res = await api.get('/roommates/profile');
        const p: RoommateProfile = res.data;
        setExisting(p);
        setGender(p.gender);
        setSleepSchedule(p.sleep_schedule);
        setStudyHabits(p.study_habits);
        setCleanliness(p.cleanliness);
        setGuests(p.guests);
        setGenderPref(p.gender_preference);
        setBio(p.bio || '');
      } catch {
        // 404 = no profile yet, fine
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gender || !sleepSchedule || !studyHabits || !cleanliness || !guests) {
      toast.error('Please fill in all preference fields');
      return;
    }
    try {
      setSaving(true);
      await api.post('/roommates/profile', {
        gender, sleep_schedule: sleepSchedule, study_habits: studyHabits,
        cleanliness, guests, gender_preference: genderPref, bio: bio || null,
      });
      toast.success(existing ? 'Profile updated!' : 'Profile created!');
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

  if (loading) return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck size={20} style={{ color: 'var(--blue)' }} />
            <h1 className="text-2xl font-bold text-gray-900">
              {existing ? 'Edit roommate profile' : 'Set up roommate profile'}
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Tell us about your lifestyle so we can find your best matches.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-8">

          {/* Gender */}
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
            <h2 className="font-semibold text-gray-900 mb-3">Your gender</h2>
            <div className="flex gap-2">
              {['Male', 'Female', 'Other'].map(g => (
                <button key={g} type="button" onClick={() => setGender(g)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all"
                  style={{
                    borderColor: gender === g ? 'var(--blue)' : 'var(--border)',
                    background: gender === g ? 'var(--blue-light)' : '#fff',
                    color: gender === g ? 'var(--blue)' : '#374151',
                  }}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Sleep schedule */}
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
            <h2 className="font-semibold text-gray-900 mb-3">Sleep schedule</h2>
            <OptionCard options={SLEEP_OPTIONS} value={sleepSchedule} onChange={setSleepSchedule} />
          </div>

          {/* Study habits */}
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
            <h2 className="font-semibold text-gray-900 mb-3">Study habits</h2>
            <OptionCard options={STUDY_OPTIONS} value={studyHabits} onChange={setStudyHabits} />
          </div>

          {/* Cleanliness */}
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
            <h2 className="font-semibold text-gray-900 mb-3">Cleanliness level</h2>
            <OptionCard options={CLEAN_OPTIONS} value={cleanliness} onChange={setCleanliness} />
          </div>

          {/* Guests */}
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
            <h2 className="font-semibold text-gray-900 mb-3">Guests &amp; visitors</h2>
            <OptionCard options={GUEST_OPTIONS} value={guests} onChange={setGuests} />
          </div>

          {/* Gender preference */}
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
            <h2 className="font-semibold text-gray-900 mb-3">Roommate gender preference</h2>
            <div className="flex gap-2">
              {[
                { value: 'same', label: 'Same gender only' },
                { value: 'any', label: 'Any gender' },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => setGenderPref(opt.value)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all"
                  style={{
                    borderColor: genderPref === opt.value ? 'var(--blue)' : 'var(--border)',
                    background: genderPref === opt.value ? 'var(--blue-light)' : '#fff',
                    color: genderPref === opt.value ? 'var(--blue)' : '#374151',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
            <h2 className="font-semibold text-gray-900 mb-1">Short bio <span className="text-gray-400 font-normal">(optional)</span></h2>
            <p className="text-xs text-gray-400 mb-3">Tell potential roommates a bit about yourself</p>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="e.g. 2nd year CS student at UG, love music but keep it quiet at night…"
              className="w-full text-sm border rounded-xl px-4 py-3 resize-none outline-none
                         focus:ring-2 focus:ring-blue-100 text-gray-800 placeholder-gray-300"
              style={{ borderColor: 'var(--border)' }}
            />
            <p className="text-xs text-gray-400 text-right mt-1">{bio.length}/300</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl
                         text-white font-bold text-sm hover:opacity-90 transition-opacity
                         disabled:opacity-50"
              style={{ background: 'var(--blue)' }}>
              {saving
                ? <Loader2 size={16} className="animate-spin" />
                : <Save size={16} />}
              {existing ? 'Save changes' : 'Create profile'}
            </button>

            {existing && existing.is_active && (
              <button type="button" onClick={handleDeactivate}
                className="flex items-center gap-1.5 px-4 py-3.5 rounded-xl border text-sm
                           font-medium text-red-500 hover:bg-red-50 transition-colors"
                style={{ borderColor: '#FCA5A5' }}>
                <Trash2 size={15} /> Deactivate
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
