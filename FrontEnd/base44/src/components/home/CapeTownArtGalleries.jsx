import React from 'react';
import { motion } from 'framer-motion';
import { Palette, RotateCcw } from 'lucide-react';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import SectionHeading from './SectionHeading';
import PlaceCard from './PlaceCard';
import GooglePlaceAttribution from './GooglePlaceAttribution';

// Editorial layout — one large feature gallery beside smaller ones, and a
// scroll-triggered monochrome-to-colour reveal (a `filter` animation on
// each card's wrapper — CSS filter on a parent already recolours
// everything painted inside it) — deliberately different from
// PopularRestaurants' plain grid so back-to-back sections don't feel
// identical.
export default function CapeTownArtGalleries({ reduceMotion }) {
  const { status, results, retry } = useGooglePlaces('art galleries', { city: 'Cape Town', limit: 5 });

  return (
    <section
      className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto rounded-[32px] my-8"
      style={{ background: 'linear-gradient(135deg, #17272e, #26363c)' }}
    >
      <SectionHeading
        eyebrow={<span className="flex items-center gap-2"><Palette className="w-4 h-4" /> CREATIVE CAPE TOWN</span>}
        title="Art galleries and creative Cape Town"
        reduceMotion={reduceMotion}
        accent="text-[#5EEAD4]"
      />

      {status === 'loading' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="sm:col-span-2 sm:row-span-2 aspect-[16/10] bg-white/10 border border-white/10 rounded-2xl animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-white/10 border border-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="text-center py-16">
          <p className="text-sm text-white/70 mb-4">We couldn’t load Cape Town galleries right now.</p>
          <button onClick={retry} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors">
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
        </div>
      )}

      {status === 'success' && results.length === 0 && (
        <div className="text-center py-16 text-white/60">
          <p className="text-sm">No galleries found right now.</p>
        </div>
      )}

      {status === 'success' && results.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-4">
            {results.map((place, i) => (
              <motion.div
                key={place.id}
                initial={reduceMotion ? false : { opacity: 0, y: 36, filter: 'grayscale(1) brightness(0.85)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'grayscale(0) brightness(1)' }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
                className={i === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}
              >
                <PlaceCard place={place} size={i === 0 ? 'large' : 'normal'} reduceMotion={reduceMotion} />
              </motion.div>
            ))}
          </div>
          <GooglePlaceAttribution />
        </>
      )}
    </section>
  );
}
