import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Bookmark, CalendarPlus, ExternalLink, Info, Clock, CheckCircle2, PartyPopper } from 'lucide-react';
import { placePhotoUrl } from '@/api/discoverApi';
import { savedApi, plansApi } from '@/api/savedApi';
import { visitedPlacesApi } from '@/api/visitedPlacesApi';
import { activityApi } from '@/api/activityApi';
import { eventsApi } from '@/api/eventsApi';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getCategoryTheme } from '@/lib/categoryTheme';
import CreateActivityModal from './CreateActivityModal';

// Google Places results, rendered as LekkerVibes cards — never a bare list
// of Google search results. "Place"/"Club"/"Venue"/"Community"/"Activity
// provider" only, never labelled an "event" (Places has no date/time data).
export default function DiscoverPlaceCard({ place, city }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [planned, setPlanned] = useState(false);
  const [visited, setVisited] = useState(false);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    savedApi.has(user.uid, place.placeId).then(setSaved);
    plansApi.has(user.uid, place.placeId).then(setPlanned);
    visitedPlacesApi.has(user.uid, place.placeId).then(setVisited);
  }, [user, place.placeId]);

  useEffect(() => {
    eventsApi.countUpcomingForPlace(place.placeId).then(setUpcomingCount).catch(() => {});
  }, [place.placeId]);

  const imageSrc = placePhotoUrl(place.photoUrl) ||
    'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600';

  const requireAuth = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!requireAuth()) return;
    const item = {
      type: 'place', name: place.name, address: place.address,
      photoUrl: place.photoUrl, googleMapsUrl: place.googleMapsUrl,
    };
    if (saved) {
      await savedApi.remove(user.uid, place.placeId);
    } else {
      await savedApi.add(user.uid, place.placeId, item);
      activityApi.record(user.uid, 'saved_place', { placeName: place.name }).catch(() => {});
    }
    setSaved(!saved);
  };

  const handleAddToPlans = async () => {
    if (!requireAuth()) return;
    const item = {
      type: 'place', name: place.name, address: place.address,
      photoUrl: place.photoUrl, googleMapsUrl: place.googleMapsUrl,
    };
    if (planned) {
      await plansApi.remove(user.uid, place.placeId);
    } else {
      await plansApi.add(user.uid, place.placeId, item);
    }
    setPlanned(!planned);
  };

  // "Mark as visited" is a separate, explicit action from Save/Add to
  // plans — per the product's privacy model, a visit is only ever recorded
  // from a deliberate user confirmation, never inferred (see
  // Firebase/firestore.rules' `source` allow-list on visitedPlaces).
  const handleMarkVisited = async () => {
    if (!requireAuth()) return;
    if (visited) {
      await visitedPlacesApi.unmark(user.uid, place.placeId);
      setVisited(false);
      return;
    }
    await visitedPlacesApi.markVisited(user.uid, {
      placeId: place.placeId, placeName: place.name, broadArea: place.address, source: 'user_confirmed',
    });
    activityApi.record(user.uid, 'visited_place', { placeName: place.name }).catch(() => {});
    setVisited(true);
  };

  // Never invent a website — fall back to the Google Maps listing itself.
  const websiteHref = place.websiteUrl || place.googleMapsUrl;
  const categoryTheme = getCategoryTheme(place.category);

  const handleCreateActivity = () => {
    if (!requireAuth()) return;
    setCreateOpen(true);
  };

  return (
    <div className="discover-card rounded-xl overflow-hidden flex flex-col">
      <div className="discover-card-photo-wrap relative aspect-[4/3] overflow-hidden">
        <img
          src={imageSrc}
          alt={place.name}
          loading="lazy"
          className="discover-card-photo w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent 60%)' }} />
        {place.category && (
          <span
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{ background: 'rgba(0,0,0,0.45)', color: categoryTheme.text, border: `0.5px solid ${categoryTheme.border}` }}
          >
            {place.category}
          </span>
        )}
        {place.openNow != null && (
          <span
            className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={place.openNow
              ? { background: '#639922', color: '#173404' }
              : { background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.75)' }}
          >
            {place.openNow ? 'Open now' : 'Closed'}
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-body font-semibold text-white text-[15px] mb-1.5 line-clamp-1">{place.name}</h3>

        <div className="flex items-center gap-3 text-xs mb-2" style={{ color: 'var(--lv-teal-light)' }}>
          {place.rating != null && (
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-current" />
              {place.rating.toFixed(1)} ({place.reviewCount})
            </span>
          )}
          {place.distanceKm != null && (
            <span className="flex items-center gap-1" style={{ color: 'var(--lv-text-onteal-muted)' }}>
              <Clock className="w-3.5 h-3.5" /> {place.distanceKm.toFixed(1)} km
            </span>
          )}
        </div>

        {place.address && (
          <div className="flex items-start gap-1 text-xs mb-3" style={{ color: 'var(--lv-text-onteal-muted)' }}>
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--lv-coral)' }} />
            <span className="line-clamp-2">{place.address}</span>
          </div>
        )}

        {upcomingCount > 0 && (
          <Link
            to={`/discover?city=${encodeURIComponent(city || '')}&search=${encodeURIComponent(place.name)}`}
            className="flex items-center gap-1.5 text-xs font-medium mb-3 hover:underline"
            style={{ color: 'var(--lv-coral)' }}
          >
            <PartyPopper className="w-3.5 h-3.5" />
            {upcomingCount} {upcomingCount === 1 ? 'activity' : 'activities'} happening here
          </Link>
        )}

        {/* "Create activity" is the one filled/accent action on this card —
            creating a joinable event is the higher-intent action LekkerVibes
            wants to encourage, so "Visit website" is demoted to ghost. */}
        <button onClick={handleCreateActivity}
          className="discover-btn-accent flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold mb-2">
          <CalendarPlus className="w-3.5 h-3.5" /> Create activity
        </button>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-3" style={{ borderTop: '0.5px solid var(--lv-border-onteal)' }}>
          <button onClick={handleSave}
            className={`discover-btn-ghost flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium ${saved ? 'discover-btn-ghost-active' : ''}`}>
            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-white' : ''}`} /> {saved ? 'Saved' : 'Save'}
          </button>
          <button onClick={handleAddToPlans}
            className={`discover-btn-ghost flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium ${planned ? 'discover-btn-ghost-active' : ''}`}>
            <CalendarPlus className="w-3.5 h-3.5" /> {planned ? 'In plans' : 'Add to plans'}
          </button>
          <a href={place.googleMapsUrl} target="_blank" rel="noopener noreferrer nofollow"
            className="discover-btn-ghost flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium">
            <Info className="w-3.5 h-3.5" /> View details
          </a>
          <a href={websiteHref} target="_blank" rel="noopener noreferrer nofollow"
            className="discover-btn-ghost flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium">
            <ExternalLink className="w-3.5 h-3.5" /> Visit website
          </a>
        </div>
        <button onClick={handleMarkVisited}
          className="mt-2 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
          style={visited
            ? { color: 'var(--lv-teal-light)', background: 'rgba(29,158,117,0.12)' }
            : { color: 'var(--lv-text-onteal-muted)' }}>
          <CheckCircle2 className="w-3.5 h-3.5" /> {visited ? "You've visited this" : 'Mark as visited'}
        </button>
      </div>

      <CreateActivityModal place={place} city={city} open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
