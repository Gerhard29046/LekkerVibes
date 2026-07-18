import React from 'react';
import { motion } from 'framer-motion';
import { Landmark, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import { capeTownImages } from '@/config/capeTownImages';
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
    <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6">
      <motion.div
        className="absolute inset-0 -z-20"
        initial={reduceMotion ? false : { scale: 1 }}
        whileInView={reduceMotion ? undefined : { scale: 1.12 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 12, ease: 'easeOut' }}
      >
        <img src={capeTownImages.areas.cityBowl} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      </motion.div>
      <div
        className="absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(135deg, rgba(217,119,6,0.22), rgba(249,115,102,0.13), rgba(13,76,88,0.92))' }}
      />

      <div className="relative max-w-7xl mx-auto">
        <SectionHeading
          eyebrow={<span className="flex items-center gap-2"><Landmark className="w-4 h-4" /> LOCAL CULTURE</span>}
          title="Experience Cape Town culture"
          reduceMotion={reduceMotion}
          accent="text-[#FDBA8C]"
          direction="left"
        />

        <div className="flex flex-wrap gap-2 mb-8">
          {CULTURE_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              to={`/discover?city=Cape%20Town&search=${encodeURIComponent(cat)}`}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/15 transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>

        {status === 'loading' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-white/20 animate-pulse">
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
            <p className="text-sm text-white/70 mb-4">We couldn’t load Cape Town culture listings right now.</p>
            <button onClick={retry} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors">
              <RotateCcw className="w-4 h-4" /> Try again
            </button>
          </div>
        )}

        {status === 'success' && results.length === 0 && (
          <div className="text-center py-16 text-white/60">
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
      </div>
    </section>
  );
}
