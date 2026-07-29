import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, Grid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEvents } from '../context/EventContext';
import { CATEGORIES, SORT_OPTIONS } from '../data/eventsData';
import EventCard from '../components/EventCard';
import EmptyState from '../components/EmptyState';
import { debounce } from '../utils/helpers';

const PAGE_SIZE = 9;

export default function Events() {
  const { events, loading } = useEvents();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search,      setSearch]   = useState(searchParams.get('q') || '');
  const [category,    setCategory] = useState(searchParams.get('category') || 'All Events');
  const [sortBy,      setSortBy]   = useState('date_asc');
  const [city,        setCity]     = useState('All');
  const [maxPrice,    setMaxPrice] = useState(null);
  const [showFilters, setFilters]  = useState(false);
  const [view,        setView]     = useState('grid');
  const [page,        setPage]     = useState(1);

  useEffect(() => {
    const cat = searchParams.get('category');
    const q   = searchParams.get('q');
    if (cat) setCategory(cat);
    if (q)   setSearch(q);
  }, []);

  useEffect(() => { setPage(1); }, [search, category, city, sortBy, maxPrice]);

  const cities = useMemo(() =>
    ['All', ...Array.from(new Set(events.map(e => e.city).filter(Boolean))).sort()],
    [events]
  );
  const maxEventPrice = useMemo(() =>
    events.length ? Math.ceil(Math.max(...events.map(e => e.price || 0))) : 1000,
    [events]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return events
      .filter(e => {
        if (e.status && e.status !== 'published') return false;
        const matchSearch = !q || e.title?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q) || e.city?.toLowerCase().includes(q) || e.organizer?.toLowerCase().includes(q) || e.tags?.some(t => t.toLowerCase().includes(q));
        const matchCat   = category === 'All Events' || e.category === category;
        const matchCity  = city === 'All' || e.city === city;
        const matchPrice = maxPrice === null || (e.price || 0) <= maxPrice;
        return matchSearch && matchCat && matchCity && matchPrice;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date_desc':  return new Date(b.date) - new Date(a.date);
          case 'price_asc':  return (a.price||0) - (b.price||0);
          case 'price_desc': return (b.price||0) - (a.price||0);
          case 'popular':    return (b.attendees||0) - (a.attendees||0);
          default:           return new Date(a.date) - new Date(b.date);
        }
      });
  }, [events, search, category, city, maxPrice, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const resetFilters = () => { setSearch(''); setCategory('All Events'); setCity('All'); setMaxPrice(null); setSortBy('date_asc'); setPage(1); setSearchParams({}); };
  const hasFilters = search || category !== 'All Events' || city !== 'All' || maxPrice !== null;

  const debouncedUrlSync = useCallback(debounce(val => setSearchParams(prev => { val ? prev.set('q', val) : prev.delete('q'); return prev; }), 400), []);
  const onSearchInput = val => { setSearch(val); debouncedUrlSync(val); };
  const onCategoryClick = cat => { setCategory(cat); setSearchParams(prev => { cat !== 'All Events' ? prev.set('category', cat) : prev.delete('category'); return prev; }); };

  const SkeletonCard = () => (
    <div className="card animate-pulse h-80">
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-2xl" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="page-header py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="font-display text-4xl md:text-5xl font-black mb-2">Discover Events</h1>
            <p className="text-primary-100 text-lg">{loading ? 'Loading events…' : `${events.length} events available — find your next experience`}</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="card p-5 -mt-8 mb-6 shadow-xl">
          <div className="flex gap-3 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={e => onSearchInput(e.target.value)}
                placeholder="Search events, cities, organisers…" className="input-field pl-10 pr-10" />
              {search && (
                <button onClick={() => onSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select value={city} onChange={e => setCity(e.target.value)} className="input-field w-36">{cities.map(c => <option key={c}>{c}</option>)}</select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field w-52">{SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            <button onClick={() => setFilters(!showFilters)}
              className={`btn-secondary px-4 gap-2 flex items-center ${showFilters ? 'border-primary-400 text-primary-600 dark:border-primary-500 dark:text-primary-400' : ''}`}>
              <SlidersHorizontal className="w-4 h-4" /> Filters {hasFilters && <span className="w-2 h-2 bg-primary-500 rounded-full" />}
            </button>
            <div className="flex border-2 border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
              {['grid','list'].map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`p-3 transition-colors ${view === v ? 'bg-primary-500 text-white' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  {v === 'grid' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-5 mt-5 border-t border-gray-100 dark:border-gray-800 max-w-sm">
                  <label className="form-label">Max Price: <span className="text-primary-600 dark:text-primary-400 font-bold">${maxPrice ?? maxEventPrice}</span></label>
                  <input type="range" min={0} max={maxEventPrice} step={10}
                    value={maxPrice ?? maxEventPrice}
                    onChange={e => setMaxPrice(Number(e.target.value) >= maxEventPrice ? null : Number(e.target.value))}
                    className="w-full accent-primary-500" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1"><span>$0</span><span>${maxEventPrice}</span></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-2 mt-4">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => onCategoryClick(c)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  category === c
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}>{c}</button>
            ))}
          </div>
        </motion.div>

        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing <strong className="text-gray-900 dark:text-white">{paginated.length}</strong> of{' '}
            <strong className="text-gray-900 dark:text-white">{filtered.length}</strong> events
            {totalPages > 1 && <span className="ml-2 text-gray-400">· Page {page} of {totalPages}</span>}
          </p>
          {hasFilters && (
            <button onClick={resetFilters} className="text-sm text-red-500 hover:text-red-600 font-semibold flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">{Array.from({length:6}).map((_,i)=><SkeletonCard key={i}/>)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🔍" title="No events found" description="Try adjusting your search or filters." action={{ label: 'Clear Filters', to: '/events' }} />
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              <div className={view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
                {paginated.map((e, i) => (
                  <motion.div key={e.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, delay: i * 0.04 }}>
                    <EventCard event={e} />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-10">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({length:totalPages},(_,i)=>i+1)
                  .filter(n => n===1||n===totalPages||Math.abs(n-page)<=1)
                  .reduce((acc,n,idx,arr) => { if(idx>0&&n-arr[idx-1]>1)acc.push('…'); acc.push(n); return acc; },[])
                  .map((n,i) => n==='…'
                    ? <span key={`e${i}`} className="px-2 text-gray-400">…</span>
                    : <button key={n} onClick={()=>setPage(n)} className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${page===n ? 'bg-primary-500 text-white shadow-md' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>{n}</button>
                  )}
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
