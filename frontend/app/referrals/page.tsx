'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Gift, Copy, Check, Loader2, Users, TrendingUp, Bold } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReferralsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/referrals');
        setData(res.data);
      } catch {
        toast.error('Failed to load referrals');
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user, authLoading]);

  const copyCode = () => {
    navigator.clipboard.writeText(data?.code || '');
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(data?.share_link || '');
    toast.success('Link copied!');
  };

  return (
    <div className="min-h-screen bg-gray-50"
    style={{
      margin:'2%',alignItems:'center',justifyItems:'center'
    }}>
      <Navbar />

      <main className="w-full px-4 py-12 sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 text-center">

        <div className="flex w-full flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--blue-light)' }}>
            <Gift size={20} style={{ color: 'var(--blue)' }} />
          </div>
          <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-900" >Refer & earn</h1>
            <p
              className="mt-1 text-sm font-medium leading-6 text-gray-600"
              style={{ margin: '0 auto', textAlign: 'center' }}
            >
              Earn GHS 20 for every friend who books a viewing
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-6"
          style={{ margin: ' 2%  2%', padding: '2% 2% 2%'}}
          
          >

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4"
             style={{ margin: '5% 5%', width:'500px', minWidth:'300px',minHeight:'100px', height:'200px', maxWidth: '1000px', padding: '2% 2% 2%',justifySelf:'center' }}
            >
              {[
                { label: 'Completed',    value: data?.completed || 0,    color: '#065F46', bg: '#ECFDF5', icon: Check },
                { label: 'Pending',      value: data?.pending || 0,      color: '#B45309', bg: '#FFF9EB', icon: Users },
                { label: 'Total earned', value: `GHS ${data?.total_earned || 0}`, color: 'var(--blue)', bg: 'var(--blue-light)', icon: TrendingUp },
              ].map(({ label, value, color, bg, icon: Icon }) => (
                <div key={label} className="bg-white rounded-xl p-4 text-center"
                  style={{ border: '1px solid var(--border)',backgroundColor:'white' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
                    style={{ background: bg }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Your code */}
            <div className="bg-white rounded-2xl p-6"
              style={{ border: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold text-gray-700 mb-3"
              style={{margin:'0.5% 0.5%', color:'#191970', fontStyle:'italic'}}
              
              >Your referral code</p>
              <div className="flex items-center justify-center gap-3"
              style={{margin:'1.5% 1.5%'}}
              >
                <div className="flex-1 text-2xl font-black tracking-widest text-center
                                py-4 rounded-xl"
                  style={{ background: 'var(--blue-light)', color: 'var(--blue)',
                           letterSpacing: '0.2em' }}>
                  {data?.code}
                </div>
                <button onClick={copyCode}
                  className="w-12 h-12 rounded-xl flex items-center justify-center
                             transition-all"
                  style={{
                    background: copied ? '#ECFDF5' : 'var(--blue-light)',
                    color: copied ? '#065F46' : 'var(--blue)',
                    margin:'2% 2%'
                  }}>
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            {/* Share link */}
            <div className="bg-white rounded-2xl p-6"
              style={{ 
                      margin:'5% 5%',
                      border: '1px solid var(--border)',
                      
               }}>
              <p className="text-sm font-semibold text-gray-700 mb-3">Share your link</p>
              <div className="flex items-center justify-center gap-2 p-3 rounded-xl"
                style={{ background: '#f0f8ff', border: '1px solid var(--border)',margin:'5% 2%' }}>
                <p className="flex-1 text-xs text-gray-500 truncate font-mono">
                  {data?.share_link}
                </p>
                <button onClick={copyLink}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white
                             hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--blue)',padding:'1%' }}>
                  Copy
                </button>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-white rounded-2xl p-6"
              style={{ border: '1px solid var(--border)', padding:'1%', margin:'5rem' }}>
              <p className="text-sm font-semibold text-gray-700 mb-4" 
              style={{margin:'2%',fontSize:'25px',fontStyle:'inherit'}}
              >HOW IT WORKS</p>
              <div className="space-y-3"
              style={{padding:'2%',margin:'2%'}}>
                {[
                  { n: '1', text: 'Share your code or link with a friend' },
                  { n: '2', text: 'They register using your referral code' },
                  { n: '3', text: 'When they complete their first viewing booking, you earn GHS 20' },
                  { n: '4', text: 'Your reward is applied as a discount on your next booking' },
                ].map(({ n, text }) => (
                  <div key={n} className="flex items-start justify-center gap-3 text-left">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center
                                    text-white text-xs font-bold shrink-0"
                      style={{ background: 'var(--green)' }}>
                      {n}
                    </div>
                    <p className="text-sm text-gray-600"
                    style={{margin:'2%',fontSize:'19px',fontStyle:'italic',alignContent:'flex-start'}}
                    >{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
