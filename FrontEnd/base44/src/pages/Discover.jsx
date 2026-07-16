import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, LocateFixed } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { discoverApi } from '@/api/discoverApi';
import { useLocation } from '@/hooks/useLocation.jsx';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import DiscoverPlaceCard from '@/components/landing/DiscoverPlaceCard';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-charcoal mb-2">
            Discover in {city}
          </h1>
          <p className="text-charcoal/60 text-sm sm:text-base">
            Real places, clubs and communities near you — powered by Google Places
          </p>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-sand">
            <Search className="w-4 h-4 text-charcoal/40" />
            <input
              type="text"
              placeholder="What are you in the mood for?"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} aria-label="Clear search">
                <X className="w-4 h-4 text-charcoal/40" />
              </button>
            )}
          </div>
          <button
            onClick={handleUseLocation}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors shrink-0 ${
              coords ? 'bg-ocean text-white border-ocean' : 'bg-white border-sand text-charcoal hover:border-ocean/30'
            }`}
          >
            <LocateFixed className="w-4 h-4" />
            {coords ? 'Using your location' : 'Use my location'}
          </button>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="px-4 py-3 rounded-xl border border-sand bg-white text-sm font-medium text-charcoal focus:outline-none shrink-0"
          >
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Mood filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {MOODS.map(m => (
            <button
              key={m}
              onClick={() => setMood(current => current === m ? null : m)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                mood === m ? 'bg-coral text-white border-coral' : 'bg-white text-charcoal/70 border-sand hover:border-coral/40'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-ocean text-white'
                  : 'bg-white text-charcoal/60 hover:text-charcoal border border-sand'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-charcoal/40 mb-6">Place data © Google</p>

        {/* Results */}
        {notConfigured ? (
          <div className="text-center py-20">
            <h3 className="font-heading text-xl font-semibold text-charcoal mb-2">Discover isn't connected yet</h3>
            <p className="text-sm text-charcoal/50 max-w-md mx-auto">
              This deployment doesn't have a Google Places API key configured on the Worker yet, so there's nothing real to show here.
            </p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-sand animate-pulse">
                <div className="aspect-[4/3] bg-sand" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-sand rounded w-3/4" />
                  <div className="h-3 bg-sand rounded w-1/2" />
                  <div className="h-3 bg-sand rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <h3 className="font-heading text-xl font-semibold text-charcoal mb-2">Couldn't load results</h3>
            <p className="text-sm text-charcoal/50">{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 mx-auto mb-4 text-charcoal/15" />
            <h3 className="font-heading text-xl font-semibold text-charcoal mb-2">No results found</h3>
            <p className="text-sm text-charcoal/50">Try a different category, mood, or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {results.map((place, i) => (
              <motion.div
                key={place.placeId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <DiscoverPlaceCard place={place} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
