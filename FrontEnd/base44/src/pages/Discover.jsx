import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Navigation } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { discoverApi } from '@/api/discoverApi';
import { useLocation } from '@/hooks/useLocation.jsx';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { capeTownImages } from '@/config/capeTownImages';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import DiscoverPlaceCard from '@/components/landing/DiscoverPlaceCard';

const CATEGORIES = [
  'All', 'Running', 'Hiking', 'Surfing', 'Cycling', 'Yoga & Wellness',
  'Food & Markets', 'Faith & Community', 'Social & Dining', 'Book Club', 'Gaming',
];

const MOODS = [
  'Meet people', 'Be active', 'Something chilled', 'Go out tonight',
  'Something outdoors', 'Alcohol-free', 'Creative', 'Beginner-friendly',
];

const SORTS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'highest_rated', label: 'Highest rated' },
  { value: 'most_reviewed', label: 'Most reviewed' },
  { value: 'nearest', label: 'Nearest' },
];

export default function Discover() {
  const [searchParams] = useSearchParams();
  const { selectedCity } = useLocation();
  const reduceMotion = useReducedMotionPreference();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState('All');
  const [mood, setMood] = useState(searchParams.get('mood') || null);
  const [sort, setSort] = useState('recommended');
  const [coords, setCoords] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const city = searchParams.get('city') || selectedCity;

  const runSearch = useCallback((signal) => {
    setLoading(true);
    setError(null);
    setNotConfigured(false);
    discoverApi.search({
      city,
      search: search || undefined,
      category: category !== 'All' ? category : undefined,
      mood: mood || undefined,
      sort,
      latitude: coords?.lat,
      longitude: coords?.lng,
    }, signal)
      .then((data) => setResults(data.results || []))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (err.status === 501) setNotConfigured(true);
        else setError(err.message || 'Something went wrong loading results.');
        setResults([]);
      })
      .finally(() => setLoading(false));
  }, [city, search, category, mood, sort, coords]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => runSearch(controller.signal), 300); // debounce typing
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [runSearch]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
    );
  };

  return (
    <div className="discover-theme min-h-screen">
      <Navbar />

      {/* Hero — a photographic Cape Town banner (distinct from the homepage
          hero image) with a diagonal teal→coral wash so the search row and
          mood chips stay legible while still tying into the brand palette. */}
      <section className="relative overflow-hidden min-h-[440px] sm:min-h-[480px] flex flex-col">
        <div className="absolute inset-0">
          <img
            src={capeTownImages.hero.discover}
            alt="Cape Town coastline"
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="absolute inset-0" style={{ background: 'var(--lv-bg-base)', zIndex: -1 }} />
        </div>
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, rgba(15,74,74,0.92) 0%, rgba(26,92,82,0.75) 40%, rgba(201,122,74,0.55) 100%)' }}
        />

        <div className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-10 sm:pb-14 w-full">
          <motion.span
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="block text-[13px] font-semibold uppercase mb-3"
            style={{ color: 'var(--lv-teal-light)', letterSpacing: '0.05em' }}
          >
            Discover
          </motion.span>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-body text-[28px] sm:text-[34px] font-medium leading-tight text-white mb-3"
          >
            What to do in {city}
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[15px] max-w-[480px] mb-8"
            style={{ color: '#cfe8e2' }}
          >
            Real places, clubs and communities near you — powered by Google Places
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col sm:flex-row gap-3 max-w-2xl mb-6"
          >
            <div
              className="discover-search-panel flex-1 flex items-center gap-2 px-4 py-3 rounded-full"
              style={{ background: 'rgba(255,255,255,0.95)' }}
            >
              <Search className="w-4 h-4 text-charcoal/40 shrink-0" />
              <input
                type="text"
                placeholder="What are you in the mood for?"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} aria-label="Clear search">
                  <X className="w-4 h-4 text-charcoal/40" />
                </button>
              )}
            </div>
            <button
              onClick={handleUseLocation}
              className={`discover-btn-nearme flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold shrink-0 ${coords ? 'discover-btn-nearme-active' : ''}`}
            >
              <Navigation className="w-4 h-4" />
              {coords ? 'Using your location' : 'Near me'}
            </button>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2"
          >
            {MOODS.map(m => (
              <button
                key={m}
                onClick={() => setMood(current => current === m ? null : m)}
                className={`discover-mood-pill px-3.5 py-1.5 rounded-full text-xs font-medium ${mood === m ? 'discover-mood-pill-active' : ''}`}
              >
                {m}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Category filters + sort — sits on the page's dark background,
            just below the hero. */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-8 mb-2">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar flex-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`discover-pill px-4 py-1.5 rounded-2xl text-[13px] font-medium whitespace-nowrap shrink-0 ${
                  category === cat ? 'discover-pill-active' : 'discover-pill-inactive'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="discover-btn-ghost px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none shrink-0"
          >
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <p className="text-[11px] mb-6" style={{ color: 'var(--lv-text-onteal-muted)' }}>Place data © Google</p>

        {/* Results */}
        {notConfigured ? (
          <div className="text-center py-20">
            <h3 className="font-body text-xl font-semibold text-white mb-2">Discover isn't connected yet</h3>
            <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--lv-text-onteal-muted)' }}>
              This deployment doesn't have a Google Places API key configured on the Worker yet, so there's nothing real to show here.
            </p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="discover-card rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3]" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="p-4 space-y-3">
                  <div className="h-4 rounded w-3/4" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="h-3 rounded w-1/2" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="h-3 rounded w-2/3" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <h3 className="font-body text-xl font-semibold text-white mb-2">Couldn't load results</h3>
            <p className="text-sm" style={{ color: 'var(--lv-text-onteal-muted)' }}>{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--lv-text-onteal-muted)', opacity: 0.5 }} />
            <h3 className="font-body text-xl font-semibold text-white mb-2">No results found</h3>
            <p className="text-sm" style={{ color: 'var(--lv-text-onteal-muted)' }}>Try a different category, mood, or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {results.map((place, i) => (
              <motion.div
                key={place.placeId}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: 'easeOut' }}
              >
                <DiscoverPlaceCard place={place} city={city} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
