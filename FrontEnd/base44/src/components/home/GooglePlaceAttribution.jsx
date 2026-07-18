import React from 'react';

// Required attribution for Google-sourced place data — kept as its own
// component so every Places-backed section renders it identically instead
// of each one improvising its own wording/placement.
export default function GooglePlaceAttribution({ className = '' }) {
  return (
    <p className={`text-[11px] text-white/50 ${className}`}>
      Place data{' '}
      <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/75 transition-colors">
        © Google
      </a>
    </p>
  );
}
