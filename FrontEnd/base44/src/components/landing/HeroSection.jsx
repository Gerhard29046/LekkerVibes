import React, { useState } from 'react';
import { Search, MapPin, Sparkles, ArrowRight, ChevronDown } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation.jsx';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const MOODS = [
  'Meet people', 'Be active', 'Something chilled', 'Go out tonight',
  'Something outdoors', 'Alcohol-free', 'Creative', 'Beginner-friendly'
];

export default function HeroSection() {
  const { selectedCity, setSelectedCity, cities } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600&q=80"
          alt="People hiking together at sunset"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/40 to-charcoal/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-ocean/30 to-teal/20" />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-32 right-12 w-20 h-20 rounded-full bg-coral/20 blur-xl animate-float hidden lg:block" />
      <div className="absolute bottom-40 left-16 w-32 h-32 rounded-full bg-sky/15 blur-2xl animate-float hidden lg:block" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-16 sm:pt-32 sm:pb-24 w-full">
        <div className="max-w-3xl">
          {/* Location badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark text-white/90 text-sm mb-8"
          >
            <MapPin className="w-4 h-4 text-coral" />
            <span>Discovering in <strong>{selectedCity}</strong></span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
          >
            Find your people.
            <br />
            <span className="text-sky">Find your place.</span>
            <br />
            Find your vibe.
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg sm:text-xl text-white/80 max-w-xl mb-10 font-body leading-relaxed"
          >
            Discover nearby events, clubs, communities and real-life experiences
            created around the things you already enjoy.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-2 sm:p-3 max-w-2xl"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Activity search */}
              <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-white/50">
                <Search className="w-4 h-4 text-ocean/60 shrink-0" />
                <input
                  type="text"
                  placeholder="What are you in the mood for?"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none"
                />
              </div>

              {/* Location */}
              <div className="relative">
                <button
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/50 text-sm text-charcoal w-full sm:w-auto"
                >
                  <MapPin className="w-4 h-4 text-coral shrink-0" />
                  <span className="truncate">{selectedCity}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-charcoal/40 shrink-0" />
                </button>
                {showLocationDropdown && (
                  <div className="absolute top-full mt-1 left-0 right-0 sm:right-auto bg-white rounded-xl shadow-xl border border-sand p-2 min-w-[180px] z-20">
                    {cities.map(city => (
                      <button
                        key={city}
                        onClick={() => { setSelectedCity(city); setShowLocationDropdown(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedCity === city ? 'bg-ocean/10 text-ocean font-medium' : 'hover:bg-sand'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Explore button */}
              <Link
                to="/discover"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-ocean to-teal text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-ocean/30 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Explore
              </Link>
            </div>
          </motion.div>

          {/* Quick mood pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap gap-2 mt-6"
          >
            {MOODS.map(mood => (
              <Link
                key={mood}
                to="/discover"
                className="px-4 py-1.5 rounded-full glass-dark text-white/80 text-xs font-medium hover:bg-white/20 transition-colors cursor-pointer"
              >
                {mood}
              </Link>
            ))}
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap gap-3 mt-10"
          >
            <Link
              to="/discover"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur text-white text-sm font-medium hover:bg-white/20 transition-all border border-white/10"
            >
              <MapPin className="w-4 h-4 text-coral" />
              Explore nearby
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-coral text-white text-sm font-medium hover:bg-coral/90 transition-all"
            >
              Join LekkerVibes
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-white/60"
          />
        </div>
      </motion.div>
    </section>
  );
}