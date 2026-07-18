import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, MapPin, Clock, Users, Heart, ExternalLink,
} from 'lucide-react';
import moment from 'moment';
import { eventsApi } from '@/api/eventsApi';
import { savedApi } from '@/api/savedApi';
import { useAuth } from '@/lib/AuthContext';
import { FEATURES } from '@/lib/featureFlags';
import { getSponsoredListings } from '@/config/sponsoredListings';
import { useMarqueeScroll } from '@/hooks/useMarqueeScroll';

const CARD_WIDTH_FEATURED = 'min(620px, 82vw)';
const CARD_WIDTH_NORMAL = 'min(330px, 82vw)';

// The hero's "event carousel" — continuously scrolling, never fabricated.
// Real Cape Town events (eventsApi) are the primary content; the
// LekkerVibes-controlled sponsored placements (config/sponsoredListings.js,
// already clearly labelled Sponsored/Featured Partner) fill the same feed
// so the carousel always has honest content to show even before organisers
// have posted real Cape Town events — nothing here is invented data.
export default function HeroEventCarousel({ reduceMotion }) {
  const [events, setEvents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const { trackRef, measure, nudge, containerHandlers } = useMarqueeScroll({
    reduceMotion, normalDurationSec: 40, slowDurationSec: 105,
  });

  useEffect(() => {
    if (!FEATURES.events) { setLoaded(true); return; }
    eventsApi.list({ city: 'Cape Town' })
      .then((items) => setEvents(items))
      .catch(() => setEvents([]))
      .finally(() => setLoaded(true));
  }, []);

  const items = useMemo(() => {
    const sponsored = getSponsoredListings('cape-town').map((l) => ({ kind: 'sponsored', id: l.id, listing: l }));
    const real = events.map((e) => ({ kind: 'event', id: e.id, event: e }));
    return [...sponsored, ...real];
  }, [events]);

  useEffect(() => { measure(); }, [items, measure]);

  if (!loaded) return null;
  if (items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <div className="relative z-20 mt-8 sm:mt-10">
      <div
        className="mx-auto max-w-[1400px] rounded-[26px] border border-white/[0.18] px-4 py-5 sm:px-6 sm:py-6"
        style={{ background: 'rgba(8, 27, 35, 0.68)', backdropFilter: 'blur(16px)', boxShadow: '0 24px 70px rgba(0, 0, 0, 0.30)' }}
      >
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-white/90 text-sm font-bold uppercase tracking-wide">Happening in Cape Town</p>
          <div className="hidden sm:flex items-center gap-2">
            <ArrowButton direction="left" onClick={() => nudge(320)} />
            <ArrowButton direction="right" onClick={() => nudge(-320)} />
          </div>
        </div>

        <div
          className="overflow-hidden"
          {...containerHandlers}
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label="Cape Town events and featured listings"
        >
          <div ref={trackRef} className="flex items-stretch gap-5 will-change-transform" style={{ touchAction: 'pan-y' }}>
            {doubled.map((item, idx) => (
              <CarouselCard
                key={`${item.kind}-${item.id}-${idx}`}
                item={item}
                featured={idx % items.length === 0}
                dimmed={hoveredIndex != null && hoveredIndex !== idx}
                onHoverStart={() => setHoveredIndex(idx)}
                onHoverEnd={() => setHoveredIndex(null)}
                reduceMotion={reduceMotion}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrowButton({ direction, onClick }) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: direction === 'left' ? -4 : 4 }}
      aria-label={direction === 'left' ? 'Scroll left' : 'Scroll right'}
      className="w-10 h-10 rounded-full flex items-center justify-center text-white border border-white/25 backdrop-blur-md transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
      style={{ background: 'rgba(255,255,255,0.08)' }}
    >
      <Icon className="w-5 h-5" />
    </motion.button>
  );
}

function CarouselCard({ item, featured, dimmed, onHoverStart, onHoverEnd, reduceMotion }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [going, setGoing] = useState(false);

  const isSponsored = item.kind === 'sponsored';
  const listing = item.listing;
  const event = item.event;
  const id = isSponsored ? listing.id : event.id;

  useEffect(() => {
    if (!user) return;
    savedApi.has(user.uid, id).then(setSaved).catch(() => {});
    if (!isSponsored) {
      eventsApi.get(event.id, user.uid).then((full) => setGoing(full?.myAttendance?.status === 'going')).catch(() => {});
    }
  }, [user, id, isSponsored, event]);

  const requireAuth = () => {
    if (!isAuthenticated) { navigate('/login'); return false; }
    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!requireAuth()) return;
    if (saved) {
      await savedApi.remove(user.uid, id);
    } else {
      await savedApi.add(user.uid, id, isSponsored
        ? { type: 'place', name: listing.businessName, address: listing.area, photoUrl: listing.imageUrl }
        : { type: 'event', name: event.title, address: event.venue, photoUrl: event.imageURL });
      setPulse((p) => p + 1);
    }
    setSaved(!saved);
  };

  const handleGoing = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!requireAuth()) return;
    if (going) await eventsApi.leave(event.id, user.uid);
    else await eventsApi.rsvp(event.id, user, 'going');
    setGoing(!going);
  };

  const image = isSponsored ? listing.imageUrl : event.imageURL;
  const dateLabel = !isSponsored && event.date ? moment(event.date) : null;

  // Badge is only ever derived from real fields — never a fabricated
  // "Trending"/"Hot" label with nothing behind it.
  let badge = null;
  if (isSponsored) badge = listing.sponsoredLabel;
  else if (event.attendeeCount >= 15) badge = 'Popular';
  else if (event.createdAt && moment(event.createdAt.toDate ? event.createdAt.toDate() : event.createdAt).isAfter(moment().subtract(5, 'days'))) badge = 'New';

  const href = isSponsored ? listing.ctaUrl : `/activity/${event.id}`;
  const title = isSponsored ? listing.businessName : event.title;
  const locationLabel = isSponsored ? `${listing.area} · ${listing.category}` : [event.venue, event.city].filter(Boolean).join(', ');

  return (
    <motion.article
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      whileHover={reduceMotion ? {} : { y: -10, scale: 1.03, zIndex: 10 }}
      transition={{ type: 'spring', stiffness: 240, damping: 20 }}
      animate={{ opacity: dimmed ? 0.55 : 1 }}
      className={`hero-carousel-card relative shrink-0 overflow-hidden rounded-[22px] ${isSponsored ? 'hero-card-glow-teal' : 'hero-card-glow-coral'}`}
      style={{ width: featured ? CARD_WIDTH_FEATURED : CARD_WIDTH_NORMAL, height: featured ? 320 : 280 }}
    >
      <Link to={href} className="absolute inset-0 block" aria-label={title}>
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={image || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800'}
            alt=""
            loading="lazy"
            className="hero-card-image w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
      </Link>

      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        {badge && (
          <span className="px-2.5 py-1 rounded-full bg-white/90 text-charcoal text-[11px] font-bold uppercase tracking-wide">
            {badge}
          </span>
        )}
      </div>

      <button
        onClick={handleSave}
        aria-label={saved ? 'Remove from saved' : 'Save this'}
        aria-pressed={saved}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/25 transition-colors"
        style={{ background: saved ? '#F97366' : 'rgba(255,255,255,0.12)' }}
      >
        <motion.span key={pulse} initial={false} animate={{ scale: saved ? [1, 1.22, 0.94, 1] : 1 }} transition={{ duration: 0.5 }}>
          <Heart className={`w-4 h-4 ${saved ? 'fill-white text-white' : 'text-white'}`} />
        </motion.span>
      </button>

      <div className="absolute inset-x-0 bottom-0 z-10 p-5 pointer-events-none">
        <div className="pointer-events-auto">
          {dateLabel && (
            <div className="flex items-center gap-2 text-white/70 text-xs font-semibold mb-1.5">
              <Clock className="w-3.5 h-3.5" /> {dateLabel.format('ddd, D MMM')}
              {event.startTime && ` · ${moment(event.startTime, 'HH:mm').format('h:mm A')}`}
            </div>
          )}
          <h3 className={`font-body font-bold text-white mb-1.5 line-clamp-1 ${featured ? 'text-xl sm:text-2xl' : 'text-base'}`}>{title}</h3>
          {locationLabel && (
            <div className="flex items-center gap-1.5 text-white/70 text-xs mb-3">
              <MapPin className="w-3.5 h-3.5 text-coral shrink-0" /> <span className="line-clamp-1">{locationLabel}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            {!isSponsored && event.attendeeCount != null && (
              <span className="flex items-center gap-1 text-white/70 text-xs">
                <Users className="w-3.5 h-3.5" /> {event.attendeeCount} going
              </span>
            )}
            {isSponsored ? (
              <Link
                to={listing.ctaUrl}
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-charcoal text-xs font-bold hover:bg-white/90 transition-colors"
              >
                {listing.ctaLabel} <ExternalLink className="w-3 h-3" />
              </Link>
            ) : (
              <button
                onClick={handleGoing}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${going ? 'bg-teal text-white' : 'bg-white text-charcoal hover:bg-white/90'}`}
              >
                {going ? "You're going" : 'View details'}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
