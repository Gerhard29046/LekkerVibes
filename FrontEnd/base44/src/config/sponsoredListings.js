// Demo sponsored/featured-partner content for the Cape Town homepage
// spotlight carousel — LekkerVibes-controlled placements, never derived from
// Google's own ranking. There's no admin UI yet to manage real paid
// campaigns, so this is clearly-marked demo content per city_slug +
// placement, in the same shape a future `sponsoredListings` Firestore
// collection would use (id, businessName, city, area, category, priority,
// active, campaignStart/End, sponsoredLabel) — swapping this file for a
// Firestore-backed fetch later shouldn't require touching the carousel.
import { capeTownImages } from './capeTownImages';

export const DEMO_SPONSORED_LISTINGS = [
  {
    id: 'demo-waterfront-eatery',
    businessName: 'Harbour House Waterfront',
    city: 'Cape Town',
    area: 'V&A Waterfront',
    category: 'Restaurant',
    imageUrl: capeTownImages.areas.waterfront,
    headline: 'Fresh seafood, front-row harbour views',
    description: 'A Waterfront institution for sundowners and seafood platters, right on the water.',
    ctaLabel: 'View menu',
    ctaUrl: '/discover?city=Cape%20Town&search=restaurants%20V%26A%20Waterfront',
    priority: 1,
    active: true,
    sponsoredLabel: 'Sponsored',
    isDemo: true,
  },
  {
    id: 'demo-lions-head-adventures',
    businessName: 'Lion’s Head Sunrise Hikes',
    city: 'Cape Town',
    area: 'Sea Point',
    category: 'Outdoor adventure',
    imageUrl: capeTownImages.areas.seaPoint,
    headline: 'Guided sunrise hikes up Lion’s Head',
    description: 'Small-group guided hikes timed for the best light over Sea Point and the Atlantic.',
    ctaLabel: 'See upcoming hikes',
    ctaUrl: '/discover?city=Cape%20Town&category=Hiking',
    priority: 2,
    active: true,
    sponsoredLabel: 'Featured Partner',
    isDemo: true,
  },
  {
    id: 'demo-city-bowl-market',
    businessName: 'City Bowl Sunday Market',
    city: 'Cape Town',
    area: 'City Bowl',
    category: 'Market',
    imageUrl: capeTownImages.areas.cityBowl,
    headline: 'Local makers, street food and live music every Sunday',
    description: 'A weekly City Bowl market with Table Mountain as the backdrop.',
    ctaLabel: 'Plan your visit',
    ctaUrl: '/discover?city=Cape%20Town&category=Food%20%26%20Markets',
    priority: 3,
    active: true,
    sponsoredLabel: 'Sponsored',
    isDemo: true,
  },
];

// Mirrors the eventual "active campaigns for this city + placement, sorted
// by priority" query — placement is fixed to 'homepage_spotlight' since
// that's the only slot this file feeds today.
export function getSponsoredListings(citySlug, placement = 'homepage_spotlight') {
  return DEMO_SPONSORED_LISTINGS
    .filter((l) => l.active && l.city.toLowerCase().replace(/\s+/g, '-') === citySlug)
    .sort((a, b) => a.priority - b.priority)
    .map((l) => ({ ...l, placement }));
}
