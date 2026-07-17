import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Bookmark, Info, Navigation } from 'lucide-react';
import { placesPhotoUrl } from '@/api/placesApi';
import { savedApi } from '@/api/savedApi';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';

const PRICE_LABELS = {
  PRICE_LEVEL_FREE: 'Free', PRICE_LEVEL_INEXPENSIVE: '$', PRICE_LEVEL_MODERATE: '$$',
  PRICE_LEVEL_EXPENSIVE: '$$$', PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
};

// A LekkerVibes-styled card for a real Google Places (New) result — used by
// the restaurant/gallery/culture homepage sections. `size="large"` gives the
// editorial one-big-card-beside-smaller-ones gallery layout its featured
// tile; `variant="editorial"` swaps the hover treatment to a monochrome
// -to-colour reveal instead of the standard image-zoom.
export default function PlaceCard({ place, size = 'normal', variant = 'standard', reduceMotion }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    savedApi.has(user.uid, place.id).then(setSaved).catch(() => {});
  }, [user, place.id]);

  const imageSrc = placesPhotoUrl(place.imageUrl) || 'https://images.unsplash.com/photo-1552083375-1447ce886485?w=700';
  const priceLabel = place.priceLevel ? PRICE_LABELS[place.priceLevel] : null;

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (saved) {
      await savedApi.remove(user.uid, place.id);
    } else {
      await savedApi.add(user.uid, place.id, {
        type: 'place', name: place.name, address: place.address,
        photoUrl: place.imageUrl, googleMapsUrl: place.googleMapsUrl,
      });
    }
    setSaved(!saved);
  };

  return (
    <motion.div
      whileHover={reduceMotion ? {} : { y: -5 }}
      className={`group bg-white rounded-2xl overflow-hidden border border-sand/80 shadow-sm hover:shadow-lg transition-shadow ${size === 'large' ? 'sm:col-span-2 sm:row-span-2' : ''}`}
    >
      <div className={`relative overflow-hidden ${size === 'large' ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}>
        <img
          src={imageSrc}
          alt={place.name}
          loading="lazy"
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            variant === 'editorial' ? 'grayscale group-hover:grayscale-0' : ''
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        {place.category && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full glass-dark text-white text-[11px] font-medium">
            {place.category}
          </span>
        )}
        {place.isOpen != null && (
          <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
            place.isOpen ? 'bg-leaf/90 text-white' : 'bg-charcoal/70 text-white'
          }`}>
            {place.isOpen ? 'Open now' : 'Closed'}
          </span>
        )}
        <button
          onClick={handleSave}
          aria-label={saved ? 'Remove from saved' : 'Save this place'}
          aria-pressed={saved}
          className={`absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur transition-colors ${
            saved ? 'bg-ocean text-white' : 'bg-white/80 text-charcoal hover:bg-white'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${saved ? 'fill-white' : ''}`} />
        </button>
      </div>

      <div className="p-4">
        <h3 className={`font-heading font-semibold text-charcoal line-clamp-1 group-hover:text-ocean transition-colors ${size === 'large' ? 'text-lg' : 'text-base'}`}>
          {place.name}
        </h3>
        <div className="flex items-center gap-3 text-xs text-charcoal/60 mt-1.5 mb-2">
          {place.rating != null && (
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-coral text-coral" />
              {place.rating.toFixed(1)} ({place.reviewCount})
            </span>
          )}
          {priceLabel && <span className="font-semibold text-charcoal/50">{priceLabel}</span>}
        </div>
        {place.address && (
          <div className="flex items-start gap-1 text-xs text-charcoal/60 mb-3">
            <MapPin className="w-3.5 h-3.5 text-coral shrink-0 mt-0.5" />
            <span className="line-clamp-1">{place.address}</span>
          </div>
        )}
        <div className="flex items-center gap-3 pt-2 border-t border-sand text-xs font-medium">
          <a href={place.websiteUrl || place.googleMapsUrl} target="_blank" rel="noopener noreferrer nofollow"
            className="flex items-center gap-1 text-ocean hover:text-teal transition-colors">
            <Info className="w-3.5 h-3.5" /> View details
          </a>
          <span className="text-charcoal/30">·</span>
          <a href={place.googleMapsUrl} target="_blank" rel="noopener noreferrer nofollow"
            className="flex items-center gap-1 text-charcoal/50 hover:text-charcoal transition-colors">
            <Navigation className="w-3.5 h-3.5" /> Directions
          </a>
        </div>
      </div>
    </motion.div>
  );
}
