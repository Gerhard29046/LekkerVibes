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

  shortcuts: [
    { label: 'Hiking', category: 'Hiking', colour: 'leaf' },
    { label: 'Markets', category: 'Food & Markets', colour: 'coral' },
    { label: 'Food & Drinks', category: 'Social & Dining', colour: 'peach' },
    { label: 'Wellness', category: 'Yoga & Wellness', colour: 'sky' },
    { label: 'Live Music', category: 'Gaming', colour: 'ocean' },
    { label: 'Art & Culture', category: 'Book Club', colour: 'teal' },
    { label: 'Family Friendly', mood: 'Something chilled', colour: 'coral' },
    { label: 'Outdoor Adventures', category: 'Surfing', colour: 'sky' },
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
