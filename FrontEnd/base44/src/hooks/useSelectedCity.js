import { useLocation } from '@/hooks/useLocation.jsx';
import { getCityTheme } from '@/config/cityThemes';

// Thin adapter over the existing city-selector context (useLocation) that
// resolves whether the currently selected city has a dedicated themed
// homepage — keeps the "which cities get a custom theme" decision in one
// registry (config/cityThemes.js) instead of scattered `=== 'Cape Town'`
// checks.
export function useSelectedCity() {
  const { selectedCity, setSelectedCity, cities } = useLocation();
  const theme = getCityTheme(selectedCity);
  return {
    name: selectedCity,
    slug: theme?.id || null,
    theme,
    setSelectedCity,
    cities,
  };
}
