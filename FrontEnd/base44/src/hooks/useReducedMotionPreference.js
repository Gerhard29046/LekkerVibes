import { useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useAccessibilityPrefs } from '@/lib/accessibilityPrefs';

// Combines the OS-level `prefers-reduced-motion` query with the user's own
// in-app "Reduce animations" accessibility setting (src/lib/
// accessibilityPrefs.js, also used on Profile/Settings) — one signal every
// homepage animation should gate on, signed-in or not.
export function useReducedMotionPreference() {
  const { user } = useAuth();
  const systemReduceMotion = useReducedMotion();
  const { prefs } = useAccessibilityPrefs(null, user?.uid);
  return !!systemReduceMotion || !!prefs.reduceMotion;
}
