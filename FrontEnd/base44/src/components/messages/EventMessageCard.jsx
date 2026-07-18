import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { eventsApi } from '@/api/eventsApi';
import { useAuth } from '@/lib/AuthContext';
import moment from 'moment';

// Rendered from live events/{eventId} data, not a frozen snapshot at
// send-time — the CTA label always reflects the viewer's own current
// attendance state, and capacity/waitlist status can change after the
// card was posted. Never composed manually; only auto-posted by
// eventsApi.create() when an activity is hosted into this community.
export default function EventMessageCard({ eventId }) {
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const load = useCallback(() => {
    eventsApi.get(eventId, user?.uid).then((data) => {
      setEvent(data);
      if (data?.visibility === 'public') {
        eventsApi.goingAttendees(eventId, 4).then(setAttendees).catch(() => setAttendees([]));
      }
    }).finally(() => setLoading(false));
  }, [eventId, user?.uid]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="h-20 rounded-2xl bg-sand/50 animate-pulse max-w-md" />;
  if (!event) return null;

  const status = event.myAttendance?.status;
  const isFull = event.capacity != null && event.attendeeCount >= event.capacity && status !== 'going';
  // Never a hardcoded per-activity-type label ("Join Hike" etc.) — just
  // the viewer's own attendance state, generic across every event type.
  const ctaLabel = status === 'going' ? 'Going ✓' : status === 'waitlisted' ? 'On waitlist' : isFull ? 'Join waitlist' : 'Join';
  const dateM = event.date ? moment(event.date) : null;

  const handleJoin = async () => {
    if (!user || status === 'going' || status === 'waitlisted') return;
    setJoining(true);
    try {
      await eventsApi.join(event.id, user);
      load();
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="rounded-2xl border border-sand bg-white overflow-hidden max-w-md">
      <div className="flex items-center gap-3 p-3">
        {dateM && (
          <div className="shrink-0 w-14 rounded-xl bg-teal/10 text-center py-1.5">
            <p className="text-[10px] font-bold text-teal uppercase">{dateM.format('ddd')}</p>
            <p className="text-lg font-bold text-charcoal leading-none">{dateM.format('D')}</p>
            <p className="text-[10px] font-bold text-teal uppercase">{dateM.format('MMM')}</p>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Link to={`/activity/${event.id}`} className="font-semibold text-sm text-charcoal hover:text-ocean transition-colors line-clamp-1 block">
            {event.title}
          </Link>
          {event.venue && (
            <p className="text-xs text-charcoal/50 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{event.venue}</span>
            </p>
          )}
          {attendees.length > 0 && (
            <div className="flex items-center mt-1.5">
              {attendees.map((a, i) => (
                <div
                  key={a.uid}
                  className="w-5 h-5 rounded-full border border-white overflow-hidden bg-gradient-to-br from-ocean to-teal shrink-0"
                  style={{ marginLeft: i === 0 ? 0 : -6 }}
                >
                  {a.photoURL && <img src={a.photoURL} alt="" className="w-full h-full object-cover" />}
                </div>
              ))}
              {event.attendeeCount > attendees.length && (
                <span className="text-[11px] text-charcoal/40 ml-1.5">+{event.attendeeCount - attendees.length}</span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={handleJoin}
          disabled={joining || status === 'going' || status === 'waitlisted'}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors disabled:opacity-70 ${
            status === 'going' ? 'bg-leaf/10 text-leaf' : status === 'waitlisted' ? 'bg-sand text-charcoal/60' : 'bg-coral text-white hover:bg-coral/90'
          }`}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
