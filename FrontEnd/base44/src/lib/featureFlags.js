// Single source of truth for what's live in this deployment. Everything
// still backed by the (now-disconnected) Laravel API is flagged off here
// rather than deleted — see documentation/FEATURE_STATUS.md.
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
  // context panel) — off until the message-type extension (reactions,
  // image/event cards) and the member-list popup are both tested
  // end-to-end against the real Firestore project. The existing simple
  // single-thread chat (GroupChat.jsx, /chat/:conversationId) stays live
  // regardless of this flag for event chats.
  messages: false,
  locations: false,
  profileEdit: true,
  uploads: true,
  reports: true,
  blocks: false,
  saved: true,
};
