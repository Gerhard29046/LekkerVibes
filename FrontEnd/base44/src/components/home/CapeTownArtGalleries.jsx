import React from 'react';
import { motion } from 'framer-motion';
import { Palette, RotateCcw } from 'lucide-react';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import SectionHeading from './SectionHeading';
import PlaceCard from './PlaceCard';
import GooglePlaceAttribution from './GooglePlaceAttribution';
import { staggerContainer, staggerItem } from '@/hooks/useScrollReveal';

// Editorial layout — one large feature gallery beside smaller ones, and a
// monochrome-to-colour hover treatment (via PlaceCard's variant="editorial")
// — deliberately different from PopularRestaurants' plain grid so back-to
// -back sections don't feel identical.
export default function CapeTownArtGalleries({ reduceMotion }) {
  const { status, results, retry } = useGooglePlaces('art galleries', { city: 'Cape Town', limit: 5 });

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto bg-sand/30 rounded-[32px] my-8">
      <SectionHeading
        eyebrow={<span className="flex items-center gap-2"><Palette className="w-4 h-4" /> CREATIVE CAPE TOWN</span>}
        title="Art galleries and creative Cape Town"
        reduceMotion={reduceMotion}
        accent="text-teal"
      />

      {status === 'loading' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="sm:col-span-2 sm:row-span-2 aspect-[16/10] bg-white border border-sand rounded-2xl animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-white border border-sand rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="text-center py-16">
          <p className="text-sm text-charcoal/60 mb-4">We couldn’t load Cape Town galleries right now.</p>
          <button onClick={retry} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal/10 text-teal text-sm font-semibold hover:bg-teal/20 transition-colors">
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
        </div>
      )}

      {status === 'success' && results.length === 0 && (
        <div className="text-center py-16 text-charcoal/50">
          <p className="text-sm">No galleries found right now.</p>
        </div>
      )}

      {status === 'success' && results.length > 0 && (
        <>
          <motion.div
            initial={reduceMotion ? false : 'hidden'}
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={reduceMotion ? undefined : staggerContainer(0.08)}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-4"
          >
            {results.map((place, i) => (
              <motion.div key={place.id} variants={reduceMotion ? undefined : staggerItem(i % 2 === 0 ? 'left' : 'right')}>
                <PlaceCard place={place} variant="editorial" size={i === 0 ? 'large' : 'normal'} reduceMotion={reduceMotion} />
              </motion.div>
            ))}
          </motion.div>
          <GooglePlaceAttribution />
        </>
      )}
    </section>
  );
}
