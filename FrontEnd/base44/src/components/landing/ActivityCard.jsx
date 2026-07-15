import React from 'react';
import { MapPin, Clock, Users, Bookmark, Share2, BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import moment from 'moment';

export default function ActivityCard({ activity, compact = false }) {
  const nextOccurrence = activity.occurrences?.[0];
  const dateFormatted = nextOccurrence ? moment(nextOccurrence.starts_at).format('ddd, D MMM') : null;
  const timeFormatted = nextOccurrence ? moment(nextOccurrence.starts_at).format('h:mm A') : null;
  const isFree = activity.is_free;
  const priceRand = activity.price_cents ? Math.round(activity.price_cents / 100) : null;
  const locationLabel = [activity.venue?.name, activity.venue?.location?.name].filter(Boolean).join(', ');

  return (
    <Link to={`/activity/${activity.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden border border-sand/80 card-hover shadow-sm">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={activity.cover_url || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600'}
            alt={activity.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {isFree && (
              <span className="px-2.5 py-1 rounded-full bg-leaf/90 text-white text-[11px] font-semibold uppercase tracking-wide">
                Free
              </span>
            )}
            {!isFree && priceRand !== null && (
              <span className="px-2.5 py-1 rounded-full bg-white/90 text-charcoal text-[11px] font-semibold">
                R{priceRand}
              </span>
            )}
            {activity.is_beginner_friendly && (
              <span className="px-2.5 py-1 rounded-full bg-sky/90 text-ocean text-[11px] font-semibold">
                Beginner
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); }}
              className="w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white transition-colors"
            >
              <Bookmark className={`w-3.5 h-3.5 ${activity.saved_by_me ? 'fill-ocean text-ocean' : 'text-charcoal'}`} />
            </button>
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); }}
              className="w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-charcoal" />
            </button>
          </div>

          {/* Bottom info overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-full glass-dark text-white text-[11px] font-medium">
                {activity.category?.name || 'Activity'}
              </span>
            </div>
            {nextOccurrence?.spots_remaining != null && nextOccurrence.spots_remaining <= 10 && (
              <span className="px-2.5 py-1 rounded-full bg-coral/90 text-white text-[11px] font-semibold">
                {nextOccurrence.spots_remaining} spots left
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-heading font-semibold text-charcoal text-base mb-1.5 line-clamp-1 group-hover:text-ocean transition-colors">
            {activity.title}
          </h3>

          {dateFormatted && (
            <div className="flex items-center gap-3 text-xs text-charcoal/60 mb-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {dateFormatted} · {timeFormatted}
              </span>
            </div>
          )}

          {locationLabel && (
            <div className="flex items-center gap-1 text-xs text-charcoal/60 mb-3">
              <MapPin className="w-3.5 h-3.5 text-coral shrink-0" />
              <span className="truncate">{locationLabel}</span>
            </div>
          )}

          {/* Community link */}
          {!compact && activity.community && (
            <div className="flex flex-wrap gap-1 mb-3">
              <span className="px-2 py-0.5 rounded-full bg-sand text-charcoal/60 text-[10px] font-medium">
                {activity.community.name}
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-sand">
            <div className="flex items-center gap-3 text-xs text-charcoal/50">
              {activity.is_attend_alone_friendly && (
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  Go alone friendly
                </span>
              )}
            </div>
            {activity.organiser?.is_verified && (
              <span className="flex items-center gap-1 text-[11px] text-teal font-medium">
                <BadgeCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
