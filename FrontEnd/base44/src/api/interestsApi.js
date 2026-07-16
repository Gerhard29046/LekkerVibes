// A fixed local list rather than a Firestore collection — small, rarely
// changes, and every page that needs it (profile interests, event/community
// categories) already shares this same taxonomy.
const INTERESTS = [
  'Running', 'Hiking', 'Surfing', 'Cycling', 'Yoga & Wellness',
  'Food & Markets', 'Faith & Community', 'Social & Dining', 'Book Club', 'Gaming',
];

export const interestsApi = {
  list: async () => INTERESTS.map((name) => ({ id: name, name })),
};
