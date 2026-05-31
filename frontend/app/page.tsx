'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import api from '../lib/api';
import HostelCard from '../components/HostelCard';
import Navbar from '../components/Navbar';
import { Search, X, SlidersHorizontal, Map, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';
import { Hostel } from '../types';

const BrowseMap = dynamic(() => import('../components/BrowseMap'), {
  ssr: false,
  loading: () => <div className="flex-1 bg-gray-100 animate-pulse rounded-xl" style={{ minHeight: '500px' }} />,
});

const UNIVERSITIES = [
  'University of Ghana',
  'KNUST',
  'UCC',
  'University of Education',
  'Ashesi University',
];

interface Filters {
  university: string;
  min_price: string;
  max_price: string;
  gender_policy: string;
  room_type: string;
  is_verified: string;
}

const EMPTY_FILTERS: Filters = {
  university: '', min_price: '', max_price: '',
  gender_policy: '', room_type: '', is_verified: '',
};

export default function Home() {
  const [hostels, setHostels]     = useState<Hostel[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filters, setFilters]     = useState<Filters>(EMPTY_FILTERS);
  const [search, setSearch]       = useState('');
  const [sortBy, setSortBy]       = useState('recommended');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode]   = useState<'grid' | 'map'>('grid');

  const doSearch = async (f: Filters = filters): Promise<void> => {
    try {
      setLoading(true);
      const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''));
      const q = new URLSearchParams(params).toString();
      const res = await api.get(`/search${q ? '?' + q : ''}`);
      setHostels(res.data.hostels || []);
    } catch {
      toast.error('Failed to load hostels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/search');
        setHostels(res.data.hostels || []);
      } catch {
        toast.error('Failed to load hostels');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const setF = (key: keyof Filters, val: string) => {
    const next = { ...filters, [key]: val };
    setFilters(next);
    doSearch(next);
  };

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    doSearch(EMPTY_FILTERS);
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  // ── Sidebar filters (Zillow left panel) ─────────────────────────────────
  const FilterPanel = () => (
    <aside className="w-full lg:w-64 shrink-0">

      {/* Price */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Price range (GHS/yr)
        </p>
        <div className="flex gap-2">
          <input type="number" placeholder="Min"
            value={filters.min_price}
            onChange={e => setF('min_price', e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none
                       focus:border-blue-500 transition-colors"
            style={{ borderColor: 'var(--border)' }} />
          <input type="number" placeholder="Max"
            value={filters.max_price}
            onChange={e => setF('max_price', e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none
                       focus:border-blue-500 transition-colors"
            style={{ borderColor: 'var(--border)' }} />
        </div>
      </div>

      <hr style={{ borderColor: 'var(--border)' }} className="my-4" />

      {/* University */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          University
        </p>
        <div className="space-y-2">
          {UNIVERSITIES.map(u => (
            <label key={u} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox"
                checked={filters.university === u}
                onChange={e => setF('university', e.target.checked ? u : '')}
                className="w-4 h-4 rounded accent-blue-600" />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                {u}
              </span>
            </label>
          ))}
        </div>
      </div>

      <hr style={{ borderColor: 'var(--border)' }} className="my-4" />

      {/* Room type */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Room type
        </p>
        <div className="space-y-2">
          {['Self-contained', 'Shared'].map(t => (
            <label key={t} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox"
                checked={filters.room_type === t}
                onChange={e => setF('room_type', e.target.checked ? t : '')}
                className="w-4 h-4 rounded accent-blue-600" />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{t}</span>
            </label>
          ))}
        </div>
      </div>

      <hr style={{ borderColor: 'var(--border)' }} className="my-4" />

      {/* Gender policy */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Gender policy
        </p>
        <div className="space-y-2">
          {['Male', 'Female', 'Both'].map(g => (
            <label key={g} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox"
                checked={filters.gender_policy === g}
                onChange={e => setF('gender_policy', e.target.checked ? g : '')}
                className="w-4 h-4 rounded accent-blue-600" />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                {g === 'Both' ? 'Mixed' : `${g} only`}
              </span>
            </label>
          ))}
        </div>
      </div>

      <hr style={{ borderColor: 'var(--border)' }} className="my-4" />

      {/* Other */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Other
        </p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox"
            checked={filters.is_verified === 'true'}
            onChange={e => setF('is_verified', e.target.checked ? 'true' : '')}
            className="w-4 h-4 rounded accent-blue-600" />
          <span className="text-sm text-gray-700">Verified listings only</span>
        </label>
      </div>

      {activeFilterCount > 0 && (
        <button onClick={clearAll}
          className="w-full text-sm font-semibold py-2 rounded-lg border transition-colors
                     hover:bg-gray-50 text-gray-700"
          style={{ borderColor: 'var(--border)' }}>
          Clear all filters ({activeFilterCount})
        </button>
      )}
    </aside>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── HERO — Zillow light style ── */}
      <div className="bg-white" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.5px' }}>
            Find your way home
          </h1>
          <p className="text-gray-500 mb-6 text-base">
            Verified student hostels near every university in Ghana
          </p>

          {/* Search bar — white, bordered, Zillow style */}
          <div className="flex rounded-xl overflow-hidden shadow-sm max-w-2xl mx-auto"
            style={{ border: '1.5px solid var(--border)' }}>

            {/* University */}
            <div className="flex-1 flex items-center gap-2 px-4 py-3"
              style={{ borderRight: '1px solid var(--border)' }}>
              <Search size={16} className="text-gray-400 shrink-0" />
              <select
                value={filters.university}
                onChange={e => setF('university', e.target.value)}
                className="flex-1 text-sm text-gray-700 outline-none bg-transparent cursor-pointer">
                <option value="">All universities</option>
                {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {/* Min price */}
            <div className="hidden md:flex items-center px-3 py-3"
              style={{ borderRight: '1px solid var(--border)', minWidth: '110px' }}>
              <div>
                <p className="text-xs text-gray-400 leading-none mb-1">Min</p>
                <input type="number" placeholder="GHS 0"
                  value={filters.min_price}
                  onChange={e => setF('min_price', e.target.value)}
                  className="w-full text-sm text-gray-700 outline-none bg-transparent" />
              </div>
            </div>

            {/* Max price */}
            <div className="hidden md:flex items-center px-3 py-3"
              style={{ borderRight: '1px solid var(--border)', minWidth: '110px' }}>
              <div>
                <p className="text-xs text-gray-400 leading-none mb-1">Max</p>
                <input type="number" placeholder="Any"
                  value={filters.max_price}
                  onChange={e => setF('max_price', e.target.value)}
                  className="w-full text-sm text-gray-700 outline-none bg-transparent" />
              </div>
            </div>

            {/* Search button */}
            <button
              onClick={() => doSearch()}
              className="px-6 py-3 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              style={{ background: 'var(--blue)' }}>
              Search
            </button>
          </div>

          {/* Quick filters row */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {UNIVERSITIES.map(u => (
              <button key={u}
                onClick={() => setF('university', filters.university === u ? '' : u)}
                className="text-xs px-3 py-1.5 rounded-full border transition-all font-medium"
                style={{
                  borderColor: filters.university === u ? 'var(--blue)' : 'var(--border)',
                  color: filters.university === u ? 'var(--blue)' : 'var(--text-muted)',
                  background: filters.university === u ? 'var(--blue-light)' : 'transparent',
                }}>
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── RESULTS BAR ── */}
      <div className="bg-white sticky top-14 z-40"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <p className="text-sm font-semibold text-gray-800">
            {loading ? 'Loading...' : `${hostels.length} hostels`}
          </p>
          <p className="text-sm text-gray-400 hidden sm:block">
            · Ghana · Student housing
          </p>

          {/* Mobile filter button */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden ml-2 flex items-center gap-1.5 border rounded-full
                       px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{
              borderColor: activeFilterCount > 0 ? 'var(--blue)' : 'var(--border)',
              color: activeFilterCount > 0 ? 'var(--blue)' : 'var(--text-muted)',
            }}>
            <SlidersHorizontal size={13} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>

          {/* View toggle */}
          <div className="flex gap-1 p-0.5 rounded-lg ml-2"
            style={{ background: '#F3F4F6', border: '1px solid var(--border)' }}>
            <button
              onClick={() => setViewMode('grid')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
              style={{
                background: viewMode === 'grid' ? '#fff' : 'transparent',
                color: viewMode === 'grid' ? 'var(--blue)' : '#6B7280',
                boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
              <LayoutGrid size={13} /> List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
              style={{
                background: viewMode === 'map' ? '#fff' : 'transparent',
                color: viewMode === 'map' ? 'var(--blue)' : '#6B7280',
                boxShadow: viewMode === 'map' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
              <Map size={13} /> Map
            </button>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="ml-auto text-xs border rounded-lg px-3 py-1.5 outline-none
                       text-gray-700 bg-white cursor-pointer"
            style={{ borderColor: 'var(--border)' }}>
            <option value="recommended">Recommended</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="rating">Highest rated</option>
            <option value="distance">Nearest to campus</option>
          </select>
        </div>
      </div>

      {/* ── MAIN LAYOUT — sidebar + grid ── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-8">

          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <FilterPanel />
          </div>

          {/* Mobile filters drawer */}
          {showMobileFilters && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div className="absolute inset-0 bg-black bg-opacity-40"
                onClick={() => setShowMobileFilters(false)} />
              <div className="relative bg-white w-72 h-full overflow-y-auto p-5 shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <p className="font-semibold text-gray-900">Filters</p>
                  <button onClick={() => setShowMobileFilters(false)}>
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
                <FilterPanel />
              </div>
            </div>
          )}

          {/* Listings grid or map */}
          <div className="flex-1 min-w-0">
            {viewMode === 'map' ? (
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', height: '70vh' }}>
                {loading ? (
                  <div className="w-full h-full bg-gray-100 animate-pulse" />
                ) : (
                  <BrowseMap hostels={hostels} />
                )}
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="rounded-lg overflow-hidden"
                    style={{ border: '1px solid var(--border)' }}>
                    <div className="h-44 bg-gray-100 animate-pulse" />
                    <div className="p-3 space-y-2">
                      <div className="h-5 bg-gray-100 rounded animate-pulse w-1/3" />
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : hostels.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-5xl mb-4">🏠</p>
                <p className="text-xl font-semibold text-gray-700 mb-2">No hostels found</p>
                <p className="text-sm text-gray-400 mb-6">Try adjusting your filters</p>
                <button onClick={clearAll}
                  className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg"
                  style={{ background: 'var(--blue)' }}>
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {hostels.map(hostel => (
                  <HostelCard key={hostel.id} hostel={hostel} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--border)' }} className="mt-12 py-8 px-4 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center
                        justify-between gap-4">
          <span className="font-black text-xl"
            style={{ color: 'var(--blue)', fontFamily: 'Georgia, serif' }}>
            hostelGH
          </span>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-800 transition-colors">About</a>
            <a href="#" className="hover:text-gray-800 transition-colors">List your hostel</a>
            <a href="#" className="hover:text-gray-800 transition-colors">Help</a>
            <a href="#" className="hover:text-gray-800 transition-colors">Contact</a>
          </div>
          <span className="text-sm text-gray-400">© 2025 hostelGH · Ghana</span>
        </div>
      </footer>
    </div>
  );
}