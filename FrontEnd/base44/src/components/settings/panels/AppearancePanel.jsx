import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Palette, Camera, Loader2, X, Check } from 'lucide-react';
import { profileApi } from '@/api/profileApi';
import { uploadsApi } from '@/api/uploadsApi';
import { getProfileTheme, colorForLabel } from '@/lib/profileThemes';
import { PanelHeader, SettingsSection, InlineFeedback } from '../primitives';
import ThemeSelector from '../ThemeSelector';

const CHIP_STYLES = [
  { key: 'vibrant', label: 'Vibrant', description: 'Coloured background, soft border, gentle float.' },
  { key: 'minimal', label: 'Minimal', description: 'White background, coloured outline, no motion.' },
];

const PREVIEW_INTERESTS = ['Hiking', 'Board games', 'Live music'];

export default function AppearancePanel({ profile, user, theme, reduceMotion, onProfileChange }) {
  const [previewTheme, setPreviewTheme] = useState(profile?.profileTheme || 'teal');
  const [chipStyle, setChipStyle] = useState(profile?.chipStyle || 'vibrant');
  const [coverUploading, setCoverUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const coverInputRef = useRef(null);
  const liveTheme = getProfileTheme(previewTheme);

  const handleThemeSelect = async (key) => {
    setPreviewTheme(key);
    try {
      await profileApi.update(user.uid, { profileTheme: key });
      onProfileChange?.({ profileTheme: key });
      setStatus({ type: 'success', message: 'Profile theme updated.' });
    } catch {
      setStatus({ type: 'error', message: 'Could not save theme — please try again.' });
    }
  };

  const handleChipStyle = async (key) => {
    setChipStyle(key);
    try {
      await profileApi.update(user.uid, { chipStyle: key });
      onProfileChange?.({ chipStyle: key });
    } catch {
      setStatus({ type: 'error', message: 'Could not save chip style — please try again.' });
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const url = await uploadsApi.upload(file, `users/${user.uid}`);
      await profileApi.update(user.uid, { coverURL: url });
      onProfileChange?.({ coverURL: url });
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleRemoveCover = async () => {
    await profileApi.update(user.uid, { coverURL: null });
    onProfileChange?.({ coverURL: null });
  };

  return (
    <div>
      <PanelHeader icon={Palette} color="coral" title="Profile appearance" description="Choose how your profile looks and feels." />

      <div className="space-y-5">
        <SettingsSection title="Cover photo">
          <div className="relative h-36 rounded-2xl overflow-hidden bg-gradient-to-br from-ocean via-teal to-sky">
            {profile?.coverURL && <img src={profile.coverURL} alt="Cover" className="w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button onClick={() => coverInputRef.current?.click()} disabled={coverUploading}
                className="flex items-center gap-2 px-3 py-2 bg-charcoal/70 backdrop-blur text-white rounded-xl text-xs font-bold hover:bg-charcoal/90 transition-colors disabled:opacity-60">
                {coverUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                {profile?.coverURL ? 'Reposition / replace' : 'Upload cover'}
              </button>
              {profile?.coverURL && (
                <button onClick={handleRemoveCover} className="p-2 bg-charcoal/70 backdrop-blur text-white rounded-xl hover:bg-charcoal/90 transition-colors" aria-label="Remove cover photo">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverUpload} className="hidden" />
          </div>
          <p className="mt-2 text-xs text-slate-500">Recommended 1600×500px. Re-uploading lets you crop a new position.</p>
        </SettingsSection>

        <SettingsSection title="Profile accent colour">
          <ThemeSelector value={previewTheme} onChange={handleThemeSelect} reduceMotion={reduceMotion} />
          <InlineFeedback status={status} />
        </SettingsSection>

        <SettingsSection title="Interest-chip style">
          <div className="grid sm:grid-cols-2 gap-3">
            {CHIP_STYLES.map((s) => {
              const selected = chipStyle === s.key;
              return (
                <button key={s.key} onClick={() => handleChipStyle(s.key)}
                  className="relative text-left rounded-2xl border-2 p-4 transition-colors"
                  style={{ borderColor: selected ? liveTheme.primary : '#E2E8F0', background: selected ? liveTheme.soft : '#fff' }}>
                  {selected && (
                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: liveTheme.primary }}>
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  <p className="font-bold text-sm text-slate-900 pr-6">{s.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{s.description}</p>
                </button>
              );
            })}
          </div>
        </SettingsSection>

        <SettingsSection title="Live preview">
          <div className="rounded-2xl border border-slate-200 p-5 bg-cream">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: liveTheme.primary }}>
                {(profile?.displayName || 'M')[0].toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-charcoal">{profile?.displayName || 'Member'}</p>
                <p className="text-xs" style={{ color: liveTheme.primary }}>Profile tabs & accents preview</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {PREVIEW_INTERESTS.map((label, i) => {
                const c = colorForLabel(label);
                const minimal = chipStyle === 'minimal';
                return (
                  <motion.span
                    key={label}
                    animate={reduceMotion || minimal ? {} : { y: [0, -3, 0] }}
                    transition={{ y: { duration: 2.5 + (i % 3) * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 } }}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={minimal
                      ? { background: '#fff', color: c.text, border: `1.5px solid ${c.border}` }
                      : { background: c.soft, color: c.text, border: `1px solid ${c.border}` }}
                  >
                    {label}
                  </motion.span>
                );
              })}
            </div>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
