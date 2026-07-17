import React from 'react';

// Required attribution for Google-sourced place data — kept as its own
// component so every Places-backed section renders it identically instead
// of each one improvising its own wording/placement.
export default function GooglePlaceAttribution({ className = '' }) {
  return (
    <p className={`text-[11px] text-charcoal/40 ${className}`}>
      Place data{' '}
      <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="underline hover:text-charcoal/60 transition-colors">
        © Google
      </a>
    </p>
  );
}
