import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Leaf, X } from 'lucide-react';
import { eventsApi } from '@/api/eventsApi';
import { isOnline } from '@/lib/presence';
import moment from 'moment';

function UpcomingEventCard({ event, currentUser }) {
  const [attendees, setAttendees] = useState([]);
  const [joining, setJoining] = useState(false);
  const [localEvent, setLocalEvent] = useState(event);

  useEffect(() => {
    setLocalEvent(event);
    if (event?.visibility === 'public') {
      eventsApi.goingAttendees(event.id, 3).then(setAttendees).catch(() => setAttendees([]));
    }
  }, [event]);

  if (!localEvent) return null;
  const dateM = localEvent.date ? moment(localEvent.date) : null;
  const status = localEvent.myAttendance?.status;
  const isFull = localEvent.capacity != null && localEvent.attendeeCount >= localEvent.capacity && status !== 'going';
  const ctaLabel = status === 'going' ? 'Going ✓' : status === 'waitlisted' ? 'On waitlist' : isFull ? 'Join waitlist' : 'Join';

  return (
    <div className="rounded-2xl border border-sand p-4">
      <div className="flex items-start gap-3 mb-3">
        {dateM && (
          <div className="shrink-0 w-14 rounded-xl bg-teal/10 text-center py-1.5">
            <p className="text-[10px] font-bold text-teal uppercase">{dateM.format('ddd')}</p>
            <p className="text-lg font-bold text-charcoal leading-none">{dateM.format('D')}</p>
            <p className="text-[10px] font-bold text-teal uppercase">{dateM.format('MMM')}</p>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Link to={`/activity/${localEvent.id}`} className="font-semibold text-sm text-charcoal hover:text-ocean transition-colors line-clamp-2 block">
            {localEvent.title}
          </Link>
          {dateM && (
            <p className="text-xs text-charcoal/50 mt-0.5">{dateM.format('ddd, D MMM')}{localEvent.startTime ? ` · ${moment(localEvent.startTime, 'HH:mm').format('h:mm A')}` : ''}</p>
          )}
          {attendees.length > 0 && (
            <div className="flex items-center mt-1.5">
              {attendees.map((a, i) => (
                <div key={a.uid} className="w-5 h-5 rounded-full border border-white overflow-hidden bg-gradient-to-br from-ocean to-teal shrink-0" style={{ marginLeft: i === 0 ? 0 : -6 }}>
                  {a.photoURL && <img src={a.photoURL} alt="" className="w-full h-full object-cover" />}
                </div>
              ))}
              {localEvent.attendeeCount > attendees.length && (
                <span className="text-[11px] text-charcoal/40 ml-1.5">+{localEvent.attendeeCount - attendees.length}</span>
              )}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={async () => {
          if (!currentUser || status === 'going' || status === 'waitlisted') return;
          setJoining(true);
          try {
            await eventsApi.join(localEvent.id, currentUser);
            const refreshed = await eventsApi.get(localEvent.id, currentUser.uid);
            setLocalEvent(refreshed);
          } finally {
            setJoining(false);
          }
        }}
        disabled={joining || status === 'going' || status === 'waitlisted'}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-70 ${
          status === 'going' ? 'bg-leaf/10 text-leaf' : status === 'waitlisted' ? 'bg-sand text-charcoal/60' : 'bg-gradient-to-r from-ocean to-teal text-white hover:shadow-lg'
        }`}
      >
        {ctaLabel}
      </button>
    </div>
  );
}

export default function CommunityContextPanel({ community, previewMembers, messages, currentUser, onOpenMembers, onViewAllEvents, onViewAllPhotos }) {
  const [upcomingEvent, setUpcomingEvent] = useState(null);
  const [ctaDismissed, setCtaDismissed] = useState(false);

  useEffect(() => {
    setCtaDismissed(localStorage.getItem(`lv_dismissed_cta_${community.id}`) === '1');
  }, [community.id]);

  useEffect(() => {
    let cancelled = false;
    eventsApi.listCommunityEvents(community.id, true).then((events) => {
      if (!cancelled) setUpcomingEvent(events[0] || null);
    }).catch(() => setUpcomingEvent(null));
    return () => { cancelled = true; };
  }, [community.id]);

  const recentPhotos = (messages || [])
    .filter((m) => m.type === 'image' && m.imageURL && !m.isDeleted)
    .slice(-8)
    .reverse()
    .slice(0, 4);

  const onlineMembers = (previewMembers || []).filter((m) => isOnline(m.lastActiveAt));

  const dismissCta = () => {
    localStorage.setItem(`lv_dismissed_cta_${community.id}`, '1');
    setCtaDismissed(true);
  };

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5">
      <div>
        <div className="relative h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-ocean to-teal">
          {community.imageURL && <img src={community.imageURL} alt="" className="w-full h-full object-cover" />}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-white overflow-hidden bg-gradient-to-br from-ocean to-teal">
            {community.imageURL && <img src={community.imageURL} alt="" className="w-full h-full object-cover" />}
          </div>
        </div>
        <div className="text-center pt-8 pb-1">
          <h2 className="font-body font-bold text-charcoal">{community.name}</h2>
          {community.category && <p className="text-xs font-medium text-teal mt-0.5">{community.category}</p>}
          {community.description && <p className="text-xs text-charcoal/60 mt-2 leading-relaxed line-clamp-3">{community.description}</p>}
        </div>
        <Link
          to={`/club/${community.id}`}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-sand text-sm font-semibold text-ocean hover:bg-sand/40 transition-colors"
        >
          View community <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {upcomingEvent && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/40">Upcoming event</p>
            <button onClick={onViewAllEvents} className="text-xs font-medium text-ocean hover:text-teal transition-colors">View all</button>
          </div>
          <UpcomingEventCard event={upcomingEvent} currentUser={currentUser} />
        </div>
      )}

      {recentPhotos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/40">Recent photos</p>
            <button onClick={onViewAllPhotos} className="text-xs font-medium text-ocean hover:text-teal transition-colors">View all</button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {recentPhotos.map((m) => (
              <img key={m.id} src={m.imageURL} alt="" className="aspect-square rounded-lg object-cover" />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/40">Members online ({onlineMembers.length})</p>
          <button onClick={onOpenMembers} className="text-xs font-medium text-ocean hover:text-teal transition-colors">See all</button>
        </div>
        <button onClick={onOpenMembers} className="flex items-center">
          {onlineMembers.slice(0, 5).map((m, i) => (
            <div key={m.uid} className="relative w-9 h-9 rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-ocean to-teal shrink-0" style={{ marginLeft: i === 0 ? 0 : -10 }}>
              {m.photoURL && <img src={m.photoURL} alt="" className="w-full h-full object-cover" />}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-leaf border-2 border-white" />
            </div>
          ))}
          {onlineMembers.length > 5 && (
            <div className="w-9 h-9 rounded-full border-2 border-white bg-sand flex items-center justify-center text-[11px] font-semibold text-charcoal/60 -ml-2.5">
              +{onlineMembers.length - 5}
            </div>
          )}
        </button>
      </div>

      {community.ctaTitle && !ctaDismissed && (
        <div className="relative rounded-2xl bg-leaf/10 border border-leaf/15 p-4">
          <button onClick={dismissCta} aria-label="Dismiss" className="absolute top-2.5 right-2.5 text-charcoal/30 hover:text-charcoal/60 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
          <Leaf className="w-5 h-5 text-leaf mb-2" />
          <p className="font-semibold text-sm text-charcoal mb-1">{community.ctaTitle}</p>
          {community.ctaBody && <p className="text-xs text-charcoal/60 mb-3">{community.ctaBody}</p>}
          {community.ctaLinkUrl && (
            <a href={community.ctaLinkUrl} target="_blank" rel="noopener noreferrer nofollow"
              className="inline-block px-3 py-1.5 rounded-lg border border-leaf/30 text-xs font-semibold text-leaf hover:bg-leaf/10 transition-colors">
              Learn more
            </a>
          )}
        </div>
      )}
    </div>
  );
}
