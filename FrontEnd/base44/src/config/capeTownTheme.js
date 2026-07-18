import { capeTownImages } from './capeTownImages';

// Cape Town's city-theme definition. Colours intentionally reuse the exact
// tokens already in tailwind.config.js (ocean/teal/sky/coral/peach/sand/
// cream/leaf/charcoal) rather than a parallel hex palette — this is the
// Coastal Community system everywhere else on the site, not a one-off skin.
export const capeTownTheme = {
  id: 'cape-town',
  name: 'Cape Town',

  hero: {
    eyebrow: 'Discovering in Cape Town',
    title: 'Find your people.\nFind your vibe.',
    subtitle: 'Discover events, communities, food, culture and unforgettable local experiences happening around Cape Town.',
    images: capeTownImages.hero,
  },

  // Deliberately only 3 — the rest of the category set (Wellness, Live
  // Music, Art & Culture, Family Friendly, Outdoor Adventures) is still
  // reachable via Discover's own category filters and the "What to do in
  // Cape Town" section (capeTownTheme.whatToDo below), just not duplicated
  // as hero shortcuts. Each has its own gradient + icon per the hero visual
  // spec, rather than the single flat glass-dark pill used elsewhere.
  shortcuts: [
    { label: 'Hiking', category: 'Hiking', icon: 'mountain', gradient: 'linear-gradient(135deg, #0F766E, #16A085)' },
    { label: 'Markets', category: 'Food & Markets', icon: 'shopping-basket', gradient: 'linear-gradient(135deg, #C77716, #E59A2F)' },
    { label: 'Food & Drinks', category: 'Social & Dining', icon: 'utensils', gradient: 'linear-gradient(135deg, #F97366, #FB806B)' },
  ],

  whatToDo: [
    { label: 'Outdoor adventures', query: 'outdoor adventures', colour: 'leaf' },
    { label: 'Beaches & ocean', query: 'beaches', colour: 'sky' },
    { label: 'Food & markets', query: 'food markets', colour: 'coral' },
    { label: 'Art & culture', query: 'art and culture', colour: 'teal' },
    { label: 'Family activities', query: 'family activities', colour: 'peach' },
    { label: 'Wellness', query: 'wellness and yoga', colour: 'ocean' },
    { label: 'Heritage', query: 'heritage sites', colour: 'coral' },
    { label: 'Nightlife', query: 'nightlife', colour: 'ocean' },
    { label: 'Faith & community', query: 'faith and community', colour: 'leaf' },
    { label: 'Beginner-friendly', query: 'beginner friendly activities', colour: 'sky' },
  ],

  areas: [
    {
      slug: 'waterfront',
      name: 'V&A Waterfront',
      description: 'Harbour-front shopping, dining and Cape Town’s most famous view of Table Mountain.',
      image: capeTownImages.areas.waterfront,
    },
    {
      slug: 'sea-point',
      name: 'Sea Point',
      description: 'Promenade walks, sea pools and Lion’s Head as your backdrop.',
      image: capeTownImages.areas.seaPoint,
    },
    {
      slug: 'city-bowl',
      name: 'City Bowl',
      description: 'Cape Town’s creative core — markets, galleries and Table Mountain towering over it all.',
      image: capeTownImages.areas.cityBowl,
    },
    { slug: 'green-point', name: 'Green Point', description: 'Parkland, the stadium and a laid-back coastal edge.', image: capeTownImages.areas.cityBowl },
    { slug: 'castle-district', name: 'Castle District', description: 'Cape Town’s oldest heritage core, anchored by the Castle of Good Hope.', image: capeTownImages.areas.cityBowl },
    { slug: 'blouberg', name: 'Blouberg', description: 'The postcard Table Mountain view, best at sunset.', image: capeTownImages.hero.sunset },
    { slug: 'muizenberg', name: 'Muizenberg', description: 'Colourful beach huts and Cape Town’s surf capital.', image: capeTownImages.hero.sunset },
  ],
};
