import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, MapPin, Users, Bookmark, Check } from 'lucide-react';
import moment from 'moment';
import { eventsApi } from '@/api/eventsApi';
import { savedApi } from '@/api/savedApi';
import { useAuth } from '@/lib/AuthContext';
import { FEATURES } from '@/lib/featureFlags';
import SectionHeading from './SectionHeading';
import { staggerContainer, staggerItem } from '@/hooks/useScrollReveal';

// Scheduled events must come from LekkerVibes' own events data (Firestore
// eventsApi) — Google Places has no date/time concept, so it's never used
// here even though it enriches venues elsewhere on this homepage.
export default function CapeTownEvents({ reduceMotion }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!FEATURES.events) return;
    let cancelled = false;
    setLoading(true);
    eventsApi.list({ city: 'Cape Town' })
      .then((items) => { if (!cancelled) setEvents(items.slice(0, 6)); })
      .catch(() => { if (!cancelled) setEvents([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (!FEATURES.events) return null;

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <SectionHeading eyebrow="WHAT'S ON" title="Events happening in Cape Town" viewAllTo="/discover?city=Cape%20Town" reduceMotion={reduceMotion} accent="text-ocean" />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-sand animate-pulse h-64" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-charcoal/50">
          <p className="text-sm">No Cape Town events on the calendar yet.</p>
          <Link to="/create-activity" className="text-ocean text-sm font-medium mt-2 inline-block">Create the first one →</Link>
        </div>
      ) : (
        <motion.div
          initial={reduceMotion ? false : 'hidden'}
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={reduceMotion ? undefined : staggerContainer(0.08)}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {events.map((event) => (
            <motion.div key={event.id} variants={reduceMotion ? undefined : staggerItem('up')}>
              <EventCard event={event} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}

function EventCard({ event }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [going, setGoing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    savedApi.has(user.uid, event.id).then(setSaved).catch(() => {});
    eventsApi.get(event.id, user.uid).then((full) => setGoing(full?.myAttendance?.status === 'going')).catch(() => {});
  }, [user, event.id]);

  const requireAuth = () => {
    if (!isAuthenticated) { navigate('/login'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!requireAuth()) return;
    if (saved) await savedApi.remove(user.uid, event.id);
    else await savedApi.add(user.uid, event.id, { type: 'event', name: event.title, address: event.venue, photoUrl: event.imageURL });
    setSaved(!saved);
  };

  const handleGoing = async () => {
    if (!requireAuth()) return;
    setBusy(true);
    try {
      if (going) await eventsApi.leave(event.id, user.uid);
      else await eventsApi.rsvp(event.id, user, 'going');
      setGoing(!going);
    } finally {
      setBusy(false);
    }
  };

  const dateLabel = event.date ? moment(event.date) : null;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-sand/80 shadow-sm hover:shadow-lg transition-shadow">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={event.imageURL || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600'}
          alt={event.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {dateLabel && (
          <div className="absolute top-3 left-3 bg-white rounded-xl overflow-hidden shadow text-center w-12">
            <div className="bg-coral text-white text-[10px] font-bold uppercase py-0.5">{dateLabel.format('MMM')}</div>
            <div className="text-charcoal text-lg font-bold leading-tight py-0.5">{dateLabel.format('D')}</div>
          </div>
        )}
        <button
          onClick={handleSave}
          aria-label={saved ? 'Remove from saved' : 'Save this event'}
          aria-pressed={saved}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur transition-colors ${saved ? 'bg-ocean text-white' : 'bg-white/80 text-charcoal hover:bg-white'}`}
        >
          <Bookmark className={`w-4 h-4 ${saved ? 'fill-white' : ''}`} />
        </button>
        {event.category && (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full glass-dark text-white text-[11px] font-medium">
            {event.category}
          </span>
        )}
      </div>

      <div className="p-4">
        <Link to={`/activity/${event.id}`} className="font-heading font-semibold text-charcoal text-base line-clamp-1 hover:text-ocean transition-colors">
          {event.title}
        </Link>
        <div className="flex items-center gap-3 text-xs text-charcoal/60 mt-1.5 mb-2">
          {event.startTime && (
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {moment(event.startTime, 'HH:mm').format('h:mm A')}</span>
          )}
          {event.attendeeCount != null && (
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {event.attendeeCount} going</span>
          )}
        </div>
        {(event.venue || event.city) && (
          <div className="flex items-start gap-1 text-xs text-charcoal/60 mb-3">
            <MapPin className="w-3.5 h-3.5 text-coral shrink-0 mt-0.5" />
            <span className="line-clamp-1">{[event.venue, event.city].filter(Boolean).join(', ')}</span>
          </div>
        )}
        <button
          onClick={handleGoing}
          disabled={busy}
          className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-60 ${
            going ? 'bg-teal text-white' : 'bg-sand text-charcoal hover:bg-sand/80'
          }`}
        >
          {going && <Check className="w-3.5 h-3.5" />} {going ? "You're going" : 'Going / Interested'}
        </button>
      </div>
    </div>
  );
}
