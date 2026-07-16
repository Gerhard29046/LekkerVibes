import { useState, useEffect, createContext, useContext } from 'react';

const LocationContext = createContext(null);

// City-theme architecture: this list (and the persisted selection below)
// drives location-aware theming elsewhere in the app. Keep in alphabetical
// order — more cities/themes will be added later, not replaced.
const CITIES = [
  "Bellville", "Cape Town", "Durbanville", "George",
  "Gqeberha", "Paarl", "Somerset West", "Stellenbosch"
];

export function LocationProvider({ children }) {
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem('lv_city') || 'Stellenbosch';
  });

  useEffect(() => {
    localStorage.setItem('lv_city', selectedCity);
  }, [selectedCity]);

  return (
    <LocationContext.Provider value={{ selectedCity, setSelectedCity, cities: CITIES }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) return { selectedCity: 'Stellenbosch', setSelectedCity: () => {}, cities: CITIES };
  return ctx;
}