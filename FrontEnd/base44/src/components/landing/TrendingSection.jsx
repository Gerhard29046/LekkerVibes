import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { eventsApi } from '@/api/eventsApi';
import ActivityCard from '@/components/landing/ActivityCard';
import { useLocation } from '@/hooks/useLocation.jsx';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FEATURES } from '@/lib/featureFlags';

export default function TrendingSection() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedCity } = useLocation();

  useEffect(() => {
    if (!FEATURES.events) return;
    setLoading(true);
    eventsApi.list({ city: selectedCity })
      .then(result => setActivities(result.slice(0, 4)))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, [selectedCity]);

  if (!FEATURES.events) return null;

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-8 sm:mb-12">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 text-coral text-sm font-semibold mb-2"
          >
            <TrendingUp className="w-4 h-4" />
            TRENDING NEAR YOU
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal"
          >
            What {selectedCity} is buzzing about
          </motion.h2>
        </div>
        <Link to="/discover" className="hidden sm:flex items-center gap-1 text-sm font-medium text-ocean hover:text-teal transition-colors">
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {activities.map((activity, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <ActivityCard activity={activity} />
            </motion.div>
          ))}
        </div>
      )}

      <Link to="/discover" className="sm:hidden flex items-center justify-center gap-1 text-sm font-medium text-ocean mt-6">
        View all activities <ArrowRight className="w-4 h-4" />
      </Link>
    </section>
  );
}