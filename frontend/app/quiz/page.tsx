'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import HostelCard from '../../components/HostelCard';
import api from '../../lib/api';
import { ArrowLeft, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Hostel } from '../../types';

const UNIVERSITIES = [
  'University of Ghana',
  'KNUST',
  'UCC',
  'University of Education',
  'Ashesi University',
];

interface Step {
  id: string;
  question: string;
  options: { label: string; value: string; emoji: string }[];
}

const STEPS: Step[] = [
  {
    id: 'university',
    question: 'Which university are you attending?',
    options: UNIVERSITIES.map(u => ({
      label: u,
      value: u,
      emoji: '🎓',
    })),
  },
  {
    id: 'room_type',
    question: 'What type of room do you prefer?',
    options: [
      { label: 'Self-contained',  value: 'Self-contained', emoji: '🏠' },
      { label: 'Shared room',     value: 'Shared',         emoji: '🛏️' },
      { label: 'No preference',   value: '',               emoji: '🤷' },
    ],
  },
  {
    id: 'gender_policy',
    question: 'What is your gender preference for the hostel?',
    options: [
      { label: 'Male only',   value: 'Male',   emoji: '👨' },
      { label: 'Female only', value: 'Female', emoji: '👩' },
      { label: 'Mixed',       value: 'Both',   emoji: '👥' },
    ],
  },
  {
    id: 'max_price',
    question: 'What is your maximum annual budget?',
    options: [
      { label: 'Under GHS 1,000',        value: '1000',  emoji: '💚' },
      { label: 'GHS 1,000 – 2,000',      value: '2000',  emoji: '💛' },
      { label: 'GHS 2,000 – 3,000',      value: '3000',  emoji: '🧡' },
      { label: 'Above GHS 3,000',        value: '9999',  emoji: '💜' },
    ],
  },
];

export default function QuizPage() {
  const router  = useRouter();
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const current = STEPS[step];

  const select = async (value: string) => {
    const newAnswers = { ...answers, [current.id]: value };
    setAnswers(newAnswers);

    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      return;
    }

    // last step — run match
    try {
      setLoading(true);
      const params = new URLSearchParams({
        university:    newAnswers.university    || '',
        max_price:     newAnswers.max_price     || '9999',
        gender_policy: newAnswers.gender_policy || 'Both',
        room_type:     newAnswers.room_type     || '',
      });
      const res = await api.get(`/search/match?${params}`);
      setResults(res.data.hostels || []);
      setDone(true);
    } catch {
      toast.error('Failed to find matches');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setResults([]);
    setDone(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-12">

        {!done ? (
          <>
            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">
                  Question {step + 1} of {STEPS.length}
                </span>
                <span className="text-xs font-medium text-gray-500">
                  {Math.round(((step) / STEPS.length) * 100)}% complete
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(step / STEPS.length) * 100}%`,
                    background: 'var(--blue)',
                  }} />
              </div>
            </div>

            {/* Question card */}
            <div className="bg-white rounded-2xl p-8 text-center"
              style={{ border: '1px solid var(--border)' }}>

              <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: 'var(--blue)' }}>
                Find your perfect hostel
              </p>
              <h2 className="text-xl font-bold text-gray-900 mb-8">
                {current.question}
              </h2>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={28} className="animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="grid gap-3">
                  {current.options.map(opt => (
                    <button key={opt.value}
                      onClick={() => select(opt.value)}
                      className="flex items-center gap-4 w-full px-5 py-4 rounded-xl
                                 border-2 text-left transition-all hover:border-blue-500
                                 hover:bg-blue-50 group"
                      style={{ borderColor: 'var(--border)' }}>
                      <span className="text-2xl">{opt.emoji}</span>
                      <span className="text-sm font-semibold text-gray-800
                                       group-hover:text-blue-700 transition-colors">
                        {opt.label}
                      </span>
                      <ArrowRight size={16}
                        className="ml-auto text-gray-300 group-hover:text-blue-500
                                   transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* Back button */}
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-1.5 mx-auto mt-6 text-sm
                             text-gray-400 hover:text-gray-600 transition-colors">
                  <ArrowLeft size={14} /> Back
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Results */}
            <div className="text-center mb-8">
              <p className="text-3xl mb-3">🎉</p>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {results.length > 0
                  ? `We found ${results.length} hostel${results.length !== 1 ? 's' : ''} for you`
                  : 'No exact matches found'}
              </h1>
              <p className="text-sm text-gray-500 mb-5">
                {results.length > 0
                  ? 'These hostels match your preferences best'
                  : 'Try adjusting your preferences or browse all hostels'}
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={reset}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold
                             rounded-lg border hover:bg-gray-50 transition-colors text-gray-700"
                  style={{ borderColor: 'var(--border)' }}>
                  <RefreshCw size={14} /> Retake quiz
                </button>
                <button onClick={() => router.push('/')}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white
                             hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--blue)' }}>
                  Browse all hostels
                </button>
              </div>
            </div>

            {results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {results.map(hostel => (
                  <HostelCard key={hostel.id} hostel={hostel} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl"
                style={{ border: '1px solid var(--border)' }}>
                <p className="text-gray-400 text-sm">
                  No hostels matched all your criteria.
                  Try browsing with fewer filters.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}