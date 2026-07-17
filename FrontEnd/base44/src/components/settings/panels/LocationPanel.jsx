import React, { useState, useEffect } from 'react';
import { MapPin, LocateFixed, Loader2 } from 'lucide-react';
import { profileApi } from '@/api/profileApi';
import { useLocation } from '@/hooks/useLocation.jsx';
import { DEFAULT_LOCATION_PREFS, RADIUS_OPTIONS } from '@/lib/settingsDefaults';
import { PanelHeader, SettingsSection, SettingsRow, SettingsToggle, SettingsSelect, InlineFeedback, SaveButton } from '../primitives';

export default function LocationPanel({ profile, user, theme, onProfileChange, onDirtyChange }) {
  const { selectedCity, setSelectedCity, cities } = useLocation();
  const initial = { ...DEFAULT_LOCATION_PREFS, ...profile?.locationPrefs };
  const [prefs, setPrefs] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [locating, setLocating] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('unknown');

  useEffect(() => {
    if (!navigator.permissions?.query) return;
    navigator.permissions.query({ name: 'geolocation' }).then((p) => setPermissionStatus(p.state)).catch(() => {});
  }, []);

  const dirty = JSON.stringify(prefs) !== JSON.stringify(initial);

  useEffect(() => {
    onDirtyChange?.(dirty ? { onSave: handleSave, onDiscard: () => setPrefs(initial), saving } : null);
    return () => onDirtyChange?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, saving]);

  const set = (key, value) => setPrefs((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await profileApi.updateLocationPrefs(user.uid, prefs);
      onProfileChange?.({ locationPrefs: prefs });
      setStatus({ type: 'success', message: 'Location settings saved.' });
    } catch {
      setStatus({ type: 'error', message: 'Could not save — please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatus({ type: 'error', message: 'Your browser does not support geolocation.' });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setPermissionStatus('granted');
        set('useCurrentLocation', true);
        setLocating(false);
        setStatus({ type: 'success', message: 'Location detected — remember to save.' });
      },
      () => {
        setPermissionStatus('denied');
        setLocating(false);
        setStatus({ type: 'error', message: 'Location permission was denied.' });
      },
    );
  };

  return (
    <div>
      <PanelHeader icon={MapPin} color="coral" title="Location" description="Control your location and nearby discovery settings." />

      <div className="space-y-5">
        <SettingsSection title="Home city">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <SettingsSelect
              value={selectedCity}
              onChange={setSelectedCity}
              options={cities.map((c) => ({ value: c, label: c }))}
              themeColor={theme.primary}
            />
            <span className="text-xs text-slate-500">Drives what's shown across Discover and Communities — changes apply immediately.</span>
          </div>
        </SettingsSection>

        <SettingsSection title="Suburb & precision">
          <div className="space-y-3">
            <SettingsRow label="Your suburb" description="Shown on your profile depending on your privacy setting — edit it from your profile editor." themeColor={theme.primary}>
              <span className="text-sm font-semibold text-slate-700">{profile?.city || 'Not set'}</span>
            </SettingsRow>
            <SettingsRow label="Show exact location on profile" description="Off by default. Approximate location shows your general area without displaying your exact suburb." themeColor={theme.primary}>
              <SettingsToggle checked={prefs.showExactLocationOnProfile} onChange={(v) => set('showExactLocationOnProfile', v)} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Use location for recommendations" description="Let nearby activities and events factor into your suggestions." themeColor={theme.primary}>
              <SettingsToggle checked={prefs.useLocationForRecommendations} onChange={(v) => set('useLocationForRecommendations', v)} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Remember recently searched areas" themeColor={theme.primary}>
              <SettingsToggle checked={prefs.rememberRecentAreas} onChange={(v) => set('rememberRecentAreas', v)} themeColor={theme.primary} />
            </SettingsRow>
          </div>
        </SettingsSection>

        <SettingsSection title="Search radius">
          <div className="flex flex-wrap gap-2">
            {RADIUS_OPTIONS.map((r) => {
              const selected = prefs.radiusKm === r;
              return (
                <button key={r ?? 'anywhere'} onClick={() => set('radiusKm', r)}
                  className="px-4 py-2 rounded-full text-sm font-bold border-2 transition-colors"
                  style={selected ? { borderColor: theme.primary, background: theme.soft, color: theme.text } : { borderColor: '#E2E8F0', color: '#475569' }}>
                  {r == null ? 'Anywhere' : `${r} km`}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-slate-500">Saved now, and used as radius-based discovery rolls out.</p>
        </SettingsSection>

        <SettingsSection title="Precise location">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-bold text-slate-800">Permission status</p>
              <p className="text-xs text-slate-500 mt-0.5 capitalize">{permissionStatus === 'unknown' ? 'Not yet requested' : permissionStatus}</p>
            </div>
            <button onClick={handleUseCurrentLocation} disabled={locating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              style={{ background: theme.primary }}>
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
              Use current location
            </button>
          </div>
        </SettingsSection>

        <div className="flex items-center justify-end gap-4">
          <InlineFeedback status={status} />
          <SaveButton onClick={handleSave} saving={saving} themeColor={theme.primary} />
        </div>
      </div>
    </div>
  );
}
