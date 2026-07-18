// "Explore categories" groupings for the Messages page's community
// switcher — coarser than the fine-grained `category` values communities
// are actually tagged with at creation (CreateClub.jsx's CATEGORIES list),
// deliberately: renaming/collapsing the underlying taxonomy would touch
// every already-created community's stored category, for a UI-only ask.
// Each group maps to the specific category values it should surface.
export const COMMUNITY_CATEGORY_GROUPS = [
  { label: 'Outdoors & Adventure', icon: 'mountain', categories: ['Running', 'Hiking', 'Surfing', 'Cycling'] },
  { label: 'Wellness & Health', icon: 'heart-pulse', categories: ['Yoga & Wellness'] },
  { label: 'Food & Drink', icon: 'utensils', categories: ['Food & Markets', 'Social & Dining'] },
  { label: 'Faith & Spirituality', icon: 'church', categories: ['Faith & Community'] },
  { label: 'Arts & Culture', icon: 'palette', categories: ['Book Club', 'Gaming'] },
];
