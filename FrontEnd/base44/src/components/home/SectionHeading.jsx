import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function SectionHeading({ eyebrow, title, viewAllTo, viewAllLabel = 'View all', reduceMotion, accent = 'text-coral', direction = 'up' }) {
  const reveal = useScrollReveal({ reduceMotion, direction });
  return (
    <div className="flex items-end justify-between gap-4 mb-8 sm:mb-12">
      <div>
        {eyebrow && (
          <motion.p {...reveal} className={`text-sm font-semibold mb-2 uppercase tracking-wide ${accent}`}>
            {eyebrow}
          </motion.p>
        )}
        <motion.h2
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.08 }}
          className="font-body text-2xl sm:text-3xl md:text-4xl font-bold text-white"
        >
          {title}
        </motion.h2>
      </div>
      {viewAllTo && (
        <Link to={viewAllTo} className="hidden sm:flex items-center gap-1 text-sm font-medium text-white/80 hover:text-white transition-colors shrink-0">
          {viewAllLabel} <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
