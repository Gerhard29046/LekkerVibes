import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mountain, Waves, UtensilsCrossed, Palette, Baby, HeartPulse,
  Landmark, Moon, Church, Star,
} from 'lucide-react';
import { discoverApi } from '@/api/discoverApi';
import { capeTownTheme } from '@/config/capeTownTheme';
import DiscoverPlaceCard from '@/components/landing/DiscoverPlaceCard';
import SectionHeading from './SectionHeading';
import { staggerContainer, staggerItem } from '@/hooks/useScrollReveal';

const ICONS = {
  'Outdoor adventures': Mountain, 'Beaches & ocean': Waves, 'Food & markets': UtensilsCrossed,
  'Art & culture': Palette, 'Family activities': Baby, Wellness: HeartPulse,
  Heritage: Landmark, Nightlife: Moon, 'Faith & community': Church, 'Beginner-friendly': Star,
};

const COLOURS = {
  leaf: { hex: '#65A30D', text: 'text-leaf', border: 'border-leaf/30' },
  sky: { hex: '#7DD3FC', text: 'text-ocean', border: 'border-sky/40' },
  coral: { hex: '#F97366', text: 'text-coral', border: 'border-coral/30' },
  teal: { hex: '#0F766E', text: 'text-teal', border: 'border-teal/30' },
  peach: { hex: '#FDBA8C', text: 'text-charcoal', border: 'border-peach/50' },
  ocean: { hex: '#164E63', text: 'text-ocean', border: 'border-ocean/30' },
};

export default function WhatToDoCapeTown({ reduceMotion }) {
  const [active, setActive] = useState(capeTownTheme.whatToDo[0]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    discoverApi.search({ city: 'Cape Town', search: active.query })
      .then((data) => { if (!cancelled) setResults((data.results || []).slice(0, 6)); })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [active]);

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <SectionHeading eyebrow="EXPLORE" title="What to do in Cape Town" reduceMotion={reduceMotion} accent="text-teal" />

      <div className="flex flex-wrap gap-3 mb-10">
        {capeTownTheme.whatToDo.map((tab) => {
          const Icon = ICONS[tab.label] || Star;
          const c = COLOURS[tab.colour] || COLOURS.teal;
          const isActive = active.label === tab.label;
          return (
            <motion.button
              key={tab.label}
              onClick={() => setActive(tab)}
              whileHover={reduceMotion ? {} : { y: -3 }}
              whileTap={reduceMotion ? {} : { scale: 0.97 }}
              className={`relative flex items-center gap-2.5 px-4 py-3 rounded-2xl border-2 font-bold text-sm transition-colors ${
                isActive ? `${c.text} ${c.border}` : 'bg-white text-charcoal/60 border-sand hover:border-charcoal/20'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="what-to-do-active"
                  className="absolute inset-0 rounded-2xl -z-10"
                  style={{ background: `${c.hex}1A` }}
                  transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <Icon className="w-4 h-4" />
              {tab.label}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active.label}
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
        >
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-sand animate-pulse">
                  <div className="aspect-[4/3] bg-sand" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-sand rounded w-3/4" />
                    <div className="h-3 bg-sand rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 text-charcoal/50">
              <p className="text-sm">Nothing found for {active.label.toLowerCase()} right now.</p>
            </div>
          ) : (
            <motion.div
              initial={reduceMotion ? false : 'hidden'}
              animate="show"
              variants={reduceMotion ? undefined : staggerContainer(0.06)}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {results.map((place) => (
                <motion.div key={place.placeId} variants={reduceMotion ? undefined : staggerItem('up')}>
                  <DiscoverPlaceCard place={place} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
