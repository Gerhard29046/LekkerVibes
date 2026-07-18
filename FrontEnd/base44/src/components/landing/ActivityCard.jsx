import React from 'react';
import { MapPin, Clock, Users, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import moment from 'moment';

export default function ActivityCard({ activity, compact = false }) {
  const dateFormatted = activity.date ? moment(activity.date).format('ddd, D MMM') : null;
  const timeFormatted = activity.startTime
    ? moment(activity.startTime, 'HH:mm').format('h:mm A')
    : null;
  const locationLabel = [activity.venue, activity.city].filter(Boolean).join(', ');

  return (
    <Link to={`/activity/${activity.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden border border-sand/80 card-hover shadow-sm">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={activity.imageURL || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600'}
            alt={activity.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {activity.visibility === 'members' && (
              <span className="px-2.5 py-1 rounded-full bg-charcoal/80 text-white text-[11px] font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Members only
              </span>
            )}
          </div>

          {/* Bottom info overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-full glass-dark text-white text-[11px] font-medium">
                {activity.category || 'Activity'}
              </span>
            </div>
            {activity.capacity != null && activity.attendeeCount != null && activity.capacity - activity.attendeeCount <= 10 && (
              <span className="px-2.5 py-1 rounded-full bg-coral/90 text-white text-[11px] font-semibold">
                {Math.max(activity.capacity - activity.attendeeCount, 0)} spots left
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-body font-semibold text-charcoal text-base mb-1.5 line-clamp-1 group-hover:text-ocean transition-colors">
            {activity.title}
          </h3>

          {dateFormatted && (
            <div className="flex items-center gap-3 text-xs text-charcoal/60 mb-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {dateFormatted}{timeFormatted ? ` · ${timeFormatted}` : ''}
              </span>
            </div>
          )}

          {locationLabel && (
            <div className="flex items-center gap-1 text-xs text-charcoal/60 mb-3">
              <MapPin className="w-3.5 h-3.5 text-coral shrink-0" />
              <span className="truncate">{locationLabel}</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-sand">
            <div className="flex items-center gap-3 text-xs text-charcoal/50">
              {activity.attendeeCount != null && (
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {activity.attendeeCount} going
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
