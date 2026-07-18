import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Search, MapPin, Sparkles, ChevronDown, Navigation, Mountain, ShoppingBasket, UtensilsCrossed, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useClickOutside } from '@/hooks/useClickOutside.jsx';
import { capeTownTheme } from '@/config/capeTownTheme';
import HeroEventCarousel from './HeroEventCarousel';

gsap.registerPlugin(ScrollTrigger);

const SHORTCUT_ICONS = { mountain: Mountain, 'shopping-basket': ShoppingBasket, utensils: UtensilsCrossed };

// Full-bleed Cape Town hero. Scroll-linked parallax (background image
// drifting slower than the page, foreground content fading/rising faster)
// is handled by GSAP ScrollTrigger with `scrub` — the one effect in this
// homepage genuinely suited to a scroll-position-driven animation engine
// rather than Framer's viewport-entrance model, which drives every other
// reveal on this page.
export default function CapeTownHero({ reduceMotion }) {
  const navigate = useNavigate();
  const location = useLocation();
  const heroRef = useRef(null);
  const bgRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [area, setArea] = useState('');
  const [areaOpen, setAreaOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const closeArea = useCallback(() => setAreaOpen(false), []);
  const areaRef = useClickOutside(areaOpen, closeArea);

  // Belt-and-braces: this component only lives on the Home route so a real
  // navigation always unmounts it anyway, but close on any route/query
  // change regardless rather than assume that's the only way this ever
  // stays mounted.
  useEffect(() => { setAreaOpen(false); }, [location.pathname, location.search]);

  // Losing window focus (switching tabs/apps) shouldn't leave a stale
  // dropdown visibly open when the user comes back to a different context.
  useEffect(() => {
    const handleBlur = () => setAreaOpen(false);
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  const { scrollY } = useScroll();
  const contentOpacity = useTransform(scrollY, [0, 400], [1, 0.15]);
  const contentY = useTransform(scrollY, [0, 400], [0, -60]);

  useGSAP(() => {
    if (reduceMotion || !bgRef.current) return;
    gsap.to(bgRef.current, {
      yPercent: 14,
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
    <section ref={heroRef} className="relative min-h-[850px] lg:min-h-[calc(100vh-72px)] flex flex-col overflow-hidden">
      {/* Background photo — Table Mountain stays centre/right and bright;
          content lives on the left, so the framing itself (object-position)
          does the work rather than a heavy overlay hiding the mountain. */}
      <motion.div
        ref={bgRef}
        initial={reduceMotion ? false : { opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 -top-[8%] h-[116%]"
      >
        <img
          src={capeTownTheme.hero.images.primary}
          alt="Table Mountain and the Cape Town coastline at golden hour"
          className="w-full h-full object-cover"
          style={{ objectPosition: '64% 42%' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ocean via-teal to-sky -z-10" />
      </motion.div>

      {/* Two controlled gradients only — top strip for nav readability, a
          left-side wash for the text column. The centre/right of the
          mountain is deliberately left bright and uncovered. */}
      <div
        className="absolute inset-x-0 top-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.12) 24%, transparent 48%)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, rgba(5,28,36,0.9) 0%, rgba(5,28,36,0.68) 30%, rgba(5,28,36,0.14) 62%, transparent 100%)' }}
      />

      <AmbientHeroMotion reduceMotion={reduceMotion} />

      <motion.div
        style={reduceMotion ? undefined : { opacity: contentOpacity, y: contentY }}
        className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-6 sm:pt-32 w-full"
      >
        <div className="max-w-[600px]">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark text-white/90 text-sm mb-6"
          >
            <MapPin className="w-4 h-4 text-coral" />
            <span>{capeTownTheme.hero.eyebrow}</span>
          </motion.div>

          <h1 className="font-body text-6xl lg:text-8xl font-extrabold leading-[0.95] tracking-tight mb-6">
            {capeTownTheme.hero.title.split('\n').map((line, i, arr) => (
              <motion.span
                key={line}
                initial={reduceMotion ? false : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={`block ${i === arr.length - 1 ? 'text-[#F97366]' : 'text-white'}`}
              >
                {line}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="text-lg text-white/85 max-w-md mb-8 font-body leading-relaxed"
          >
            {capeTownTheme.hero.subtitle}
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.68, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-30 rounded-full sm:rounded-full p-2 max-w-2xl"
            style={{ background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.4)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-full sm:rounded-l-full sm:rounded-r-none bg-white/0">
                <Search className="w-4 h-4 text-ocean/60 shrink-0" aria-hidden="true" />
                <label htmlFor="hero-search-input" className="sr-only">What are you looking for?</label>
                <input
                  id="hero-search-input"
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleExplore()}
                  className="w-full bg-transparent text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none"
                />
              </div>

              <div className="hidden sm:block w-px self-stretch bg-charcoal/10" aria-hidden="true" />

              <div ref={areaRef} className="relative">
                <button
                  onClick={() => setAreaOpen((current) => !current)}
                  aria-haspopup="listbox"
                  aria-expanded={areaOpen}
                  aria-controls="hero-area-listbox"
                  className="flex items-center gap-2 px-4 py-3 rounded-full text-sm text-charcoal w-full sm:w-auto hover:bg-charcoal/5 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-coral shrink-0" />
                  <span className="truncate">{area || 'Anywhere in Cape Town'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-charcoal/40 shrink-0 transition-transform ${areaOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {areaOpen && (
                    <motion.div
                      id="hero-area-listbox"
                      role="listbox"
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute left-0 top-[calc(100%+8px)] z-50 min-w-full sm:min-w-[220px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-white/40 bg-white/95 shadow-2xl backdrop-blur-xl"
                    >
                      <div className="max-h-80 overflow-y-auto p-2">
                        <button role="option" aria-selected={area === ''} onClick={() => { setArea(''); setAreaOpen(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${area === '' ? 'bg-ocean/10 text-ocean font-medium' : 'hover:bg-sand text-charcoal'}`}>
                          Anywhere in Cape Town
                        </button>
                        {capeTownTheme.areas.map((a) => (
                          <button key={a.slug} role="option" aria-selected={area === a.name} onClick={() => { setArea(a.name); setAreaOpen(false); }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${area === a.name ? 'bg-ocean/10 text-ocean font-medium' : 'hover:bg-sand text-charcoal'}`}>
                            {a.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="hidden sm:block w-px self-stretch bg-charcoal/10" aria-hidden="true" />

              <button onClick={handleNearMe} disabled={locating}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm text-charcoal hover:bg-charcoal/5 transition-colors disabled:opacity-60">
                <Navigation className={`w-4 h-4 text-coral ${locating ? 'animate-pulse' : ''}`} />
                Near me
              </button>

              <motion.button
                onClick={handleExplore}
                whileHover={reduceMotion ? {} : { scale: 1.03 }}
                whileTap={reduceMotion ? {} : { scale: 0.97 }}
                className="flex items-center justify-center gap-2 px-6 py-3 text-white text-sm font-bold rounded-full shadow-lg transition-shadow hover:shadow-xl"
                style={{ background: 'linear-gradient(135deg, #0F766E, #0D9488)' }}
              >
                <Sparkles className="w-4 h-4" />
                Explore
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : 'hidden'}
            animate="show"
            variants={reduceMotion ? undefined : {
              hidden: {},
              show: { transition: { staggerChildren: 0.1, delayChildren: 0.85 } },
            }}
            className="flex flex-wrap gap-3 mt-6"
          >
            {capeTownTheme.shortcuts.map((shortcut) => {
              const Icon = SHORTCUT_ICONS[shortcut.icon] || Sparkles;
              return (
                <motion.button
                  key={shortcut.label}
                  variants={reduceMotion ? undefined : {
                    hidden: { opacity: 0, x: -16, scale: 0.9 },
                    show: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } },
                  }}
                  whileHover={reduceMotion ? {} : { y: -4, scale: 1.04 }}
                  whileTap={reduceMotion ? {} : { scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  onClick={() => {
                    const params = new URLSearchParams({ city: 'Cape Town' });
                    if (shortcut.category) params.set('category', shortcut.category);
                    navigate(`/discover?${params.toString()}`);
                  }}
                  className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-lg transition-shadow hover:shadow-2xl"
                  style={{ background: shortcut.gradient }}
                >
                  <motion.span
                    className="inline-flex"
                    animate={reduceMotion ? {} : { rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.span>
                  {shortcut.label}
                </motion.button>
              );
            })}
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-6"
          >
            <Link to="/register" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/85 hover:text-white transition-colors">
              New here? Join LekkerVibes <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </div>
      </motion.div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 w-full pb-8 sm:pb-10">
        <HeroEventCarousel reduceMotion={reduceMotion} />
      </div>
    </section>
  );
}

// Slow drifting glows + tiny "map pin" motes — decorative only, never
// intercepts pointer events, and skipped entirely under reduced motion.
function AmbientHeroMotion({ reduceMotion }) {
  if (reduceMotion) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute top-24 right-[8%] w-72 h-72 rounded-full bg-sky/20 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-32 left-[6%] w-64 h-64 rounded-full bg-coral/15 blur-3xl hidden lg:block"
        animate={{ x: [0, -30, 0], y: [0, 24, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 left-1/2 w-1.5 h-1.5 rounded-full bg-white/50 hidden lg:block"
        animate={{ y: [0, -14, 0], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 left-[70%] w-1 h-1 rounded-full bg-white/40 hidden lg:block"
        animate={{ y: [0, -10, 0], opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />
    </div>
  );
}
