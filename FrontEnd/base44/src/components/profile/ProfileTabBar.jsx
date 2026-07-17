import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutGrid, Users, Bell, Calendar, Bookmark, Activity as ActivityIcon, Settings as SettingsIcon,
} from 'lucide-react';

export const PROFILE_TABS = [
  { id: 'Overview', icon: LayoutGrid },
  { id: 'Communities', icon: Users },
  { id: 'Following groups', icon: Bell },
  { id: 'Events', icon: Calendar },
  { id: 'Saved', icon: Bookmark },
  { id: 'Activity', icon: ActivityIcon },
];

const ALL_TABS = [...PROFILE_TABS, { id: 'Settings', icon: SettingsIcon }];

// Shared full-width tab bar used identically on Profile and Settings — the
// only difference is navigation behaviour: on Profile the 6 profile tabs are
// in-page buttons (Settings is a Link out); on Settings every tab is a Link
// back to /profile?tab=<id> so the underlying page keeps a single source of
// truth for tab content instead of duplicating it here.
export default function ProfileTabBar({ activeId, theme, reduceMotion, onTabSelect, linkToProfile = false }) {
  return (
    <div className="mt-8 mb-8 border-b-2 border-sand">
      <div className="overflow-x-auto no-scrollbar">
        <div className="grid grid-cols-7 min-w-[700px] lg:min-w-0 lg:w-full">
          {ALL_TABS.map((tab) => {
            const active = activeId === tab.id;
            const isSettings = tab.id === 'Settings';
            const inner = (
              <>
                <tab.icon className="w-4 h-4" style={active ? { color: theme.primary } : undefined} />
                {tab.id}
                {active && (
                  <motion.div
                    layoutId="profile-active-tab"
                    className="absolute inset-x-3 bottom-0 h-1 rounded-full"
                    style={{ backgroundColor: theme.primary }}
                    transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
              </>
            );
            const className = `relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 min-h-[68px] text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              active ? '' : 'text-charcoal/50 hover:text-charcoal'
            }`;
            const style = active ? { color: theme.primary } : undefined;

            if (isSettings || linkToProfile) {
              const to = isSettings ? '/settings' : `/profile?tab=${encodeURIComponent(tab.id)}`;
              return (
                <Link key={tab.id} to={to} className={className} style={style}>
                  {inner}
                </Link>
              );
            }
            return (
              <button key={tab.id} onClick={() => onTabSelect?.(tab.id)} className={className} style={style}>
                {inner}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
