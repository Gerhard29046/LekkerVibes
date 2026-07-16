import React, { useState } from 'react';
import { MapPin, Star, Bookmark, CalendarPlus, ExternalLink, Info, Clock } from 'lucide-react';
import { placePhotoUrl } from '@/api/discoverApi';
import { savedApi, plansApi } from '@/api/savedApi';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';

// Google Places results, rendered as LekkerVibes cards — never a bare list
// of Google search results. "Place"/"Club"/"Venue"/"Community"/"Activity
// provider" only, never labelled an "event" (Places has no date/time data).
export default function DiscoverPlaceCard({ place }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [planned, setPlanned] = useState(false);

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

  // Never invent a website — fall back to the Google Maps listing itself.
  const websiteHref = place.websiteUrl || place.googleMapsUrl;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-sand/80 shadow-sm flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={imageSrc} alt={place.name} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {place.category && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full glass-dark text-white text-[11px] font-medium">
            {place.category}
          </span>
        )}
        {place.openNow != null && (
          <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
            place.openNow ? 'bg-leaf/90 text-white' : 'bg-charcoal/70 text-white'
          }`}>
            {place.openNow ? 'Open now' : 'Closed'}
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-heading font-semibold text-charcoal text-base mb-1.5 line-clamp-1">{place.name}</h3>

        <div className="flex items-center gap-3 text-xs text-charcoal/60 mb-2">
          {place.rating != null && (
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-coral text-coral" />
              {place.rating.toFixed(1)} ({place.reviewCount})
            </span>
          )}
          {place.distanceKm != null && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {place.distanceKm.toFixed(1)} km
            </span>
          )}
        </div>

        {place.address && (
          <div className="flex items-start gap-1 text-xs text-charcoal/60 mb-3">
            <MapPin className="w-3.5 h-3.5 text-coral shrink-0 mt-0.5" />
            <span className="line-clamp-2">{place.address}</span>
          </div>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2 pt-3 border-t border-sand">
          <button onClick={handleSave}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              saved ? 'bg-ocean text-white' : 'bg-sand text-charcoal hover:bg-sand/80'
            }`}>
            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-white' : ''}`} /> {saved ? 'Saved' : 'Save'}
          </button>
          <button onClick={handleAddToPlans}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              planned ? 'bg-teal text-white' : 'bg-sand text-charcoal hover:bg-sand/80'
            }`}>
            <CalendarPlus className="w-3.5 h-3.5" /> {planned ? 'In plans' : 'Add to plans'}
          </button>
          <a href={place.googleMapsUrl} target="_blank" rel="noopener noreferrer nofollow"
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-sand text-charcoal hover:bg-sand/80 transition-colors">
            <Info className="w-3.5 h-3.5" /> View details
          </a>
          <a href={websiteHref} target="_blank" rel="noopener noreferrer nofollow"
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-ocean to-teal text-white hover:shadow-md transition-all">
            <ExternalLink className="w-3.5 h-3.5" /> Visit website
          </a>
        </div>
      </div>
    </div>
  );
}
