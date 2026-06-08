'use client';
import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import api from '../../lib/api';
import HostelCard from '../../components/HostelCard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import {
  Search, X, SlidersHorizontal, Map, LayoutGrid,
  ChevronDown, Loader2, ShieldCheck, Bookmark,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Hostel } from '../../types';
import { useUniversities } from '../../hooks/useUniversities';
import { useAuth } from '../../context/AuthContext';

const BrowseMap = dynamic(() => import('../../components/BrowseMap'), {
  ssr: false,
  loading: () => <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 16, minHeight: 500 }} />,
});

const UNI_SHORT: Record<string, string> = {
  'University of Ghana': 'UG', 'KNUST': 'KNUST', 'UCC': 'UCC',
  'University of Education': 'UEW', 'Ashesi University': 'Ashesi',
};

interface Filters {
  university: string; min_price: string; max_price: string;
  gender_policy: string; room_type: string; is_verified: string;
}
const EMPTY: Filters = { university: '', min_price: '', max_price: '', gender_policy: '', room_type: '', is_verified: '' };

const SL: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
};

function Chip({ label, icon, onRemove }: { label: string; icon?: React.ReactNode; onRemove: () => void }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 8px 4px 10px',
      borderRadius: 99, background: 'var(--blue-light)', color: 'var(--blue)',
      fontSize: 12, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>
      {icon}{label}
      <button onClick={onRemove}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,106,255,0.15)',
          border: 'none', cursor: 'pointer', marginLeft: 2 }}>
        <X size={10} style={{ color: 'var(--blue)' }} />
      </button>
    </span>
  );
}

