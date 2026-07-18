import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Compass } from 'lucide-react';
import { capeTownTheme } from '@/config/capeTownTheme';
import SectionHeading from './SectionHeading';
import ImageReveal from './ImageReveal';

// Only the two reveal variants confirmed (via a real browser test) to
// reliably resolve to visible — see the note in ImageReveal.jsx.
const REVEAL_VARIANTS = ['scale', 'blur'];

export default function CapeTownAreaExplorer({ reduceMotion }) {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <SectionHeading
        eyebrow={<span className="flex items-center gap-2"><Compass className="w-4 h-4" /> AREAS</span>}
        title="Explore Cape Town by area"
        reduceMotion={reduceMotion}
        accent="text-sky"
      />

      {/* Mobile: horizontal scroll. Desktop: editorial grid. Cards enter with
          a slight alternating rotation that settles flat — a gentle "fan"
          rather than a plain fade, using only transform/opacity. */}
      <div className="sm:hidden -mx-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-4 w-max pb-2">
          {capeTownTheme.areas.map((area, i) => (
            <FanIn key={area.slug} index={i} reduceMotion={reduceMotion} className="w-[78vw] shrink-0">
              <AreaCard area={area} variant={REVEAL_VARIANTS[i % REVEAL_VARIANTS.length]} reduceMotion={reduceMotion} />
            </FanIn>
          ))}
        </div>
      </div>

      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-5">
        {capeTownTheme.areas.map((area, i) => (
          <FanIn key={area.slug} index={i} reduceMotion={reduceMotion}>
            <AreaCard area={area} variant={REVEAL_VARIANTS[i % REVEAL_VARIANTS.length]} reduceMotion={reduceMotion} />
          </FanIn>
        ))}
      </div>
    </section>
  );
}

function FanIn({ index, reduceMotion, className = '', children }) {
  const rotate = index % 2 === 0 ? -6 : 6;
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 30, rotate, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AreaCard({ area, variant, reduceMotion }) {
  return (
    <Link
      to={`/discover?city=Cape%20Town&search=${encodeURIComponent(area.name)}`}
      className="group block rounded-2xl overflow-hidden border border-sand/80 bg-white shadow-sm hover:shadow-lg transition-shadow"
    >
      <ImageReveal
        src={area.image}
        alt={area.name}
        variant={variant}
        reduceMotion={reduceMotion}
        className="aspect-[4/3]"
        imgClassName="group-hover:scale-110 transition-transform duration-500"
      />
      <div className="p-4">
        <h3 className="font-body font-semibold text-charcoal text-base mb-1 group-hover:text-ocean transition-colors">{area.name}</h3>
        <p className="text-xs text-charcoal/60 line-clamp-2 mb-3">{area.description}</p>
        <motion.span
          whileHover={reduceMotion ? {} : { x: 4 }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-ocean"
        >
          Explore <ArrowRight className="w-3.5 h-3.5" />
        </motion.span>
      </div>
    </Link>
  );
}
