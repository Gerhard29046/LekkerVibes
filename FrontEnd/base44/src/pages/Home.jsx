import React from 'react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import CityThemedHomepage from '@/components/home/CityThemedHomepage';

export default function Home() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <CityThemedHomepage />
      <Footer />
    </div>
  );
}