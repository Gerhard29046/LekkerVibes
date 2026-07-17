import React from 'react';
import { useSelectedCity } from '@/hooks/useSelectedCity';
import CapeTownHomepage from './CapeTownHomepage';
import HeroSection from '@/components/landing/HeroSection';
import TrendingSection from '@/components/landing/TrendingSection';
import GoAloneSection from '@/components/landing/GoAloneSection';
import MoodSelector from '@/components/landing/MoodSelector';
import ClubsSection from '@/components/landing/ClubsSection';
import FindCrewSection from '@/components/landing/FindCrewSection';
import CTASection from '@/components/landing/CTASection';

// Single decision point for "does the selected city get a dedicated themed
// homepage" — every city other than Cape Town (Bellville, Durbanville,
// George, Gqeberha, Paarl, Somerset West, Stellenbosch) falls through to the
// same default homepage sections Home.jsx always rendered, untouched.
export default function CityThemedHomepage() {
  const { slug } = useSelectedCity();

  if (slug === 'cape-town') {
    return <CapeTownHomepage />;
  }

  return (
    <>
      <HeroSection />
      <TrendingSection />
      <GoAloneSection />
      <MoodSelector />
      <ClubsSection />
      <FindCrewSection />
      <CTASection />
    </>
  );
}
