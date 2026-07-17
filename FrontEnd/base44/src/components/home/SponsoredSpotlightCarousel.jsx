import React, { useState, useRef, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, A11y, Keyboard } from 'swiper/modules';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, ExternalLink, Bookmark } from 'lucide-react';
import { getSponsoredListings } from '@/config/sponsoredListings';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { savedApi } from '@/api/savedApi';
import { useAuth } from '@/lib/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/navigation';

// First section after the hero. Sponsored/featured placements are
// LekkerVibes-controlled (config/sponsoredListings.js), never derived from
// Google's own ranking — every slide is explicitly labelled Sponsored or
// Featured Partner, never disguised as an organic recommendation.
export default function SponsoredSpotlightCarousel({ citySlug = 'cape-town', reduceMotion }) {
  const [prevEl, setPrevEl] = useState(null);
  const [nextEl, setNextEl] = useState(null);
  const swiperRef = useRef(null);
  const listings = getSponsoredListings(citySlug);
  const reveal = useScrollReveal({ direction: 'up', reduceMotion });

  if (listings.length === 0) return null;

  return (
    <motion.section {...reveal} className="py-12 sm:py-16 bg-gradient-to-b from-cream to-sand/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6 flex items-center justify-between">
        <div>
          <p className="text-coral text-sm font-semibold mb-1 uppercase tracking-wide">Cape Town Spotlight</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-charcoal">Local favourites, hand-picked</h2>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button
            ref={setPrevEl}
            aria-label="Previous spotlight"
            className="w-11 h-11 rounded-full glass flex items-center justify-center text-charcoal hover:bg-white/90 transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            ref={setNextEl}
            aria-label="Next spotlight"
            className="w-11 h-11 rounded-full glass flex items-center justify-center text-charcoal hover:bg-white/90 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <Swiper
        onSwiper={(s) => { swiperRef.current = s; }}
        modules={[Navigation, Autoplay, A11y, Keyboard]}
        slidesPerView="auto"
        centeredSlides
        loop
        speed={900}
        spaceBetween={22}
        keyboard={{ enabled: true }}
        a11y={{ enabled: true, prevSlideMessage: 'Previous spotlight', nextSlideMessage: 'Next spotlight' }}
        autoplay={reduceMotion ? false : { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        navigation={{ prevEl, nextEl }}
        className="spotlight-swiper !px-4 sm:!px-[calc((100vw-980px)/2)]"
      >
        {listings.map((listing) => (
          <SwiperSlide key={listing.id}>
            <SpotlightSlide listing={listing} />
          </SwiperSlide>
        ))}
      </Swiper>
    </motion.section>
  );
}

function SpotlightSlide({ listing }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [imageErrored, setImageErrored] = useState(false);

  useEffect(() => {
    if (!user) return;
    savedApi.has(user.uid, listing.id).then(setSaved).catch(() => {});
  }, [user, listing.id]);

  const handleSave = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (saved) {
      await savedApi.remove(user.uid, listing.id);
    } else {
      await savedApi.add(user.uid, listing.id, {
        type: 'place', name: listing.businessName, address: listing.area, photoUrl: listing.imageUrl,
      });
    }
    setSaved(!saved);
  };

  return (
    <div className="relative rounded-[24px] overflow-hidden shadow-xl h-[360px] sm:h-[420px] bg-gradient-to-br from-ocean via-teal to-sky">
      {!imageErrored && (
        <img
          src={listing.imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          onError={() => setImageErrored(true)}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

      <div className="absolute top-4 inset-x-4 flex items-start justify-between">
        <span className="px-3 py-1.5 rounded-full bg-white/90 text-charcoal text-[11px] font-bold uppercase tracking-wide">
          {listing.sponsoredLabel}
        </span>
        <button
          onClick={handleSave}
          aria-label={saved ? 'Remove from saved' : 'Save this listing'}
          aria-pressed={saved}
          className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur transition-colors ${saved ? 'bg-ocean text-white' : 'bg-white/80 text-charcoal hover:bg-white'}`}
        >
          <Bookmark className={`w-4 h-4 ${saved ? 'fill-white' : ''}`} />
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
        <div className="flex items-center gap-2 text-white/70 text-xs font-medium mb-2">
          <MapPin className="w-3.5 h-3.5 text-coral" /> {listing.area} · {listing.category}
        </div>
        <h3 className="font-heading text-xl sm:text-2xl font-bold text-white mb-1.5">{listing.businessName}</h3>
        <p className="text-white/80 text-sm max-w-md mb-4 line-clamp-2">{listing.headline}</p>
        {listing.description && (
          <p className="hidden sm:block text-white/60 text-xs max-w-md mb-4 line-clamp-1">{listing.description}</p>
        )}
        <Link
          to={listing.ctaUrl}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-charcoal text-sm font-bold hover:bg-white/90 transition-colors"
        >
          {listing.ctaLabel} <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
