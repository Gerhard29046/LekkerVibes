import React from 'react';
import { motion } from 'framer-motion';
import { Landmark, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import SectionHeading from './SectionHeading';
import PlaceCard from './PlaceCard';
import GooglePlaceAttribution from './GooglePlaceAttribution';
import { staggerContainer, staggerItem } from '@/hooks/useScrollReveal';

// Curated categories are short, LekkerVibes-written labels only — no
// fabricated hours/ratings/history here, that's why the actual listings
// below come straight from Google Places rather than editorial copy.
const CULTURE_CATEGORIES = [
  'Heritage sites', 'Museums', 'Local markets', 'Public art', 'Music venues',
  'Cultural centres', 'Historic districts', 'Food experiences', 'Community projects', 'Creative workshops',
];

export default function CapeTownCulture({ reduceMotion }) {
  const { status, results, retry } = useGooglePlaces('cultural attractions and heritage sites', { city: 'Cape Town', limit: 6 });

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <SectionHeading
        eyebrow={<span className="flex items-center gap-2"><Landmark className="w-4 h-4" /> LOCAL CULTURE</span>}
        title="Experience Cape Town culture"
        reduceMotion={reduceMotion}
        accent="text-leaf"
      />

      <div className="flex flex-wrap gap-2 mb-8">
        {CULTURE_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            to={`/discover?city=Cape%20Town&search=${encodeURIComponent(cat)}`}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-leaf/10 text-leaf hover:bg-leaf/20 transition-colors"
          >
            {cat}
          </Link>
        ))}
      </div>

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
          <p className="text-sm text-charcoal/60 mb-4">We couldn’t load Cape Town culture listings right now.</p>
          <button onClick={retry} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-leaf/10 text-leaf text-sm font-semibold hover:bg-leaf/20 transition-colors">
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
        </div>
      )}

      {status === 'success' && results.length === 0 && (
        <div className="text-center py-16 text-charcoal/50">
          <p className="text-sm">Nothing found right now.</p>
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
              <motion.div key={place.id} variants={reduceMotion ? undefined : staggerItem('up')}>
                <PlaceCard place={place} reduceMotion={reduceMotion} />
              </motion.div>
            ))}
          </motion.div>
          <GooglePlaceAttribution />
        </>
      )}
    </section>
  );
}
