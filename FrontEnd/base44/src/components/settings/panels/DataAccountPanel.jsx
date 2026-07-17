import React, { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { HardDriveDownload, Download, Trash2, LogOut, History, MapPinOff } from 'lucide-react';
import { profileApi } from '@/api/profileApi';
import { useLocation } from '@/hooks/useLocation.jsx';
import { useAuth } from '@/lib/AuthContext';
import { PanelHeader, SettingsSection, SettingsRow, DangerZone } from '../primitives';

export default function DataAccountPanel({ profile, user, theme }) {
  const { logout } = useAuth();
  const { setSelectedCity } = useLocation();
  const [exportRequested, setExportRequested] = useState(!!profile?.dataExportRequested);
  const [exporting, setExporting] = useState(false);
  const [locationCleared, setLocationCleared] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await profileApi.requestDataExport(user.uid);
      setExportRequested(true);
    } finally {
      setExporting(false);
    }
  };

  const handleClearLocationHistory = () => {
    setSelectedCity('Stellenbosch');
    setLocationCleared(true);
  };

  return (
    <div>
      <PanelHeader icon={HardDriveDownload} color="red" title="Data and account" description="Download your data or manage account removal." />

      <div className="space-y-5">
        <SettingsSection title="Download your data">
          <p className="text-sm text-slate-500 mb-4">
            Requests are reviewed and processed manually — you'll be emailed a copy rather than getting an instant download.
          </p>
          <div className="space-y-3">
            {['My profile data', 'Saved places', 'Event history', 'Community activity'].map((label) => (
              <SettingsRow key={label} label={label} themeColor={theme.primary}>
                <button onClick={handleExport} disabled={exporting || exportRequested}
                  className="inline-flex items-center gap-1.5 text-xs font-bold disabled:opacity-60" style={{ color: theme.primary }}>
                  <Download className="w-3.5 h-3.5" /> {exportRequested ? 'Requested' : 'Request export'}
                </button>
              </SettingsRow>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection title="Clear local history">
          <div className="space-y-3">
            <SettingsRow label="Clear search history" description="LekkerVibes doesn't keep a search history in this deployment yet — nothing to clear." themeColor={theme.primary}>
              <History className="w-4 h-4 text-slate-300" />
            </SettingsRow>
            <SettingsRow label="Clear location history" description="Resets your remembered city back to the default." themeColor={theme.primary}>
              <button onClick={handleClearLocationHistory} disabled={locationCleared}
                className="inline-flex items-center gap-1.5 text-xs font-bold disabled:opacity-60" style={{ color: theme.primary }}>
                <MapPinOff className="w-3.5 h-3.5" /> {locationCleared ? 'Cleared' : 'Clear'}
              </button>
            </SettingsRow>
          </div>
        </SettingsSection>

        <SettingsSection title="Account">
          <button onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </SettingsSection>

        <DangerZone>
          <DeactivateRow theme={theme} />
          <DeleteAccountRequest user={user} profile={profile} />
        </DangerZone>
      </div>
    </div>
  );
}

function DeactivateRow({ theme }) {
  return (
    <SettingsRow label="Deactivate account" description="Temporarily hide your profile without deleting anything — isn't live in this deployment yet." themeColor="#DC2626">
      <span className="text-xs font-bold text-red-400">Coming soon</span>
    </SettingsRow>
  );
}

function DeleteAccountRequest({ user, profile }) {
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [requested, setRequested] = useState(!!profile?.accountDeletionRequested);
  const [saving, setSaving] = useState(false);

  const handleRequest = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        accountDeletionRequested: true,
        accountDeletionRequestedAt: serverTimestamp(),
      });
      setRequested(true);
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  };

  if (requested) {
    return (
      <p className="text-sm text-red-700/80 bg-white/60 rounded-xl p-3">
        Your account deletion request has been recorded. It'll be processed manually — reach out if you need it expedited.
      </p>
    );
  }

  return confirming ? (
    <div className="space-y-3 bg-white/60 rounded-xl p-3">
      <p className="text-sm font-semibold text-red-700">This can't be undone once processed. Type DELETE to confirm.</p>
      <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type DELETE"
        className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
      <div className="flex gap-2">
        <button onClick={() => { setConfirming(false); setConfirmText(''); }} className="flex-1 py-2 rounded-lg border border-red-200 text-sm font-bold text-red-700">
          Cancel
        </button>
        <button onClick={handleRequest} disabled={saving || confirmText !== 'DELETE'}
          className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-bold disabled:opacity-50">
          {saving ? 'Requesting...' : 'Confirm deletion request'}
        </button>
      </div>
    </div>
  ) : (
    <button onClick={() => setConfirming(true)}
      className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-red-700 border-2 border-red-200 text-sm font-bold rounded-xl hover:bg-red-50 transition-colors">
      <Trash2 className="w-4 h-4" /> Request account deletion
    </button>
  );
}
