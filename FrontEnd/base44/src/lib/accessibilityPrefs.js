import { useState, useEffect, useCallback } from 'react';
import { profileApi } from '@/api/profileApi';

// Per-device instant cache so accessibility prefs apply on first paint
// (before the Firestore profile has loaded), synced from/to the user's
// profile doc (`accessibilityPrefs`) so the choice follows them across
// devices too. Applied as classes on <html> so plain CSS can react to them
// everywhere in the app, not just on pages that mount the settings hook.
const STORAGE_KEY = 'lv_accessibility_prefs';

export const DEFAULT_ACCESSIBILITY_PREFS = {
  reduceMotion: false,
  disableParallax: false,
  largerText: false,
  increasedContrast: false,
  strongerFocus: false,
  simplifiedCards: false,
  pauseMarquees: false,
  reduceImageMotion: false,
  screenReaderImprovements: false,
  useSystemMotion: true,
};

const CLASS_MAP = {
  reduceMotion: 'lv-reduce-motion',
  disableParallax: 'lv-disable-parallax',
  largerText: 'lv-larger-text',
  increasedContrast: 'lv-increased-contrast',
  strongerFocus: 'lv-stronger-focus',
  simplifiedCards: 'lv-simplified-cards',
  pauseMarquees: 'lv-pause-marquees',
  reduceImageMotion: 'lv-reduce-image-motion',
};

export function readCachedAccessibilityPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_ACCESSIBILITY_PREFS, ...JSON.parse(raw) } : DEFAULT_ACCESSIBILITY_PREFS;
  } catch {
    return DEFAULT_ACCESSIBILITY_PREFS;
  }
}

export function applyAccessibilityClasses(prefs) {
  const root = document.documentElement;
  Object.entries(CLASS_MAP).forEach(([key, className]) => {
    root.classList.toggle(className, !!prefs[key]);
  });
}

function persistCache(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  applyAccessibilityClasses(prefs);
}

// Called once at app boot (see main.jsx) so the cached prefs are active
// before React (and Firebase auth) has resolved anything.
export function bootAccessibilityPrefs() {
  applyAccessibilityClasses(readCachedAccessibilityPrefs());
}

// `profile` is the loaded users/{uid} doc (or null while loading) — once it
// arrives, its accessibilityPrefs (server-authoritative) overwrite the local
// cache so a change made on another device shows up here too.
export function useAccessibilityPrefs(profile, uid) {
  const [prefs, setPrefs] = useState(readCachedAccessibilityPrefs);

  useEffect(() => {
    if (!profile?.accessibilityPrefs) return;
    const merged = { ...DEFAULT_ACCESSIBILITY_PREFS, ...profile.accessibilityPrefs };
    setPrefs(merged);
    persistCache(merged);
  }, [profile?.accessibilityPrefs]);

  const update = useCallback(async (partial) => {
    const next = { ...prefs, ...partial };
    setPrefs(next);
    persistCache(next);
    if (uid) await profileApi.updateAccessibilityPrefs(uid, next);
  }, [prefs, uid]);

  return { prefs, update };
}
