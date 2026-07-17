import { useState, useEffect, useCallback, useRef } from 'react';
import { placesApi } from '@/api/placesApi';

// Shared loading/error/retry wrapper around placesApi.textSearch, so every
// Places-backed homepage section (restaurants, galleries, culture) gets the
// same skeleton/error/retry behaviour instead of each reimplementing it.
export function useGooglePlaces(query, { city, limit } = {}) {
  const [state, setState] = useState({ status: 'loading', results: [], attribution: null });
  const [retryToken, setRetryToken] = useState(0);
  const abortRef = useRef(null);

  const retry = useCallback(() => setRetryToken((t) => t + 1), []);

  useEffect(() => {
    if (!query) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((s) => ({ ...s, status: 'loading' }));
    placesApi.textSearch(query, { city, signal: controller.signal })
      .then((data) => {
        setState({
          status: 'success',
          results: limit ? (data.results || []).slice(0, limit) : (data.results || []),
          attribution: data.attribution || null,
        });
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setState({ status: 'error', results: [], attribution: null });
      });

    return () => controller.abort();
  }, [query, city, limit, retryToken]);

  return { ...state, retry };
}
