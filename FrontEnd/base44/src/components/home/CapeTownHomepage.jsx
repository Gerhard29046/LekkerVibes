import React from 'react';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import CapeTownHero from './CapeTownHero';
import SponsoredSpotlightCarousel from './SponsoredSpotlightCarousel';
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
// the selected city is Cape Town. ClubsSection/CTASection are the existing
// default-homepage components, reused as-is: ClubsSection already scopes
// itself to whatever city is selected (so it naturally shows Cape Town
// communities here), and CTASection's copy is city-agnostic. Building a
// separate near-duplicate "CapeTownCommunitySection" purely to re-query the
// same communitiesApi.list({ city }) would just be the same component twice.
export default function CapeTownHomepage() {
  const reduceMotion = useReducedMotionPreference();

  return (
    <div className="bg-cream">
      <CapeTownHero reduceMotion={reduceMotion} />
      <SponsoredSpotlightCarousel reduceMotion={reduceMotion} />
      <TrendingCapeTown reduceMotion={reduceMotion} />
      <WhatToDoCapeTown reduceMotion={reduceMotion} />
      <CapeTownEvents reduceMotion={reduceMotion} />
      <PopularRestaurants reduceMotion={reduceMotion} />
      <CapeTownArtGalleries reduceMotion={reduceMotion} />
      <CapeTownCulture reduceMotion={reduceMotion} />
      <CapeTownAreaExplorer reduceMotion={reduceMotion} />
      <ClubsSection />
      <CTASection />
    </div>
  );
}
