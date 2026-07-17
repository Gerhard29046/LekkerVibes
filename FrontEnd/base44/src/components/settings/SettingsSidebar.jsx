import React from 'react';
import { motion } from 'framer-motion';
import {
  CircleUserRound, Palette, ShieldCheck, Bell, UsersRound, CalendarDays,
  MessagesSquare, MapPin, Accessibility, LockKeyhole, HardDriveDownload,
} from 'lucide-react';
import { SECTION_COLORS } from './primitives';

export const SETTINGS_CATEGORIES = [
  { id: 'account', label: 'Account', description: 'Manage your personal information and account details.', icon: CircleUserRound, color: 'teal' },
  { id: 'appearance', label: 'Profile appearance', description: 'Choose how your profile looks and feels.', icon: Palette, color: 'coral' },
  { id: 'privacy', label: 'Privacy and safety', description: 'Control who can find, follow and interact with you.', icon: ShieldCheck, color: 'green' },
  { id: 'notifications', label: 'Notifications', description: 'Choose what LekkerVibes should notify you about.', icon: Bell, color: 'amber' },
  { id: 'communities', label: 'Communities and groups', description: 'Manage community participation and followed groups.', icon: UsersRound, color: 'sky' },
  { id: 'discovery', label: 'Events and discovery', description: 'Personalise activity suggestions and event updates.', icon: CalendarDays, color: 'peach' },
  { id: 'messages', label: 'Messages', description: 'Manage community, group and event chat preferences.', icon: MessagesSquare, color: 'lavender' },
  { id: 'location', label: 'Location', description: 'Control your location and nearby discovery settings.', icon: MapPin, color: 'coral' },
  { id: 'accessibility', label: 'Accessibility', description: 'Adjust motion, contrast and reading preferences.', icon: Accessibility, color: 'blue' },
  { id: 'security', label: 'Security', description: 'Protect your account and active sessions.', icon: LockKeyhole, color: 'slate' },
  { id: 'data', label: 'Data and account', description: 'Download your data or manage account removal.', icon: HardDriveDownload, color: 'red' },
];

export function SettingsSidebar({ active, onSelect, theme, reduceMotion }) {
  return (
    <motion.nav
      initial={reduceMotion ? false : { opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
      aria-label="Settings categories"
      className="hidden lg:block sticky top-24 self-start rounded-[20px] bg-white/95 border border-slate-200 shadow-[0_8px_30px_rgba(15,76,92,0.05)] p-3 space-y-1 max-h-[calc(100vh-7rem)] overflow-y-auto"
    >
      {SETTINGS_CATEGORIES.map((cat, i) => {
        const isActive = active === cat.id;
        const c = SECTION_COLORS[cat.color];
        return (
          <motion.button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            initial={reduceMotion ? false : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reduceMotion ? 0 : i * 0.03 }}
            whileHover={reduceMotion ? {} : { x: 3 }}
            className="relative flex w-full items-start gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors"
            style={{ background: isActive ? theme.soft : 'transparent' }}
          >
            {isActive && (
              <motion.span
                layoutId="settings-active-indicator"
                className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
                style={{ background: theme.primary }}
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={isActive ? { background: theme.primary, color: '#fff' } : { background: c.bg }}
            >
              <cat.icon className={`w-[18px] h-[18px] ${isActive ? '' : c.text}`} />
            </span>
            <span className="min-w-0">
              <p className={`font-bold text-sm ${isActive ? '' : 'text-slate-800'}`} style={isActive ? { color: theme.text } : undefined}>
                {cat.label}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">{cat.description}</p>
            </span>
          </motion.button>
        );
      })}
    </motion.nav>
  );
}

// Mobile: horizontally scrollable category chips, scrollbar hidden.
export function SettingsMobileNav({ active, onSelect, theme }) {
  return (
    <div className="lg:hidden -mx-4 px-4 mb-5">
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-2 w-max pb-1">
          {SETTINGS_CATEGORIES.map((cat) => {
            const isActive = active === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap border-2 transition-colors"
                style={isActive
                  ? { borderColor: theme.primary, background: theme.soft, color: theme.text }
                  : { borderColor: '#E2E8F0', color: '#475569', background: '#fff' }}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
