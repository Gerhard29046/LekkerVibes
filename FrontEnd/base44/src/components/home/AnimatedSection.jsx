import React from 'react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

// Reusable scroll-triggered reveal wrapper for whole sections — takes a
// direction/delay so consecutive sections don't all use the identical
// reveal (per the "don't use the exact same reveal effect on every
// section" requirement).
export default function AnimatedSection({ children, className = '', direction = 'up', delay = 0, reduceMotion, as = 'section' }) {
  const reveal = useScrollReveal({ direction, delay, reduceMotion });
  const Component = motion[as] || motion.section;
  return (
    <Component className={className} {...reveal}>
      {children}
    </Component>
  );
}
