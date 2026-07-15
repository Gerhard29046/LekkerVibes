import React from 'react';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import TrendingSection from '@/components/landing/TrendingSection';
import GoAloneSection from '@/components/landing/GoAloneSection';
import MoodSelector from '@/components/landing/MoodSelector';
import FindCrewSection from '@/components/landing/FindCrewSection';
import ClubsSection from '@/components/landing/ClubsSection';
import Footer from '@/components/landing/Footer';
import CTASection from '@/components/landing/CTASection';

export default function Home() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <HeroSection />
      <TrendingSection />
      <GoAloneSection />
      <MoodSelector />
      <ClubsSection />
      <FindCrewSection />
      <CTASection />
      <Footer />
    </div>
  );
}