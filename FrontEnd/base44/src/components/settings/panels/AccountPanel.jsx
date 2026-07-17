import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CircleUserRound, Camera, ExternalLink } from 'lucide-react';
import { profileApi } from '@/api/profileApi';
import moment from 'moment';
import { PanelHeader, SettingsSection, InlineFeedback, SaveButton } from '../primitives';
import CameraCapture from '@/components/profile/CameraCapture';

const LANGUAGES = ['English', 'Afrikaans', 'isiXhosa', 'isiZulu', 'Sesotho', 'Setswana'];

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 transition-shadow";
const labelCls = "block text-[13px] font-bold text-slate-700 mb-1.5";
const helpCls = "mt-1.5 text-xs text-slate-500";

export default function AccountPanel({ profile, user, theme, onProfileChange, onDirtyChange }) {
  const initial = {
    displayName: profile?.displayName || '',
    username: profile?.username || '',
    phone: profile?.phone || '',
    dateOfBirth: profile?.dateOfBirth || '',
    preferredLanguage: profile?.preferredLanguage || 'English',
  };
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  useEffect(() => {
    onDirtyChange?.(dirty ? { onSave: handleSave, onDiscard: () => setForm(initial), saving } : null);
    return () => onDirtyChange?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, saving]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const { username, ...rest } = form;
      await profileApi.update(user.uid, rest);

      const newUsername = username.trim().toLowerCase();
      if (newUsername && newUsername !== (profile?.username || '')) {
        try {
          await profileApi.claimUsername(user.uid, newUsername, profile?.username);
        } catch {
          setStatus({ type: 'error', message: 'That username is already taken.' });
          setSaving(false);
          return;
        }
      }

      onProfileChange?.({ ...rest, username: newUsername || profile?.username || '' });
      setStatus({ type: 'success', message: 'Account details saved.' });
    } catch {
      setStatus({ type: 'error', message: 'Could not save — please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarCaptured = async (url) => {
    await profileApi.update(user.uid, { photoURL: url, photoVerified: true });
    onProfileChange?.({ photoURL: url, photoVerified: true });
    setCameraOpen(false);
  };

  const initials = (profile?.displayName || 'M').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const memberSince = profile?.createdAt
    ? moment(profile.createdAt.toDate ? profile.createdAt.toDate() : profile.createdAt).format('MMMM YYYY')
    : '—';

  return (
    <div>
      <PanelHeader icon={CircleUserRound} color="teal" title="Account" description="Manage your personal information and account details." />

      <div className="space-y-5">
        <SettingsSection title="Profile photo">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-ocean to-teal flex items-center justify-center shrink-0">
              {profile?.photoURL
                ? <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-2xl">{initials}</span>}
            </div>
            <div>
              <button onClick={() => setCameraOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors"
                style={{ background: theme.primary }}>
                <Camera className="w-4 h-4" /> Change photo
              </button>
              <p className={helpCls}>Shown across your profile, chats and communities.</p>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Personal information">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Full name</label>
              <input className={inputCls} style={{ '--tw-ring-color': theme.primary }} value={form.displayName} onChange={set('displayName')} />
            </div>
            <div>
              <label className={labelCls}>Username</label>
              <input className={inputCls} style={{ '--tw-ring-color': theme.primary }} value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))} />
              <p className={helpCls}>Used in your profile link — lowercase letters, numbers, underscores.</p>
            </div>
            <div>
              <label className={labelCls}>Email address</label>
              <input className={`${inputCls} bg-slate-50 text-slate-500`} value={user?.email || ''} disabled />
              <p className={helpCls}>Managed by your sign-in provider — contact support to change it.</p>
            </div>
            <div>
              <label className={labelCls}>Phone number</label>
              <input className={inputCls} style={{ '--tw-ring-color': theme.primary }} value={form.phone} onChange={set('phone')} placeholder="Not added" />
            </div>
            <div>
              <label className={labelCls}>Date of birth</label>
              <input type="date" className={inputCls} style={{ '--tw-ring-color': theme.primary }} value={form.dateOfBirth} onChange={set('dateOfBirth')} />
            </div>
            <div>
              <label className={labelCls}>Preferred language</label>
              <select className={inputCls} style={{ '--tw-ring-color': theme.primary }} value={form.preferredLanguage} onChange={set('preferredLanguage')}>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 mt-5 pt-5 border-t border-slate-100 flex-wrap">
            <p className="text-sm text-slate-500">Member since <span className="font-bold text-slate-700">{memberSince}</span></p>
            <div className="flex items-center gap-4">
              <InlineFeedback status={status} />
              <SaveButton onClick={handleSave} saving={saving} themeColor={theme.primary} />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-bold text-sm text-slate-900">Bio, interests, cover photo & social links</p>
              <p className="text-xs text-slate-500 mt-1">These live on your public profile editor, not here.</p>
            </div>
            <Link to="/profile?edit=1" className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: theme.primary }}>
              Edit public profile <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </SettingsSection>
      </div>

      {cameraOpen && (
        <CameraCapture folder={`users/${user.uid}`} onCaptured={handleAvatarCaptured} onClose={() => setCameraOpen(false)} />
      )}
    </div>
  );
}
