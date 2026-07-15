import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const INTERESTS = [
  { label: 'Run', emoji: '🏃', color: 'from-coral to-peach' },
  { label: 'Walk', emoji: '🚶', color: 'from-leaf to-teal' },
  { label: 'Hike', emoji: '🥾', color: 'from-teal to-ocean' },
  { label: 'Surf', emoji: '🏄', color: 'from-sky to-ocean' },
  { label: 'Cycle', emoji: '🚴', color: 'from-ocean to-teal' },
  { label: 'Eat', emoji: '🍽️', color: 'from-peach to-coral' },
  { label: 'Dance', emoji: '💃', color: 'from-coral to-peach' },
  { label: 'Read', emoji: '📚', color: 'from-ocean to-sky' },
  { label: 'Game', emoji: '🎮', color: 'from-teal to-leaf' },
  { label: 'Create', emoji: '🎨', color: 'from-coral to-peach' },
  { label: 'Volunteer', emoji: '🤝', color: 'from-leaf to-teal' },
  { label: 'Worship', emoji: '🙏', color: 'from-peach to-coral' },
  { label: 'Train', emoji: '💪', color: 'from-ocean to-teal' },
  { label: 'Explore', emoji: '🧭', color: 'from-teal to-ocean' },
  { label: 'Socialise', emoji: '🥂', color: 'from-coral to-peach' },
];

export default function FindCrewSection() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center mb-10 sm:mb-14">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-teal text-sm font-semibold mb-2 uppercase tracking-wide"
        >
          Find your crew
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal"
        >
          What do you love doing?
        </motion.h2>
      </div>

      <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
        {INTERESTS.map((interest, i) => (
          <motion.div
            key={interest.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03 }}
          >
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white border border-sand hover:border-ocean/30 hover:shadow-md transition-all group cursor-pointer"
            >
              <span className="text-lg">{interest.emoji}</span>
              <span className="text-sm font-semibold text-charcoal group-hover:text-ocean transition-colors">
                {interest.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}