import React, { useState, useEffect } from 'react';
import { Users, ArrowRight, MapPin } from 'lucide-react';
import { communitiesApi } from '@/api/communitiesApi';
import { useLocation } from '@/hooks/useLocation.jsx';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FEATURES } from '@/lib/featureFlags';

export default function ClubsSection() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedCity } = useLocation();

  useEffect(() => {
    if (!FEATURES.communities) return;
    setLoading(true);
    communitiesApi.list({ city: selectedCity })
      .then(result => setClubs(result.slice(0, 4)))
      .catch(() => setClubs([]))
      .finally(() => setLoading(false));
  }, [selectedCity]);

  if (!FEATURES.communities) return null;

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-8 sm:mb-12">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-ocean text-sm font-semibold mb-2 uppercase tracking-wide"
          >
            Local Favourites
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-body text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal"
          >
            Popular communities in {selectedCity}
          </motion.h2>
        </div>
        <Link to="/clubs" className="hidden sm:flex items-center gap-1 text-sm font-medium text-ocean hover:text-teal transition-colors">
          All communities <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-sand animate-pulse">
              <div className="w-16 h-16 rounded-2xl bg-sand mb-4" />
              <div className="h-4 bg-sand rounded w-3/4 mb-2" />
              <div className="h-3 bg-sand rounded w-full mb-4" />
              <div className="h-3 bg-sand rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-16 text-charcoal/50">
          <Users className="w-10 h-10 mx-auto mb-3 text-charcoal/20" />
          <p className="text-sm">No communities found in {selectedCity} yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {clubs.map((club, i) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={`/club/${club.id}`} className="group block">
                <div className="bg-white rounded-2xl overflow-hidden border border-sand/80 card-hover shadow-sm">
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={club.imageURL || 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600'}
                      alt={club.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="font-body font-semibold text-charcoal text-base line-clamp-1 flex-1 group-hover:text-ocean transition-colors">
                        {club.name}
                      </h3>
                    </div>
                    <p className="text-xs text-charcoal/60 line-clamp-2 mb-3">{club.description}</p>
                    <div className="flex items-center justify-between text-xs text-charcoal/50">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {club.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {club.memberCount} members
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}