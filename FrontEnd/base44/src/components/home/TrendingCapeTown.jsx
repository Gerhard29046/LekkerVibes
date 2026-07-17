import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CalendarClock, Users, TrendingUp } from 'lucide-react';
import { eventsApi } from '@/api/eventsApi';
import { communitiesApi } from '@/api/communitiesApi';
import { FEATURES } from '@/lib/featureFlags';
import SectionHeading from './SectionHeading';
import { staggerContainer, staggerItem } from '@/hooks/useScrollReveal';

// Combines real LekkerVibes engagement signals — event attendee counts and
// community member counts, both already computed by the existing APIs —
// rather than "trending" meaning a high Google rating (Places has no
// engagement data of its own). Cross-user save/view counts aren't queryable
// client-side (Firestore rules keep /saved self-only), so this only surfaces
// what's genuinely measurable today: events and communities.
export default function TrendingCapeTown({ reduceMotion }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      FEATURES.events ? eventsApi.list({ city: 'Cape Town' }).catch(() => []) : Promise.resolve([]),
      FEATURES.communities ? communitiesApi.list({ city: 'Cape Town' }).catch(() => []) : Promise.resolve([]),
    ]).then(([events, communities]) => {
      if (cancelled) return;
      const eventItems = events
        .map((e) => ({ kind: 'event', id: e.id, title: e.title, image: e.imageURL, engagement: e.attendeeCount || 0, meta: e.category || 'Event' }))
        .sort((a, b) => b.engagement - a.engagement);
      const communityItems = communities
        .map((c) => ({ kind: 'community', id: c.id, title: c.name, image: c.imageURL, engagement: c.memberCount || 0, meta: c.category || 'Community' }))
        .sort((a, b) => b.engagement - a.engagement);

      const merged = [];
      for (let i = 0; i < 4; i++) {
        if (eventItems[i]) merged.push(eventItems[i]);
        if (communityItems[i]) merged.push(communityItems[i]);
      }
      setItems(merged.slice(0, 8));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  if (!FEATURES.events && !FEATURES.communities) return null;

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <SectionHeading
        eyebrow={<span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> TRENDING IN CAPE TOWN</span>}
        title="What Cape Town is buzzing about"
        viewAllTo="/discover?city=Cape%20Town"
        reduceMotion={reduceMotion}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-sand animate-pulse">
              <div className="aspect-[4/3] bg-sand" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-sand rounded w-3/4" />
                <div className="h-3 bg-sand rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-charcoal/50">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 text-charcoal/20" />
          <p className="text-sm">Nothing trending in Cape Town yet — be the first to create something.</p>
        </div>
      ) : (
        <motion.div
          initial={reduceMotion ? false : 'hidden'}
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={reduceMotion ? undefined : staggerContainer(0.08)}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {items.map((item) => (
            <motion.div key={`${item.kind}-${item.id}`} variants={reduceMotion ? undefined : staggerItem('up')}>
              <TrendingCard item={item} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}

function TrendingCard({ item }) {
  const isEvent = item.kind === 'event';
  const to = isEvent ? `/activity/${item.id}` : `/club/${item.id}`;
  const accent = isEvent ? 'coral' : 'teal';

  return (
    <Link to={to} className="group block bg-white rounded-2xl overflow-hidden border border-sand/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
      <div className="relative aspect-[4/3] overflow-hidden">
        {item.image
          ? <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className={`w-full h-full bg-gradient-to-br ${isEvent ? 'from-coral to-peach' : 'from-ocean to-teal'}`} />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white ${isEvent ? 'bg-coral' : 'bg-teal'}`}>
          {item.meta}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-heading font-semibold text-charcoal text-base line-clamp-1 group-hover:text-ocean transition-colors mb-2">
          {item.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-charcoal/60">
          {isEvent ? <CalendarClock className="w-3.5 h-3.5" style={{ color: accent === 'coral' ? '#F97366' : '#0F766E' }} /> : <Users className="w-3.5 h-3.5 text-teal" />}
          {isEvent ? `${item.engagement} going` : `${item.engagement} members`}
        </div>
      </div>
    </Link>
  );
}
