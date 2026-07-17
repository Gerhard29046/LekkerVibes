import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { PROFILE_THEMES } from '@/lib/profileThemes';

export default function ThemeSelector({ value, onChange, reduceMotion }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Object.entries(PROFILE_THEMES).map(([key, theme]) => {
        const selected = value === key;
        return (
          <motion.button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            whileHover={reduceMotion ? {} : { y: -3, scale: 1.01 }}
            whileFocus={{ scale: 1.01 }}
            className="relative rounded-2xl border-2 p-4 text-left transition-colors focus:outline-none"
            style={{ borderColor: selected ? theme.primary : '#E2E8F0', background: selected ? theme.soft : '#fff' }}
          >
            {selected && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: theme.primary }}>
                <Check className="w-3 h-3" />
              </span>
            )}
            <div className="h-12 rounded-xl" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.border})` }} />
            <p className="mt-3 font-bold text-sm text-slate-900">{theme.label}</p>
          </motion.button>
        );
      })}
    </div>
  );
}
