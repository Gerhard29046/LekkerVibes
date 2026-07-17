import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Check } from 'lucide-react';
import { profileApi } from '@/api/profileApi';
import { DEFAULT_DISCOVERY_PREFS, DISCOVERY_MOODS, DISCOVERY_CATEGORIES } from '@/lib/settingsDefaults';
import { PanelHeader, SettingsSection, SettingsRow, SettingsToggle, SettingsSelect, InlineFeedback, SaveButton, SECTION_COLORS } from '../primitives';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_OPTIONS = [
  { value: 'any', label: 'Any time' }, { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' }, { value: 'evening', label: 'Evening' },
];
const TRANSPORT_OPTIONS = [
  { value: 'any', label: 'Any' }, { value: 'walk', label: 'Walking distance' },
  { value: 'drive', label: 'Driving' }, { value: 'public', label: 'Public transport' },
];
const PRICE_OPTIONS = [
  { value: 'any', label: 'Any price' }, { value: 'free', label: 'Free' },
  { value: 'low', label: 'Budget-friendly' }, { value: 'mid', label: 'Mid-range' }, { value: 'premium', label: 'Premium' },
];
const SETTING_OPTIONS = [
  { value: 'any', label: 'Indoor or outdoor' }, { value: 'indoor', label: 'Indoor' }, { value: 'outdoor', label: 'Outdoor' },
];

export default function DiscoveryPanel({ profile, user, theme, reduceMotion, onProfileChange, onDirtyChange }) {
  const initial = { ...DEFAULT_DISCOVERY_PREFS, ...profile?.discoveryPrefs };
  const [prefs, setPrefs] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const dirty = JSON.stringify(prefs) !== JSON.stringify(initial);

  useEffect(() => {
    onDirtyChange?.(dirty ? { onSave: handleSave, onDiscard: () => setPrefs(initial), saving } : null);
    return () => onDirtyChange?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, saving]);

  const set = (key, value) => setPrefs((p) => ({ ...p, [key]: value }));
  const toggleArrayValue = (key, value) => setPrefs((p) => ({
    ...p,
    [key]: p[key].includes(value) ? p[key].filter((v) => v !== value) : [...p[key], value],
  }));

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await profileApi.updateDiscoveryPrefs(user.uid, prefs);
      onProfileChange?.({ discoveryPrefs: prefs });
      setStatus({ type: 'success', message: 'Discovery preferences saved.' });
    } catch {
      setStatus({ type: 'error', message: 'Could not save — please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PanelHeader icon={CalendarDays} color="peach" title="Events and discovery" description="Personalise activity suggestions and event updates." />

      <div className="space-y-5">
        <SettingsSection title="What kind of vibe are you feeling?">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {DISCOVERY_MOODS.map((mood, i) => {
              const selected = prefs.preferredMoods.includes(mood.key);
              const c = SECTION_COLORS[mood.color] || SECTION_COLORS.teal;
              return (
                <motion.button
                  key={mood.key}
                  type="button"
                  onClick={() => toggleArrayValue('preferredMoods', mood.key)}
                  whileHover={reduceMotion ? {} : { y: -2 }}
                  className={`relative flex items-center gap-2 p-3.5 rounded-xl border-2 text-left transition-colors ${c.bg}`}
                  style={{ borderColor: selected ? theme.primary : 'transparent' }}
                >
                  {selected && (
                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ background: theme.primary }}>
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <span className={`text-xs font-bold ${c.text} pr-4`}>{mood.label}</span>
                </motion.button>
              );
            })}
          </div>
        </SettingsSection>

        <SettingsSection title="Preferred categories">
          <div className="flex flex-wrap gap-2">
            {DISCOVERY_CATEGORIES.map((cat) => {
              const selected = prefs.preferredCategories.includes(cat);
              return (
                <button key={cat} onClick={() => toggleArrayValue('preferredCategories', cat)}
                  className="px-3.5 py-2 rounded-full text-xs font-bold border-2 transition-colors"
                  style={selected ? { borderColor: theme.primary, background: theme.soft, color: theme.text } : { borderColor: '#E2E8F0', color: '#475569' }}>
                  {cat}
                </button>
              );
            })}
          </div>
        </SettingsSection>

        <SettingsSection title="Preferred days">
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const selected = prefs.preferredDays.includes(day);
              return (
                <button key={day} onClick={() => toggleArrayValue('preferredDays', day)}
                  className="w-14 py-2 rounded-xl text-xs font-bold border-2 transition-colors"
                  style={selected ? { borderColor: theme.primary, background: theme.soft, color: theme.text } : { borderColor: '#E2E8F0', color: '#475569' }}>
                  {day}
                </button>
              );
            })}
          </div>
        </SettingsSection>

        <SettingsSection title="Fine-tune your discovery">
          <div className="space-y-3">
            <SettingsRow label="Preferred time of day" themeColor={theme.primary}>
              <SettingsSelect value={prefs.preferredTimeOfDay} onChange={(v) => set('preferredTimeOfDay', v)} options={TIME_OPTIONS} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Transport preference" themeColor={theme.primary}>
              <SettingsSelect value={prefs.transportPreference} onChange={(v) => set('transportPreference', v)} options={TRANSPORT_OPTIONS} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Price preference" themeColor={theme.primary}>
              <SettingsSelect value={prefs.pricePreference} onChange={(v) => set('pricePreference', v)} options={PRICE_OPTIONS} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Indoor or outdoor" themeColor={theme.primary}>
              <SettingsSelect value={prefs.indoorOutdoor} onChange={(v) => set('indoorOutdoor', v)} options={SETTING_OPTIONS} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Family-friendly activities" description="Prioritise activities suitable for families with children." themeColor={theme.primary}>
              <SettingsToggle checked={prefs.familyFriendly} onChange={(v) => set('familyFriendly', v)} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Alcohol-free activities" themeColor={theme.primary}>
              <SettingsToggle checked={prefs.alcoholFree} onChange={(v) => set('alcoholFree', v)} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Beginner-friendly activities" themeColor={theme.primary}>
              <SettingsToggle checked={prefs.beginnerFriendly} onChange={(v) => set('beginnerFriendly', v)} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Faith-community activities" themeColor={theme.primary}>
              <SettingsToggle checked={prefs.faithCommunity} onChange={(v) => set('faithCommunity', v)} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Accessibility-friendly venues" description="Prioritise venues with step-free access and accessible facilities." themeColor={theme.primary}>
              <SettingsToggle checked={prefs.accessibilityFriendly} onChange={(v) => set('accessibilityFriendly', v)} themeColor={theme.primary} />
            </SettingsRow>
          </div>

          <div className="flex items-center justify-end gap-4 mt-5 pt-5 border-t border-slate-100">
            <InlineFeedback status={status} />
            <SaveButton onClick={handleSave} saving={saving} themeColor={theme.primary} />
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
