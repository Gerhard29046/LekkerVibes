// "Online" = active within the last couple of minutes — see the heartbeat
// note in AuthContext.jsx for why this is an approximation, not true
// realtime presence.
const ONLINE_WINDOW_MS = 2 * 60 * 1000;

export function isOnline(lastActiveAt) {
  if (!lastActiveAt) return false;
  const date = lastActiveAt.toDate ? lastActiveAt.toDate() : new Date(lastActiveAt);
  return Date.now() - date.getTime() < ONLINE_WINDOW_MS;
}
