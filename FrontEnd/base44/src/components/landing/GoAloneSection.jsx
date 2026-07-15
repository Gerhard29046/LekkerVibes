import React, { useState, useEffect } from 'react';
import { Heart, ArrowRight } from 'lucide-react';
import { eventsApi } from '@/api/eventsApi';
import ActivityCard from '@/components/landing/ActivityCard';
import { useLocation } from '@/hooks/useLocation.jsx';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function GoAloneSection() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedCity } = useLocation();

  useEffect(() => {
    setLoading(true);
    eventsApi.list({ is_attend_alone_friendly: 1, per_page: 4 })
      .then(result => setActivities(result.data))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, [selectedCity]);

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="relative bg-gradient-to-br from-ocean/5 via-teal/5 to-sky/10 rounded-3xl p-6 sm:p-10 md:p-14 overflow-hidden">
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-coral/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-sky/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-end justify-between mb-8 sm:mb-12">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-2 text-teal text-sm font-semibold mb-2"
              >
                <Heart className="w-4 h-4" />
                GO ALONE, FEEL WELCOME
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal"
              >
                You don't need a plus-one
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
                className="text-charcoal/60 mt-2 max-w-lg text-sm sm:text-base"
              >
                Activities specifically designed for people attending on their own. Friendly hosts, welcoming groups, and easy first steps.
              </motion.p>
            </div>
            <Link to="/discover" className="hidden sm:flex items-center gap-1 text-sm font-medium text-ocean hover:text-teal transition-colors">
              See more <ArrowRight className="w-4 h-4" />
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
        </div>
      </div>
    </section>
  );
}