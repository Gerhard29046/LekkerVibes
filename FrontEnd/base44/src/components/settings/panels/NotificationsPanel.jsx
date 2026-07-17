import React, { useState, useEffect } from 'react';
import { Bell, BellOff, RotateCcw, CheckCheck } from 'lucide-react';
import { profileApi } from '@/api/profileApi';
import { DEFAULT_NOTIFICATION_PREFS, NOTIFICATION_GROUPS } from '@/lib/settingsDefaults';
import { PanelHeader, SettingsSection, SettingsToggle, InlineFeedback, SaveButton, SECTION_COLORS } from '../primitives';

function mergePrefs(existing) {
  const base = { channels: { ...DEFAULT_NOTIFICATION_PREFS.channels }, paused: false };
  if (!existing) return base;
  return {
    channels: { ...base.channels, ...(existing.channels || {}) },
    paused: !!existing.paused,
  };
}

const CHANNEL_KEYS = ['inApp', 'push', 'email'];
const CHANNEL_LABELS = { inApp: 'In-app', push: 'Push', email: 'Email' };

export default function NotificationsPanel({ profile, user, theme, onProfileChange, onDirtyChange }) {
  const initial = mergePrefs(profile?.notificationPrefs);
  const [prefs, setPrefs] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const dirty = JSON.stringify(prefs) !== JSON.stringify(initial);

  useEffect(() => {
    onDirtyChange?.(dirty ? { onSave: handleSave, onDiscard: () => setPrefs(initial), saving } : null);
    return () => onDirtyChange?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, saving]);

  const toggle = (key, channel) => {
    setPrefs((p) => ({
      ...p,
      channels: { ...p.channels, [key]: { ...p.channels[key], [channel]: !p.channels[key]?.[channel] } },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await profileApi.updateNotificationPrefs(user.uid, prefs);
      onProfileChange?.({ notificationPrefs: prefs });
      setStatus({ type: 'success', message: 'Notification preferences saved.' });
    } catch {
      setStatus({ type: 'error', message: 'Could not save — please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const enableAll = () => {
    const channels = {};
    Object.keys(prefs.channels).forEach((k) => { channels[k] = { inApp: true, push: true, email: true }; });
    setPrefs({ channels, paused: false });
  };

  const resetDefaults = () => setPrefs(mergePrefs(null));

  const togglePause = () => setPrefs((p) => ({ ...p, paused: !p.paused }));

  return (
    <div>
      <PanelHeader icon={Bell} color="amber" title="Notifications" description="Choose what LekkerVibes should notify you about." />

      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={enableAll} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors">
          <CheckCheck className="w-3.5 h-3.5" /> Enable all
        </button>
        <button onClick={togglePause} className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${prefs.paused ? 'bg-coral/10 text-coral' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          <BellOff className="w-3.5 h-3.5" /> {prefs.paused ? 'Notifications paused' : 'Pause notifications'}
        </button>
        <button onClick={resetDefaults} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
          <RotateCcw className="w-3.5 h-3.5" /> Reset to recommended
        </button>
      </div>

      <div className={`space-y-5 transition-opacity ${prefs.paused ? 'opacity-50 pointer-events-none' : ''}`}>
        {NOTIFICATION_GROUPS.map((group) => {
          const c = SECTION_COLORS[group.color];
          return (
            <SettingsSection key={group.id}>
              <div className="flex items-center gap-2.5 mb-4">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.bg} ${c.text}`}>
                  <Bell className="w-4 h-4" />
                </span>
                <h2 className="font-body text-base font-bold text-slate-900">{group.label}</h2>
              </div>

              {/* Desktop: table-like grid */}
              <div className="hidden sm:block">
                <div className="grid grid-cols-[1fr_repeat(3,72px)] gap-2 items-center pb-2 mb-1 border-b border-slate-100">
                  <span />
                  {CHANNEL_KEYS.map((ch) => <span key={ch} className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wide">{CHANNEL_LABELS[ch]}</span>)}
                </div>
                {group.items.map((item) => (
                  <div key={item.key} className="grid grid-cols-[1fr_repeat(3,72px)] gap-2 items-center py-2.5 border-b border-slate-50 last:border-0">
                    <div className="min-w-0 pr-3">
                      <p className="text-sm font-bold text-slate-800">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                    {CHANNEL_KEYS.map((ch) => (
                      <div key={ch} className="flex justify-center">
                        <SettingsToggle checked={!!prefs.channels[item.key]?.[ch]} onChange={() => toggle(item.key, ch)} themeColor={theme.primary} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Mobile: stacked */}
              <div className="sm:hidden space-y-4">
                {group.items.map((item) => (
                  <div key={item.key} className="rounded-xl border border-slate-100 p-3">
                    <p className="text-sm font-bold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-500 mb-2">{item.description}</p>
                    <div className="flex items-center gap-4">
                      {CHANNEL_KEYS.map((ch) => (
                        <div key={ch} className="flex items-center gap-1.5">
                          <SettingsToggle checked={!!prefs.channels[item.key]?.[ch]} onChange={() => toggle(item.key, ch)} themeColor={theme.primary} />
                          <span className="text-[11px] font-semibold text-slate-500">{CHANNEL_LABELS[ch]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SettingsSection>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-4 mt-5">
        <InlineFeedback status={status} />
        <SaveButton onClick={handleSave} saving={saving} themeColor={theme.primary} />
      </div>
    </div>
  );
}
