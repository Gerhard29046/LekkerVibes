import React from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, RotateCcw } from 'lucide-react';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import SectionHeading from './SectionHeading';
import PlaceCard from './PlaceCard';
import GooglePlaceAttribution from './GooglePlaceAttribution';
import { staggerContainer, staggerItem } from '@/hooks/useScrollReveal';

export default function PopularRestaurants({ reduceMotion }) {
  const { status, results, retry } = useGooglePlaces('popular restaurants', { city: 'Cape Town', limit: 6 });

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <SectionHeading
        eyebrow={<span className="flex items-center gap-2"><UtensilsCrossed className="w-4 h-4" /> EAT & DRINK</span>}
        title="Popular restaurants in Cape Town"
        reduceMotion={reduceMotion}
        accent="text-coral"
      />

      {status === 'loading' && (
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
      )}

      {status === 'error' && (
        <div className="text-center py-16">
          <p className="text-sm text-white/70 mb-4">We couldn’t load Cape Town restaurants right now.</p>
          <button onClick={retry} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors">
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
        </div>
      )}

      {status === 'success' && results.length === 0 && (
        <div className="text-center py-16 text-white/60">
          <p className="text-sm">No restaurants found right now.</p>
        </div>
      )}

      {status === 'success' && results.length > 0 && (
        <>
          <motion.div
            initial={reduceMotion ? false : 'hidden'}
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={reduceMotion ? undefined : staggerContainer(0.08)}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-4"
          >
            {results.map((place) => (
              <motion.div key={place.id} variants={reduceMotion ? undefined : staggerItem('up')} className="relative overflow-hidden rounded-2xl">
                <PlaceCard place={place} reduceMotion={reduceMotion} />
                {!reduceMotion && (
                  <motion.div
                    initial={{ scaleX: 1 }}
                    whileInView={{ scaleX: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1], delay: 0.1 }}
                    style={{ transformOrigin: 'right', background: 'linear-gradient(135deg, #0F766E, #0D9488)' }}
                    className="pointer-events-none absolute inset-0 z-20 rounded-2xl"
                  />
                )}
              </motion.div>
            ))}
          </motion.div>
          <GooglePlaceAttribution />
        </>
      )}
    </section>
  );
}
