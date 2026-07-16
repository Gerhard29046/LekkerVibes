import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { eventsApi, eventCategoriesApi } from '@/api/eventsApi';
import { useLocation } from '@/hooks/useLocation.jsx';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import ActivityCard from '@/components/landing/ActivityCard';
import { motion, AnimatePresence } from 'framer-motion';
import { FEATURES } from '@/lib/featureFlags';
import ComingSoon from '@/components/ComingSoon';

export default function Discover() {
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [beginnerOnly, setBeginnerOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [aloneOnly, setAloneOnly] = useState(false);
  const { selectedCity } = useLocation();

  useEffect(() => {
    if (!FEATURES.events) return;
    eventCategoriesApi.list().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!FEATURES.events) return;
    setLoading(true);
    const params = { search: search || undefined };
    if (categoryId) params.category_id = categoryId;
    if (beginnerOnly) params.is_beginner_friendly = 1;
    if (freeOnly) params.is_free = 1;
    if (aloneOnly) params.is_attend_alone_friendly = 1;

    eventsApi.list(params)
      .then(result => setActivities(result.data))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, [categoryId, beginnerOnly, freeOnly, aloneOnly, search]);

  if (!FEATURES.events) {
    return <ComingSoon feature="Discover" />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-charcoal mb-2">
            Discover in {selectedCity}
          </h1>
          <p className="text-charcoal/60 text-sm sm:text-base">
            Find activities, clubs, and experiences near you
          </p>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-sand">
            <Search className="w-4 h-4 text-charcoal/40" />
            <input
              type="text"
              placeholder="Search activities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X className="w-4 h-4 text-charcoal/40" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
              showFilters ? 'bg-ocean text-white border-ocean' : 'bg-white border-sand text-charcoal hover:border-ocean/30'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="flex flex-wrap gap-2 p-4 bg-white rounded-xl border border-sand">
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sand cursor-pointer text-sm">
                  <input type="checkbox" checked={beginnerOnly} onChange={e => setBeginnerOnly(e.target.checked)} className="rounded" />
                  Beginner friendly
                </label>
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sand cursor-pointer text-sm">
                  <input type="checkbox" checked={freeOnly} onChange={e => setFreeOnly(e.target.checked)} className="rounded" />
                  Free activities
                </label>
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sand cursor-pointer text-sm">
                  <input type="checkbox" checked={aloneOnly} onChange={e => setAloneOnly(e.target.checked)} className="rounded" />
                  Go alone friendly
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          <button
            onClick={() => setCategoryId(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              categoryId === null
                ? 'bg-ocean text-white'
                : 'bg-white text-charcoal/60 hover:text-charcoal border border-sand'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryId(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                categoryId === cat.id
                  ? 'bg-ocean text-white'
                  : 'bg-white text-charcoal/60 hover:text-charcoal border border-sand'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
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
        ) : activities.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 mx-auto mb-4 text-charcoal/15" />
            <h3 className="font-heading text-xl font-semibold text-charcoal mb-2">No activities found</h3>
            <p className="text-sm text-charcoal/50">Try adjusting your filters or searching for something else.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {activities.map((activity, i) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ActivityCard activity={activity} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}