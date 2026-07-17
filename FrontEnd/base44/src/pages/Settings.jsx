import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { profileApi } from '@/api/profileApi';
import { useAuth } from '@/lib/AuthContext';
import { getProfileTheme } from '@/lib/profileThemes';
import { useAccessibilityPrefs } from '@/lib/accessibilityPrefs';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import ProfileTabBar from '@/components/profile/ProfileTabBar';
import { SettingsSidebar, SettingsMobileNav, SETTINGS_CATEGORIES } from '@/components/settings/SettingsSidebar';
import { SaveBar } from '@/components/settings/primitives';

import AccountPanel from '@/components/settings/panels/AccountPanel';
import AppearancePanel from '@/components/settings/panels/AppearancePanel';
import PrivacyPanel from '@/components/settings/panels/PrivacyPanel';
import NotificationsPanel from '@/components/settings/panels/NotificationsPanel';
import CommunitiesPanel from '@/components/settings/panels/CommunitiesPanel';
import DiscoveryPanel from '@/components/settings/panels/DiscoveryPanel';
import MessagesPanel from '@/components/settings/panels/MessagesPanel';
import LocationPanel from '@/components/settings/panels/LocationPanel';
import AccessibilityPanel from '@/components/settings/panels/AccessibilityPanel';
import SecurityPanel from '@/components/settings/panels/SecurityPanel';
import DataAccountPanel from '@/components/settings/panels/DataAccountPanel';

const VALID_CATEGORIES = SETTINGS_CATEGORIES.map((c) => c.id);

export default function Settings() {
  const { user } = useAuth();
  const systemReduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dirtyInfo, setDirtyInfo] = useState(null);

  const initialCategory = searchParams.get('cat');
  const [category, setCategory] = useState(VALID_CATEGORIES.includes(initialCategory) ? initialCategory : 'account');

  const { prefs: accessibilityPrefs } = useAccessibilityPrefs(profile, user?.uid);
  const reduceMotion = systemReduceMotion || accessibilityPrefs.reduceMotion;

  useEffect(() => {
    if (!user) return;
    profileApi.get(user.uid).then((data) => {
      setProfile(data);
      setLoading(false);
    });
  }, [user]);

  const handleSelectCategory = useCallback((id) => {
    setCategory(id);
    setSearchParams((p) => { p.set('cat', id); return p; }, { replace: true });
  }, [setSearchParams]);

  const handleProfileChange = useCallback((patch) => {
    setProfile((p) => ({ ...p, ...patch }));
  }, []);

  const handleDirtyChange = useCallback((info) => setDirtyInfo(info), []);

  const theme = getProfileTheme(profile?.profileTheme);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <SettingsSkeleton />
      </div>
    );
  }

  const panelProps = {
    profile, user, theme, reduceMotion,
    onProfileChange: handleProfileChange,
    onDirtyChange: handleDirtyChange,
  };

  return (
    <div className="min-h-screen bg-cream font-body">
      <Navbar />

      <div className="pt-20 pb-24 max-w-7xl mx-auto px-4 sm:px-6">
        <ProfileTabBar activeId="Settings" theme={theme} reduceMotion={reduceMotion} linkToProfile />

        <SettingsMobileNav active={category} onSelect={handleSelectCategory} theme={theme} />

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] items-start">
          <SettingsSidebar active={category} onSelect={handleSelectCategory} theme={theme} reduceMotion={reduceMotion} />

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="max-w-4xl w-full min-w-0"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={category}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
              >
                {category === 'account' && <AccountPanel {...panelProps} />}
                {category === 'appearance' && <AppearancePanel {...panelProps} />}
                {category === 'privacy' && <PrivacyPanel {...panelProps} />}
                {category === 'notifications' && <NotificationsPanel {...panelProps} />}
                {category === 'communities' && <CommunitiesPanel {...panelProps} />}
                {category === 'discovery' && <DiscoveryPanel {...panelProps} />}
                {category === 'messages' && <MessagesPanel {...panelProps} />}
                {category === 'location' && <LocationPanel {...panelProps} />}
                {category === 'accessibility' && <AccessibilityPanel {...panelProps} />}
                {category === 'security' && <SecurityPanel {...panelProps} />}
                {category === 'data' && <DataAccountPanel {...panelProps} />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <Footer />

      <SaveBar
        visible={!!dirtyInfo}
        saving={!!dirtyInfo?.saving}
        onDiscard={dirtyInfo?.onDiscard}
        onSave={dirtyInfo?.onSave}
        themeColor={theme.primary}
      />
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="pt-20 pb-24 max-w-7xl mx-auto px-4 sm:px-6 animate-pulse">
      <div className="h-16 bg-sand rounded-2xl mb-8" />
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden lg:block h-96 bg-white border border-sand rounded-[20px]" />
        <div className="space-y-4 max-w-4xl">
          <div className="h-20 bg-white border border-sand rounded-[22px]" />
          <div className="h-40 bg-white border border-sand rounded-[22px]" />
          <div className="h-40 bg-white border border-sand rounded-[22px]" />
        </div>
      </div>
    </div>
  );
}
