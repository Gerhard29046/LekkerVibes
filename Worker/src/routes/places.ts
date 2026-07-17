import { Hono, type Context } from 'hono';
import { searchTextPlaces, searchNearbyPlaces, fetchPlaceDetails, fetchPlacePhoto, type PlaceResult } from '../lib/googlePlaces';
import type { Env, Variables } from '../types/env';

// A second, more general-purpose Places (New) surface alongside
// routes/discover.ts's activity-provider search — used by the Cape Town
// homepage's restaurant/gallery/culture sections, which want a plain
// "search near this city" query rather than Discover's mood/category
// template matching. Shares the same googlePlaces.ts client and Cache API
// caching strategy so there's one place that actually talks to Google.
export const placesRoute = new Hono<{ Bindings: Env; Variables: Variables }>();

type NormalizedPlace = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  reviewCount: number;
  category: string | null;
  imageUrl: string | null;
  isOpen: boolean | null;
  websiteUrl: string | null;
  googleMapsUrl: string | null;
  priceLevel: string | null;
};

function normalizePlace(place: PlaceResult): NormalizedPlace {
  return {
    id: place.id,
    name: place.displayName?.text ?? 'Unnamed place',
    address: place.formattedAddress ?? null,
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,
    rating: place.rating ?? null,
    reviewCount: place.userRatingCount ?? 0,
    category: place.primaryTypeDisplayName?.text ?? null,
    imageUrl: place.photos?.[0]?.name ? `/v1/places/photo?name=${encodeURIComponent(place.photos[0].name)}` : null,
    isOpen: place.currentOpeningHours?.openNow ?? null,
    websiteUrl: place.websiteUri ?? null,
    googleMapsUrl: place.googleMapsUri ?? null,
    priceLevel: place.priceLevel ?? null,
  };
}

function notConfigured(c: Context<{ Bindings: Env; Variables: Variables }>) {
  return c.json({ message: 'Places search is not configured yet: GOOGLE_MAPS_API_KEY is not set on this Worker.' }, 501);
}

placesRoute.get('/places/text-search', async (c) => {
  if (!c.env.GOOGLE_MAPS_API_KEY) return notConfigured(c);

  const searchQuery = c.req.query('query');
  if (!searchQuery) return c.json({ message: 'query is required' }, 400);
  const city = c.req.query('city');
  const textQuery = city ? `${searchQuery} in ${city}` : searchQuery;
  const pageToken = c.req.query('pageToken') || undefined;

  const cacheKey = new Request(c.req.url, c.req.raw);
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const { places, nextPageToken } = await searchTextPlaces(c.env, { textQuery, pageToken });
  const results = places
    .filter((p) => p.businessStatus !== 'CLOSED_PERMANENTLY')
    .map(normalizePlace);

  const body = { query: textQuery, results, nextPageToken: nextPageToken ?? null, attribution: 'Place data © Google' };
  const response = c.json(body);
  response.headers.set('Cache-Control', 'public, max-age=3600'); // 1hr edge cache — these lists change slowly
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
});

placesRoute.get('/places/nearby-search', async (c) => {
  if (!c.env.GOOGLE_MAPS_API_KEY) return notConfigured(c);

  const latitude = Number(c.req.query('latitude'));
  const longitude = Number(c.req.query('longitude'));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return c.json({ message: 'latitude and longitude are required' }, 400);
  }
  const radiusKm = c.req.query('radiusKm') ? Number(c.req.query('radiusKm')) : undefined;
  const includedType = c.req.query('type') || undefined;

  const cacheKey = new Request(c.req.url, c.req.raw);
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const { places } = await searchNearbyPlaces(c.env, {
    latitude, longitude, includedType,
    radiusMeters: radiusKm ? radiusKm * 1000 : undefined,
  });
  const results = places
    .filter((p) => p.businessStatus !== 'CLOSED_PERMANENTLY')
    .map(normalizePlace);

  const body = { results, attribution: 'Place data © Google' };
  const response = c.json(body);
  response.headers.set('Cache-Control', 'public, max-age=3600');
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
});

placesRoute.get('/places/photo', async (c) => {
  if (!c.env.GOOGLE_MAPS_API_KEY) return notConfigured(c);
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

// Kept last so it doesn't shadow the more specific /places/* routes above.
placesRoute.get('/places/:placeId', async (c) => {
  if (!c.env.GOOGLE_MAPS_API_KEY) return notConfigured(c);
  const placeId = c.req.param('placeId');

  const cacheKey = new Request(c.req.url, c.req.raw);
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const place = await fetchPlaceDetails(c.env, placeId);
  const body = { result: normalizePlace(place), attribution: 'Place data © Google' };
  const response = c.json(body);
  response.headers.set('Cache-Control', 'public, max-age=3600');
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
});
