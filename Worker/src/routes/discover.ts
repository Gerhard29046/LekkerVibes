import { Hono } from 'hono';
import { searchTextPlaces, fetchPlacePhoto, type PlaceResult } from '../lib/googlePlaces';
import type { Env, Variables } from '../types/env';

export const discoverRoute = new Hono<{ Bindings: Env; Variables: Variables }>();

// Every category maps to a natural-language Text Search query rather than a
// fixed Places `included_type` — matches the product spec's own examples
// (e.g. "Running clubs in George, Western Cape").
const CATEGORY_QUERY_TEMPLATES: Record<string, (city: string) => string> = {
  Running: (city) => `Running clubs in ${city}, Western Cape`,
  Hiking: (city) => `Hiking trails near ${city}, Western Cape`,
  Surfing: (city) => `Surf schools near ${city}, Western Cape`,
  Cycling: (city) => `Cycling clubs in ${city}, Western Cape`,
  'Yoga & Wellness': (city) => `Yoga studios in ${city}, Western Cape`,
  'Food & Markets': (city) => `Food markets in ${city}, Western Cape`,
  'Faith & Community': (city) => `Churches and community centres in ${city}, Western Cape`,
  'Social & Dining': (city) => `Social restaurants and cafés in ${city}, Western Cape`,
  'Book Club': (city) => `Book clubs, libraries and bookstores in ${city}, Western Cape`,
  Gaming: (city) => `Gaming cafés and clubs in ${city}, Western Cape`,
};

// Moods don't map to a Places filter directly — they're folded into the
// query text as a light keyword hint, except Alcohol-free, which is
// enforced properly below by excluding bar/night_club result types.
const MOOD_KEYWORDS: Record<string, string> = {
  'Meet people': 'social',
  'Be active': 'active',
  'Something chilled': 'relaxed',
  'Go out tonight': 'nightlife',
  'Something outdoors': 'outdoor',
  Creative: 'creative',
  'Beginner-friendly': 'beginner friendly',
};

function buildTextQuery(city: string, category?: string, mood?: string, search?: string) {
  let base = search
    ? `${search} in ${city}, Western Cape`
    : category && CATEGORY_QUERY_TEMPLATES[category]
      ? CATEGORY_QUERY_TEMPLATES[category](city)
      : `Things to do in ${city}, Western Cape`;

  if (mood && MOOD_KEYWORDS[mood] && !search) {
    base = `${MOOD_KEYWORDS[mood]} ${base}`;
  }
  return base;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(s));
}

interface Card {
  placeId: string;
  name: string;
  rating: number | null;
  reviewCount: number;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  openNow: boolean | null;
  websiteUrl: string | null;
  googleMapsUrl: string | null;
  category: string | null;
  businessStatus: string | null;
  photoUrl: string | null;
  score: number;
}

// Bayesian-ish confidence blend so a 5.0/2-review place doesn't outrank a
// 4.8/1000-review place — pulls low-volume ratings toward a neutral prior.
const PRIOR_RATING = 4.0;
const PRIOR_WEIGHT = 10;

function toCard(place: PlaceResult, origin: { lat: number; lng: number } | null): Card {
  const rating = place.rating ?? null;
  const reviewCount = place.userRatingCount ?? 0;
  const distanceKm =
    origin && place.location ? haversineKm(origin, { lat: place.location.latitude, lng: place.location.longitude }) : null;

  const confidenceRating = rating != null
    ? (rating * reviewCount + PRIOR_RATING * PRIOR_WEIGHT) / (reviewCount + PRIOR_WEIGHT)
    : 0;
  const reviewVolumeBoost = Math.log10(reviewCount + 1); // diminishing returns
  const distancePenalty = distanceKm != null ? Math.min(distanceKm / 10, 3) : 0;
  const infoBonus = (place.websiteUri ? 0.15 : 0) + (place.photos?.length ? 0.15 : 0);
  const closedPenalty = place.businessStatus && place.businessStatus !== 'OPERATIONAL' ? 5 : 0;

  const score = confidenceRating + reviewVolumeBoost * 0.3 + infoBonus - distancePenalty - closedPenalty;

  return {
    placeId: place.id,
    name: place.displayName?.text ?? 'Unnamed place',
    rating,
    reviewCount,
    address: place.formattedAddress ?? null,
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,
    distanceKm,
    openNow: place.currentOpeningHours?.openNow ?? null,
    websiteUrl: place.websiteUri ?? null,
    googleMapsUrl: place.googleMapsUri ?? null,
    category: place.primaryTypeDisplayName?.text ?? null,
    businessStatus: place.businessStatus ?? null,
    photoUrl: place.photos?.[0]?.name ? `/v1/discover/photo?name=${encodeURIComponent(place.photos[0].name)}` : null,
    score,
  };
}

const SORTERS: Record<string, (a: Card, b: Card) => number> = {
  recommended: (a, b) => b.score - a.score,
  highest_rated: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount,
  most_reviewed: (a, b) => b.reviewCount - a.reviewCount,
  nearest: (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
};

discoverRoute.get('/discover', async (c) => {
  if (!c.env.GOOGLE_MAPS_API_KEY) {
    return c.json(
      { message: 'Discover is not configured yet: GOOGLE_MAPS_API_KEY is not set on this Worker.' },
      501,
    );
  }

  const city = c.req.query('city');
  if (!city) return c.json({ message: 'city is required' }, 400);

  const category = c.req.query('category') || undefined;
  const mood = c.req.query('mood') || undefined;
  const search = c.req.query('search') || undefined;
  const sort = c.req.query('sort') || 'recommended';
  const pageToken = c.req.query('pageToken') || undefined;
  const latitude = c.req.query('latitude') ? Number(c.req.query('latitude')) : undefined;
  const longitude = c.req.query('longitude') ? Number(c.req.query('longitude')) : undefined;
  const radiusKm = c.req.query('radiusKm') ? Number(c.req.query('radiusKm')) : undefined;

  const cacheKey = new Request(c.req.url, c.req.raw);
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const textQuery = buildTextQuery(city, category, mood, search);
  const { places, nextPageToken } = await searchTextPlaces(c.env, {
    textQuery,
    pageToken,
    latitude,
    longitude,
    radiusMeters: radiusKm ? radiusKm * 1000 : undefined,
  });

  const origin = latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null;
  let cards = places
    .filter((p) => p.businessStatus !== 'CLOSED_PERMANENTLY')
    .map((p) => toCard(p, origin));

  if (mood === 'Alcohol-free') {
    cards = cards.filter((card, i) => !['bar', 'night_club'].includes(places[i].primaryType ?? ''));
  }

  const sorter = SORTERS[sort] ?? SORTERS.recommended;
  cards = cards.sort(sorter);

  const body = {
    query: textQuery,
    results: cards,
    nextPageToken: nextPageToken ?? null,
    attribution: 'Place data © Google',
  };

  const response = c.json(body);
  response.headers.set('Cache-Control', 'public, max-age=900'); // 15 min edge cache
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
});

discoverRoute.get('/discover/photo', async (c) => {
  if (!c.env.GOOGLE_MAPS_API_KEY) {
    return c.json({ message: 'Discover is not configured yet.' }, 501);
  }
  const name = c.req.query('name');
  if (!name) return c.json({ message: 'name is required' }, 400);

  const cacheKey = new Request(c.req.url, c.req.raw);
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const upstream = await fetchPlacePhoto(c.env, name, 800);
  const response = new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  });
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
});
