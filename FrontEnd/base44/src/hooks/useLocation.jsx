import { useState, useEffect, createContext, useContext } from 'react';

const LocationContext = createContext(null);

const CITIES = [
  "Stellenbosch", "Somerset West", "Cape Town", "Paarl", "Durbanville",
  "Bellville", "George", "Gqeberha", "Johannesburg", "Pretoria", "Durban"
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