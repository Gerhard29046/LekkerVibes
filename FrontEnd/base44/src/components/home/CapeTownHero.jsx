import React, { useState, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Search, MapPin, Sparkles, ArrowRight, ChevronDown, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '@/hooks/useClickOutside.jsx';
import { capeTownTheme } from '@/config/capeTownTheme';

gsap.registerPlugin(ScrollTrigger);

// Full-bleed Cape Town hero. Scroll-linked parallax (background image
// drifting slower than the page, foreground content fading/rising faster)
// is handled by GSAP ScrollTrigger with `scrub` — the one effect in this
// homepage genuinely suited to a scroll-position-driven animation engine
// rather than Framer's viewport-entrance model, which drives every other
// reveal on this page.
export default function CapeTownHero({ reduceMotion }) {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const bgRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [area, setArea] = useState('');
  const [areaOpen, setAreaOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const closeArea = useCallback(() => setAreaOpen(false), []);
  const areaRef = useClickOutside(areaOpen, closeArea);

  const { scrollY } = useScroll();
  const contentOpacity = useTransform(scrollY, [0, 400], [1, 0.15]);
  const contentY = useTransform(scrollY, [0, 400], [0, -60]);

  useGSAP(() => {
    if (reduceMotion || !bgRef.current) return;
    gsap.to(bgRef.current, {
      yPercent: 18,
      ease: 'none',
      scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: true },
    });
  }, { scope: heroRef, dependencies: [reduceMotion] });

  const handleExplore = () => {
    const params = new URLSearchParams({ city: 'Cape Town' });
    const search = area ? `${searchQuery} ${area}`.trim() : searchQuery.trim();
    if (search) params.set('search', search);
    navigate(`/discover?${params.toString()}`);
  };

  const handleNearMe = () => {
    if (!navigator.geolocation) return handleExplore();
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const params = new URLSearchParams({
          city: 'Cape Town',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          sort: 'nearest',
        });
        navigate(`/discover?${params.toString()}`);
      },
      () => { setLocating(false); handleExplore(); },
    );
  };

  return (
    <section ref={heroRef} className="relative min-h-[calc(100vh-72px)] flex items-center overflow-hidden">
      <div ref={bgRef} className="absolute inset-0 -top-[10%] h-[120%]">
        <img
          src={capeTownTheme.hero.images.primary}
          alt="Table Mountain rising above the clouds, seen from the cable car"
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ocean via-teal to-sky -z-10" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal/55 via-charcoal/35 to-charcoal/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-ocean/30 to-teal/10" />

      {!reduceMotion && (
        <>
          <div className="absolute top-32 right-12 w-20 h-20 rounded-full bg-coral/20 blur-xl animate-float hidden lg:block" />
          <div className="absolute bottom-40 left-16 w-32 h-32 rounded-full bg-sky/15 blur-2xl animate-float hidden lg:block" style={{ animationDelay: '1s' }} />
        </>
      )}

      <motion.div
        style={reduceMotion ? undefined : { opacity: contentOpacity, y: contentY }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-16 sm:pt-32 sm:pb-24 w-full"
      >
        <div className="max-w-3xl">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark text-white/90 text-sm mb-8"
          >
            <MapPin className="w-4 h-4 text-coral" />
            <span>{capeTownTheme.hero.eyebrow}</span>
          </motion.div>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
          >
            {capeTownTheme.hero.title.split('\n').map((line, i, arr) => (
              <React.Fragment key={line}>
                <span className={i === arr.length - 1 ? 'text-sky' : undefined}>{line}</span>
                {i < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg sm:text-xl text-white/80 max-w-xl mb-10 font-body leading-relaxed"
          >
            {capeTownTheme.hero.subtitle}
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-2 sm:p-3 max-w-2xl"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-white/50">
                <Search className="w-4 h-4 text-ocean/60 shrink-0" />
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleExplore()}
                  className="w-full bg-transparent text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none"
                />
              </div>

              <div ref={areaRef} className="relative">
                <button
                  onClick={() => setAreaOpen(!areaOpen)}
                  aria-haspopup="listbox"
                  aria-expanded={areaOpen}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/50 text-sm text-charcoal w-full sm:w-auto"
                >
                  <MapPin className="w-4 h-4 text-coral shrink-0" />
                  <span className="truncate">{area || 'Anywhere in Cape Town'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-charcoal/40 shrink-0" />
                </button>
                {areaOpen && (
                  <div role="listbox" className="absolute top-full mt-2 left-0 right-0 sm:right-auto bg-white rounded-xl shadow-xl border border-sand p-2 min-w-[200px] max-h-[60vh] overflow-y-auto z-40">
                    <button role="option" aria-selected={area === ''} onClick={() => { setArea(''); setAreaOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${area === '' ? 'bg-ocean/10 text-ocean font-medium' : 'hover:bg-sand'}`}>
                      Anywhere in Cape Town
                    </button>
                    {capeTownTheme.areas.map((a) => (
                      <button key={a.slug} role="option" aria-selected={area === a.name} onClick={() => { setArea(a.name); setAreaOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${area === a.name ? 'bg-ocean/10 text-ocean font-medium' : 'hover:bg-sand'}`}>
                        {a.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={handleNearMe} disabled={locating}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/50 text-sm text-charcoal hover:bg-white/70 transition-colors disabled:opacity-60">
                <Navigation className={`w-4 h-4 text-coral ${locating ? 'animate-pulse' : ''}`} />
                Near me
              </button>

              <button
                onClick={handleExplore}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-ocean to-teal text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-ocean/30 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Explore
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap gap-2 mt-6"
          >
            {capeTownTheme.shortcuts.map((shortcut) => (
              <motion.button
                key={shortcut.label}
                whileHover={reduceMotion ? {} : { y: -2, scale: 1.04 }}
                whileTap={reduceMotion ? {} : { scale: 0.97 }}
                onClick={() => {
                  const params = new URLSearchParams({ city: 'Cape Town' });
                  if (shortcut.category) params.set('category', shortcut.category);
                  if (shortcut.mood) params.set('mood', shortcut.mood);
                  navigate(`/discover?${params.toString()}`);
                }}
                className="px-4 py-1.5 rounded-full text-xs font-semibold glass-dark text-white/85 border border-white/10 hover:bg-white/20 transition-colors"
              >
                {shortcut.label}
              </motion.button>
            ))}
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            className="flex flex-wrap gap-3 mt-8"
          >
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-coral text-white text-sm font-medium hover:bg-coral/90 transition-all"
            >
              Join LekkerVibes
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
          <motion.div
            animate={reduceMotion ? {} : { y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-white/60"
          />
        </div>
      </motion.div>
    </section>
  );
}