function HostelsContent() {
  const searchParams = useSearchParams();
  const { universities } = useUniversities();
  const { user } = useAuth();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ ...EMPTY, university: searchParams.get('university') || '' });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [sortBy, setSortBy] = useState('recommended');
  const [radiusBanner, setRadiusBanner] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const [savingSearch, setSavingSearch] = useState(false);

  const sorted = [...hostels].sort((a, b) => {
    if (sortBy === 'price_asc') return (a.min_price || 0) - (b.min_price || 0);
    if (sortBy === 'price_desc') return (b.min_price || 0) - (a.min_price || 0);
    if (sortBy === 'rating') return (b.avg_rating || 0) - (a.avg_rating || 0);
    return 0;
  });

  const doSearch = async (f: Filters) => {
    try {
      setLoading(true);
      setRadiusBanner('');
      const q = new URLSearchParams(
        Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''))
      ).toString();
      const res = await api.get(`/search${q ? '?' + q : ''}`);
      setHostels(res.data.hostels || []);
    } catch { toast.error('Failed to load hostels'); }
    finally { setLoading(false); }
  };

  const handleRadiusSearch = async (lat: number, lng: number, radius_km: number) => {
    try {
      setLoading(true);
      const res = await api.get(`/search?lat=${lat}&lng=${lng}&radius_km=${radius_km}`);
      setHostels(res.data.hostels || []);
      setRadiusBanner(`Showing results within ${radius_km}km of map centre`);
    } catch { toast.error('Failed to search area'); }
    finally { setLoading(false); }
  };

  useEffect(() => { doSearch(filters); }, []);

  const setF = (k: keyof Filters, v: string) => {
    const n = { ...filters, [k]: v }; setFilters(n); doSearch(n);
  };
  const setMulti = (patch: Partial<Filters>) => {
    const n = { ...filters, ...patch }; setFilters(n); doSearch(n);
  };
  const clearAll = () => { setFilters(EMPTY); doSearch(EMPTY); };
  const activeCount = Object.values(filters).filter(Boolean).length;
  const hasChips = !!(filters.gender_policy || filters.is_verified || filters.min_price || filters.max_price);

  const handleSaveSearch = async () => {
    if (!user) { toast.error('Log in to save searches'); return; }
    try {
      setSavingSearch(true);
      await api.post('/saved-searches', {
        label: saveLabel || filters.university || 'My search',
        university: filters.university || null,
        min_price: filters.min_price || null,
        max_price: filters.max_price || null,
        gender_policy: filters.gender_policy || null,
      });
      toast.success('Search saved! We\'ll email you when a matching hostel is listed.');
      setShowSaveModal(false);
      setSaveLabel('');
    } catch {
      toast.error('Failed to save search');
    } finally {
      setSavingSearch(false);
    }
  };

  const Sidebar = () => (
    <div style={{ width: 240, flexShrink: 0 }}>
      <p style={SL}>Price (GHS/yr)</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['min_price', 'max_price'] as const).map((k, i) => (
          <input key={k} type="number" placeholder={i === 0 ? 'Min' : 'Max'}
            value={filters[k]} onChange={e => setF(k, e.target.value)}
            className="input" style={{ padding: '9px 12px', fontSize: 13 }} />
        ))}
      </div>
      <p style={SL}>University</p>
      <div style={{ marginBottom: 20 }}>
        {universities.map(u => (
          <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', cursor: 'pointer' }}>
            <input type="checkbox" checked={filters.university === u.name}
              onChange={e => setF('university', e.target.checked ? u.name : '')}
              style={{ width: 16, height: 16, accentColor: 'var(--blue)', cursor: 'pointer' }} />
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{u.name}</span>
          </label>
        ))}
      </div>
      <p style={SL}>Gender policy</p>
      <div style={{ marginBottom: 20 }}>
        {([['Male', 'Male only'], ['Female', 'Female only'], ['Both', 'Mixed']] as const).map(([val, label]) => (
          <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', cursor: 'pointer' }}>
            <input type="checkbox" checked={filters.gender_policy === val}
              onChange={e => setF('gender_policy', e.target.checked ? val : '')}
              style={{ width: 16, height: 16, accentColor: 'var(--blue)', cursor: 'pointer' }} />
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
          </label>
        ))}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', cursor: 'pointer' }}>
        <input type="checkbox" checked={filters.is_verified === 'true'}
          onChange={e => setF('is_verified', e.target.checked ? 'true' : '')}
          style={{ width: 16, height: 16, accentColor: 'var(--blue)', cursor: 'pointer' }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Verified only</span>
      </label>
      {activeCount > 0 && (
        <button onClick={clearAll} className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 20 }}>
          Clear all ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Navbar />

      {/* ── Hero header ── */}
      <div style={{ background: 'linear-gradient(135deg, #EBF3FF 0%, white 65%)', borderBottom: '1px solid var(--border)', padding: 'clamp(20px,4vw,36px) clamp(16px,3vw,24px) clamp(16px,3vw,24px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 900, color: '#0F172A', marginBottom: 4, letterSpacing: 'clamp(-0.5px,-0.03em,-1px)' }}>
            Browse hostels
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', marginBottom: 16 }}>
            Verified student accommodation near every university in Ghana
          </p>

          {/* Search bar */}
          <div className="r-browse-search" style={{ display: 'flex', background: 'white', borderRadius: 14, border: '1.5px solid var(--border)', overflow: 'hidden', maxWidth: 700, boxShadow: 'var(--sh-sm)' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderRight: '1px solid var(--border)' }}>
              <Search size={16} style={{ color: 'var(--blue)', flexShrink: 0 }} />
              <select value={filters.university} onChange={e => setF('university', e.target.value)}
                style={{ flex: 1, fontSize: 14, fontWeight: 500, background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', padding: '14px 0', color: 'var(--text)' }}>
                <option value="">All universities</option>
                {universities.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
              </select>
            </div>
            <div className="r-browse-price" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRight: '1px solid var(--border)', minWidth: 120 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Min</p>
                <input type="number" placeholder="GHS 0" value={filters.min_price} onChange={e => setF('min_price', e.target.value)}
                  style={{ width: '100%', fontSize: 14, fontWeight: 600, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)' }} />
              </div>
            </div>
            <div className="r-browse-price" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRight: '1px solid var(--border)', minWidth: 120 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Max</p>
                <input type="number" placeholder="Any" value={filters.max_price} onChange={e => setF('max_price', e.target.value)}
                  style={{ width: '100%', fontSize: 14, fontWeight: 600, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)' }} />
              </div>
            </div>
            <button onClick={() => doSearch(filters)}
              style={{ padding: '0 24px', background: 'var(--blue)', color: 'white', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              Search
            </button>
          </div>

          {/* University quick-filter chips */}
          <div className="h-scroll" style={{ display: 'flex', gap: 8, marginTop: 14, paddingBottom: 2 }}>
            <button onClick={() => setF('university', '')}
              style={{ flexShrink: 0, padding: '6px 16px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${!filters.university ? 'var(--blue)' : 'var(--border)'}`, background: !filters.university ? 'var(--blue)' : 'white', color: !filters.university ? 'white' : '#6B7280', transition: 'all 0.15s' }}>
              All
            </button>
            {universities.map(u => (
              <button key={u.id} onClick={() => setF('university', filters.university === u.name ? '' : u.name)}
                style={{ flexShrink: 0, padding: '6px 16px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', border: `1.5px solid ${filters.university === u.name ? 'var(--blue)' : 'var(--border)'}`, background: filters.university === u.name ? 'var(--blue)' : 'white', color: filters.university === u.name ? 'white' : '#6B7280', transition: 'all 0.15s' }}>
                {UNI_SHORT[u.name] ?? u.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticky toolbar ── */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)', position: 'sticky', top: 64, zIndex: 40 }}>
        <div className="r-toolbar-row" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,3vw,24px)', height: 52, display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Count */}
          <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', marginRight: 4 }}>
            {loading
              ? <span style={{ color: '#94A3B8' }}>Loading…</span>
              : <>{hostels.length} <span style={{ fontWeight: 500, color: '#64748B' }}>hostel{hostels.length !== 1 ? 's' : ''}</span></>}
          </p>

          {/* Active filter chips (scroll horizontally, flex-1) */}
          {hasChips && (
            <div className="h-scroll" style={{ display: 'flex', gap: 6, flex: 1 }}>
              {filters.gender_policy && (
                <Chip label={filters.gender_policy === 'Both' ? 'Mixed' : `${filters.gender_policy} only`} onRemove={() => setF('gender_policy', '')} />
              )}
              {filters.is_verified && (
                <Chip label="Verified" icon={<ShieldCheck size={10} style={{ marginRight: 2 }} />} onRemove={() => setF('is_verified', '')} />
              )}
              {(filters.min_price || filters.max_price) && (
                <Chip
                  label={filters.min_price && filters.max_price ? `GHS ${filters.min_price}–${filters.max_price}` : filters.min_price ? `Min GHS ${filters.min_price}` : `Max GHS ${filters.max_price}`}
                  onRemove={() => setMulti({ min_price: '', max_price: '' })} />
              )}
            </div>
          )}
          {!hasChips && <div style={{ flex: 1 }} />}

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Mobile: Filters drawer button */}
            <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, border: `1.5px solid ${activeCount > 0 ? 'var(--blue)' : 'var(--border)'}`, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'white', color: activeCount > 0 ? 'var(--blue)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              <SlidersHorizontal size={13} /> Filters{activeCount > 0 ? ` (${activeCount})` : ''}
            </button>

            {/* View mode toggle */}
            <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: 10, padding: 3, border: '1px solid var(--border)' }}>
              {[['grid', LayoutGrid, 'Grid'] as const, ['map', Map, 'Map'] as const].map(([v, Icon, label]) => (
                <button key={v} onClick={() => setViewMode(v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: viewMode === v ? 'white' : 'transparent', color: viewMode === v ? 'var(--blue)' : 'var(--text-muted)', boxShadow: viewMode === v ? 'var(--sh-sm)' : 'none', transition: 'all 0.15s' }}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            {/* Save search */}
            {activeCount > 0 && user?.role === 'student' && (
              <button onClick={() => setShowSaveModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'white', color: 'var(--blue)', whiteSpace: 'nowrap' }}>
                <Bookmark size={13} /> Save search
              </button>
            )}

            {/* Sort */}
            <div className="r-toolbar-sort" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ appearance: 'none', fontSize: 13, fontWeight: 600, color: 'var(--text)', background: 'transparent', border: '1.5px solid var(--border)', outline: 'none', borderRadius: 10, padding: '6px 32px 6px 12px', cursor: 'pointer' }}>
                <option value="recommended">Recommended</option>
                <option value="price_asc">Price: low → high</option>
                <option value="price_desc">Price: high → low</option>
                <option value="rating">Highest rated</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 10, pointerEvents: 'none', color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(20px,4vw,32px) clamp(16px,3vw,24px) 60px', display: 'flex', gap: 36 }}>

        {/* Desktop sidebar */}
        <div className="hidden lg:block" style={{ flexShrink: 0 }}><Sidebar /></div>

        {/* Mobile filter drawer */}
        {showFilters && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} className="lg:hidden">
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(3px)' }}
              onClick={() => setShowFilters(false)} />
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: 'white', width: 300, overflowY: 'auto', padding: 20, boxShadow: 'var(--sh-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <p style={{ fontWeight: 800, fontSize: 17, color: '#0F172A' }}>Filters</p>
                <button onClick={() => setShowFilters(false)}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={15} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
              <Sidebar />
            </div>
          </div>
        )}

        {/* Results */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {radiusBanner && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--blue-light)', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13, fontWeight: 600, color: 'var(--blue)' }}>
              <span>📍 {radiusBanner}</span>
              <button onClick={() => { setRadiusBanner(''); doSearch(filters); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)', fontWeight: 700, fontSize: 13 }}>✕ Clear</button>
            </div>
          )}
          {viewMode === 'map' ? (
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', height: '70vh' }}>
              {loading
                ? <div style={{ width: '100%', height: '100%', background: 'var(--surface)' }} />
                : <BrowseMap hostels={hostels} onRadiusSearch={handleRadiusSearch} />}
            </div>
          ) : loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
              {[...Array(9)].map((_, i) => (
                <div key={i} className="card" style={{ overflow: 'hidden' }}>
                  <div className="shimmer" style={{ paddingBottom: '66%' }} />
                  <div style={{ padding: 16 }}>
                    {[70, 50, 40].map(w => (
                      <div key={w} className="shimmer" style={{ height: 12, borderRadius: 6, marginBottom: 10, width: `${w}%` }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : hostels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'clamp(48px,8vw,80px) 20px' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <span style={{ fontSize: 32 }}>🏠</span>
              </div>
              <p style={{ fontSize: 19, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>No hostels found</p>
              <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>
                Try adjusting your filters or selecting a different university
              </p>
              <button onClick={clearAll} className="btn btn-primary">Clear all filters</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
              {sorted.map(h => <HostelCard key={h.id} hostel={h} />)}
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Save search modal */}
      {showSaveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowSaveModal(false)}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 400, padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>Save search alert</h2>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>
              We&apos;ll email you when a new hostel matching your current filters goes live.
            </p>
            <div style={{ background: '#F8FAFF', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#334155' }}>
              {filters.university && <p>🎓 {filters.university}</p>}
              {(filters.min_price || filters.max_price) && (
                <p>💰 GHS {filters.min_price || '0'} – {filters.max_price || 'any'}</p>
              )}
              {filters.gender_policy && <p>👥 {filters.gender_policy} policy</p>}
            </div>
            <input
              value={saveLabel}
              onChange={e => setSaveLabel(e.target.value)}
              placeholder={`Label (e.g. "${filters.university || 'My search'}")`}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowSaveModal(false)}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, fontWeight: 600, cursor: 'pointer', background: 'white', color: '#374151' }}>
                Cancel
              </button>
              <button onClick={handleSaveSearch} disabled={savingSearch}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', background: 'var(--blue)', color: 'white', opacity: savingSearch ? 0.7 : 1 }}>
                {savingSearch ? 'Saving…' : 'Save alert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HostelsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} style={{ color: 'var(--blue)' }} className="animate-spin" />
      </div>
    }>
      <HostelsContent />
    </Suspense>
  );
}
