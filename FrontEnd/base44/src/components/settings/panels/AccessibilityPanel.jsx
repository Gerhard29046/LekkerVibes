import React from 'react';
import { Accessibility } from 'lucide-react';
import { useAccessibilityPrefs } from '@/lib/accessibilityPrefs';
import { PanelHeader, SettingsSection, SettingsRow, SettingsToggle } from '../primitives';

const ROWS = [
  { key: 'reduceMotion', label: 'Reduce animations', description: 'Turns off floating shapes, cover-photo movement and bouncing chips in favour of simple fades.' },
  { key: 'disableParallax', label: 'Disable parallax', description: 'Stops the ambient background shapes from drifting behind the page.' },
  { key: 'largerText', label: 'Larger text', description: 'Increases base text size across the app.' },
  { key: 'increasedContrast', label: 'Increased contrast', description: 'Boosts text and border contrast for easier reading.' },
  { key: 'strongerFocus', label: 'Stronger focus indicators', description: 'Makes the keyboard focus ring thicker and more visible.' },
  { key: 'simplifiedCards', label: 'Simplified card layout', description: 'Removes decorative gradients and shadows from cards.' },
  { key: 'pauseMarquees', label: 'Pause moving marquees', description: 'Stops any auto-scrolling banners or tickers.' },
  { key: 'reduceImageMotion', label: 'Reduce image motion', description: 'Stops slow zoom/pan effects on cover and gallery photos.' },
  { key: 'screenReaderImprovements', label: 'Screen-reader improvements', description: 'Adds extra descriptive labels for assistive technology.' },
];

export default function AccessibilityPanel({ profile, user, theme }) {
  const { prefs, update } = useAccessibilityPrefs(profile, user?.uid);

  return (
    <div>
      <PanelHeader icon={Accessibility} color="blue" title="Accessibility" description="Adjust motion, contrast and reading preferences." />

      <SettingsSection>
        <div className="space-y-3">
          {ROWS.map((row) => (
            <SettingsRow key={row.key} label={row.label} description={row.description} themeColor={theme.primary}>
              <SettingsToggle checked={!!prefs[row.key]} onChange={(v) => update({ [row.key]: v })} themeColor={theme.primary} />
            </SettingsRow>
          ))}
          <SettingsRow label="Use system motion preference" description="Automatically match your device's reduce-motion setting, on top of anything above." themeColor={theme.primary}>
            <SettingsToggle checked={prefs.useSystemMotion} onChange={(v) => update({ useSystemMotion: v })} themeColor={theme.primary} />
          </SettingsRow>
        </div>
        <p className="mt-4 text-xs text-slate-500">Changes apply immediately across the app and are saved to your account.</p>
      </SettingsSection>
    </div>
  );
}
