// Single source of truth for what's live in this deployment. Everything
// still backed by the (now-disconnected) Laravel API is flagged off here
// rather than deleted — see documentation/FEATURE_STATUS.md.
export const FEATURES = {
  auth: true,
  chat: true,
  fcm: true,
  events: false,
  communities: false,
  locations: false,
  profileEdit: false,
  uploads: false,
  reports: false,
  blocks: false,
  saved: false,
};
