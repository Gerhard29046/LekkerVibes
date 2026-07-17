import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Image reveal styles for the Cape Town homepage — varied per section
// rather than reusing one effect everywhere. Falls back to a themed
// gradient on load error, so a not-yet-saved image never renders as a
// broken-image icon.
//
// 'wipe' and 'curtain' are clip-path-based reveals — verified via a real
// browser screenshot pass to sometimes get stuck permanently hidden
// (`whileInView` never resolving the clip-path to its "show" value in some
// grid positions, even though the identical image element right next to it
// animated in fine). Root cause not tracked down yet; don't wire them up to
// a real section until that's understood. 'scale' and 'blur' (opacity/
// filter-based) were confirmed working in the same test and are the only
// two currently used.
const VARIANTS = {
  wipe: {
    hidden: { clipPath: 'inset(0 100% 0 0)' },
    show: { clipPath: 'inset(0 0% 0 0)', transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
  },
  scale: {
    hidden: { opacity: 0, scale: 1.08 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
  },
  curtain: {
    hidden: { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' },
    show: { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } },
  },
  blur: {
    hidden: { opacity: 0, filter: 'blur(14px)' },
    show: { opacity: 1, filter: 'blur(0px)', transition: { duration: 0.7, ease: 'easeOut' } },
  },
};

export default function ImageReveal({ src, alt, variant = 'scale', className = '', imgClassName = '', reduceMotion, fallbackGradient = 'from-ocean via-teal to-sky' }) {
  const [errored, setErrored] = useState(false);
  const v = VARIANTS[variant] || VARIANTS.scale;

  if (errored || !src) {
    return <div className={`bg-gradient-to-br ${fallbackGradient} ${className}`} role="img" aria-label={alt} />;
  }

  return (
    <motion.div
      initial={reduceMotion ? false : 'hidden'}
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      variants={reduceMotion ? undefined : v}
      className={`overflow-hidden ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setErrored(true)}
        className={`w-full h-full object-cover ${imgClassName}`}
      />
    </motion.div>
  );
}
