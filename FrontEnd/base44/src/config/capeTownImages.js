// Manifest for the Cape Town homepage's photography — kept out of JSX so
// there's one place to swap paths. These live under `public/` (not
// src/assets) deliberately: a missing file 404s gracefully at runtime
// (the <img onError> fallback in ImageReveal/CapeTownHero kicks in) instead
// of breaking the whole Vite build the way a missing src/assets import would.
export const capeTownImages = {
  hero: {
    primary: '/images/cape-town/hero/table-mountain-clouds.jpg',
    sunset: '/images/cape-town/hero/twelve-apostles-sunset.jpg',
    discover: '/images/cape-town/hero/cape-town-discover.png',
  },
  areas: {
    cityBowl: '/images/cape-town/areas/city-bowl-stadium.jpg',
    seaPoint: '/images/cape-town/areas/sea-point-lions-head.jpg',
    waterfront: '/images/cape-town/areas/waterfront.png',
  },
};
