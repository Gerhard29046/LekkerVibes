import React, { useState, useEffect } from 'react';
import { Search, Users, MapPin, Plus } from 'lucide-react';
import { communitiesApi } from '@/api/communitiesApi';
import { useLocation } from '@/hooks/useLocation.jsx';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FEATURES } from '@/lib/featureFlags';
import ComingSoon from '@/components/ComingSoon';

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const { selectedCity } = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!FEATURES.communities) return;
    setLoading(true);
    setError(false);
    communitiesApi.list({ city: selectedCity })
      .then(setClubs)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [selectedCity]);

  if (!FEATURES.communities) {
    return <ComingSoon feature="Communities" />;
  }

  const filtered = search
    ? clubs.filter((c) =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase()))
    : clubs;

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-charcoal mb-2">
              Communities in {selectedCity}
            </h1>
            <p className="text-charcoal/60 text-sm sm:text-base">
              Find your crew and join clubs that match your interests
            </p>
          </div>
          {user && (
            <Link
              to="/create-club"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-ocean to-teal text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-ocean/20 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" /> Create a Group
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-sand mb-8 max-w-md">
          <Search className="w-4 h-4 text-charcoal/40" />
          <input
            type="text"
            placeholder="Search communities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-sand animate-pulse">
                <div className="h-36 bg-sand" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-sand rounded w-2/3" />
                  <div className="h-3 bg-sand rounded w-full" />
                  <div className="h-3 bg-sand rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <h3 className="font-heading text-xl font-semibold text-charcoal mb-2">Couldn't load communities</h3>
            <p className="text-sm text-charcoal/50">Something went wrong — please try again shortly.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 mx-auto mb-4 text-charcoal/15" />
            <h3 className="font-heading text-xl font-semibold text-charcoal mb-2">No communities found</h3>
            <p className="text-sm text-charcoal/50">Be the first to start one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((club, i) => (
              <motion.div
                key={club.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/club/${club.id}`} className="group block">
                  <div className="bg-white rounded-2xl overflow-hidden border border-sand card-hover shadow-sm">
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={club.imageURL || 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600'}
                        alt={club.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-heading font-semibold text-charcoal text-lg group-hover:text-ocean transition-colors">
                          {club.name}
                        </h3>
                      </div>
                      <p className="text-sm text-charcoal/60 line-clamp-2 mb-4">{club.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-charcoal/50">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {club.city}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {club.memberCount} member{club.memberCount === 1 ? '' : 's'}
                          </span>
                        </div>
                        {club.category && (
                          <span className="px-3 py-1 rounded-full bg-sand text-charcoal/60 text-[11px] font-medium capitalize">
                            {club.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
