// Registry of which selected cities get a dedicated themed homepage. Only
// Cape Town has one today — every other city in useLocation's CITIES list
// (Bellville, Durbanville, George, Gqeberha, Paarl, Somerset West,
// Stellenbosch) falls through to the existing default homepage untouched.
import { capeTownTheme } from './capeTownTheme';

export const CITY_THEMES = {
  'Cape Town': capeTownTheme,
};

export function getCityTheme(cityName) {
  return CITY_THEMES[cityName] || null;
}
