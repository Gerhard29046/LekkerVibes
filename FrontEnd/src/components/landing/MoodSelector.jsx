import React from 'react';
import { motion } from 'framer-motion';
import { Users, Zap, Coffee, Moon, Trees, Wine, Church, Palette, Baby, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const MOODS = [
  { label: 'I want to meet people', icon: Users, color: 'bg-coral/10 text-coral border-coral/20' },
  { label: 'I want to be active', icon: Zap, color: 'bg-teal/10 text-teal border-teal/20' },
  { label: 'I want something chilled', icon: Coffee, color: 'bg-peach/30 text-charcoal border-peach/40' },
  { label: 'I want to go out tonight', icon: Moon, color: 'bg-ocean/10 text-ocean border-ocean/20' },
  { label: 'I want something outdoors', icon: Trees, color: 'bg-leaf/10 text-leaf border-leaf/20' },
  { label: 'I want something alcohol-free', icon: Wine, color: 'bg-sky/20 text-ocean border-sky/30', strike: true },
  { label: 'I want a faith community', icon: Church, color: 'bg-peach/20 text-charcoal border-peach/30' },
  { label: 'I want something creative', icon: Palette, color: 'bg-coral/10 text-coral border-coral/20' },
  { label: 'I want something beginner-friendly', icon: Star, color: 'bg-sky/20 text-ocean border-sky/30' },
  { label: 'I want a family activity', icon: Baby, color: 'bg-leaf/10 text-leaf border-leaf/20' },
];

export default function MoodSelector() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center mb-10 sm:mb-14">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-coral text-sm font-semibold mb-2 uppercase tracking-wide"
        >
          Match my mood
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal"
        >
          What kind of vibe are you feeling?
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 max-w-5xl mx-auto">
        {MOODS.map((mood, i) => {
          const Icon = mood.icon;
          return (
            <motion.div
              key={mood.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to="/discover"
                className={`flex items-center gap-3 p-4 rounded-xl border ${mood.color} hover:shadow-md transition-all cursor-pointer group`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{mood.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}