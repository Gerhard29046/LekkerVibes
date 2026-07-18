import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import CapeTownHero from './CapeTownHero';
import TrendingCapeTown from './TrendingCapeTown';
import WhatToDoCapeTown from './WhatToDoCapeTown';
import CapeTownEvents from './CapeTownEvents';
import PopularRestaurants from './PopularRestaurants';
import CapeTownArtGalleries from './CapeTownArtGalleries';
import CapeTownCulture from './CapeTownCulture';
import CapeTownAreaExplorer from './CapeTownAreaExplorer';
import ClubsSection from '@/components/landing/ClubsSection';
import CTASection from '@/components/landing/CTASection';

// The dedicated Cape Town homepage — rendered by CityThemedHomepage when
// the selected city is Cape Town.
//
// The old standalone "Cape Town Spotlight" carousel (components/home/
// SponsoredSpotlightCarousel.jsx) has been disconnected here, not deleted
// (see CLAUDE.md's file-deletion policy) — its sponsored-listing content
// now lives inside CapeTownHero's continuous event carousel instead, so
// the same demo/sponsored placements aren't shown twice on one page.
//
// ClubsSection/CTASection are the existing default-homepage components,
// reused as-is: ClubsSection already scopes itself to whatever city is
// selected (so it naturally shows Cape Town communities here), and
// CTASection's copy is city-agnostic. It's wrapped in a warm-cream panel
// below specifically because it's a shared, light-themed component (used
// on the default homepage too) — that panel is this page's one deliberate
// "controlled cream accent" rather than a re-theme of a shared component.
export default function CapeTownHomepage() {
  const reduceMotion = useReducedMotionPreference();

  return (
    <div className="cape-town-theme relative">
      <CapeTownHero reduceMotion={reduceMotion} />

      <div className="relative">
        <AmbientPageMotion reduceMotion={reduceMotion} />
        <TrendingCapeTown reduceMotion={reduceMotion} />
        <WhatToDoCapeTown reduceMotion={reduceMotion} />
        <CapeTownEvents reduceMotion={reduceMotion} />
        <PopularRestaurants reduceMotion={reduceMotion} />
        <CapeTownArtGalleries reduceMotion={reduceMotion} />
        <CapeTownCulture reduceMotion={reduceMotion} />
        <CapeTownAreaExplorer reduceMotion={reduceMotion} />

        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="rounded-[32px] bg-cream/95 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2">
            <ClubsSection />
          </div>
        </section>

        {/* The final CTA + hand-off into the (shared, sitewide) Footer gets
            its own slightly darker background than the ambient theme above
            — otherwise the outer background, CTA card and footer all read
            as the same flat teal. The transition strip's bottom colour
            matches Footer.jsx's bg-charcoal exactly so the seam into that
            sibling component (rendered by Home.jsx, just after this one)
            is invisible. */}
        <div className="relative cta-outer-bg">
          <CTASection />
          <div className="h-16 sm:h-24 cta-footer-transition" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

// Very low-opacity drifting glows shared across the whole below-hero body
// — the "continuous theme" the spec asks for, rather than each section
// feeling like an isolated flat-colour block.
function AmbientPageMotion({ reduceMotion }) {
  if (reduceMotion) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
      <motion.div
        className="absolute left-[-10%] top-[10%] w-[420px] h-[420px] rounded-full bg-sky/10 blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[-8%] top-[45%] w-[380px] h-[380px] rounded-full bg-coral/10 blur-3xl"
        animate={{ x: [0, -40, 0], y: [0, 35, 0] }}
        transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-[15%] bottom-[10%] w-[360px] h-[360px] rounded-full bg-leaf/10 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -25, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
