// Single source of truth for what the current UI exposes. Most active
// domains now use Firestore or the Worker; disabled entries remain hidden
// until their end-to-end behavior is ready — see FEATURE_STATUS.md.
export const FEATURES = {
  auth: true,
  chat: true,
  fcm: true,
  // Google Places-backed discovery via the Worker — see
  // Worker/src/routes/discover.ts. Live regardless of whether
  // GOOGLE_MAPS_API_KEY is set: the page itself shows an honest
  // "not connected yet" state rather than fake results when it's missing.
  discover: true,
  events: true,
  communities: true,
  // The full 3-panel Messages page (community switcher + rich thread +
  // context panel). The existing simple single-thread chat (GroupChat.jsx,
  // /chat/:conversationId) stays live regardless of this flag for event
  // chats.
  messages: true,
  locations: false,
  profileEdit: true,
  uploads: true,
  reports: true,
  blocks: false,
  saved: true,
};
