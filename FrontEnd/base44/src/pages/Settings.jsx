import React, { useState, useEffect } from 'react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseClient';
import { profileApi } from '@/api/profileApi';
import { useAuth } from '@/lib/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import {
  ArrowLeft, Bell, Shield, Lock, LogOut, Trash2, Loader2,
  CheckCircle2, AlertCircle, ExternalLink,
} from 'lucide-react';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [notificationPrefs, setNotificationPrefs] = useState({ email: true, push: true, communityUpdates: true });
  const [privacy, setPrivacy] = useState({ showEmail: false });
  const [savingPrefs, setSavingPrefs] = useState(false);

  const isPasswordUser = user?.providerData.some(p => p.providerId === 'password');
  const isGoogleOnly = !isPasswordUser && user?.providerData.some(p => p.providerId === 'google.com');

  useEffect(() => {
    if (!user) return;
    profileApi.get(user.uid).then((data) => {
      setProfile(data);
      if (data?.notificationPrefs) setNotificationPrefs(data.notificationPrefs);
      if (data?.privacy) setPrivacy(data.privacy);
    });
  }, [user]);

  const handleSaveNotifications = async () => {
    setSavingPrefs(true);
    try {
      await profileApi.updateNotificationPrefs(user.uid, notificationPrefs);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSavePrivacy = async () => {
    setSavingPrefs(true);
    try {
      await profileApi.updatePrivacy(user.uid, privacy);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-24 pb-16 max-w-2xl mx-auto px-4 sm:px-6">
        <Link to="/profile" className="flex items-center gap-1.5 text-sm text-charcoal/60 hover:text-charcoal mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to profile
        </Link>
        <h1 className="font-heading text-2xl font-bold text-charcoal mb-6">Settings</h1>

        <div className="space-y-6">
          {/* Profile settings */}
          <Section title="Profile" icon={CheckCircle2}>
            <p className="text-sm text-charcoal/60 mb-3">
              Display name, bio, city, photos and interests are edited from your profile page.
            </p>
            <Link to="/profile" className="text-sm font-medium text-ocean hover:text-teal transition-colors">
              Go to profile →
            </Link>
          </Section>

          {/* Notifications */}
          <Section title="Notifications" icon={Bell}>
            <div className="space-y-3">
              {[
                { key: 'email', label: 'Email notifications' },
                { key: 'push', label: 'Push notifications' },
                { key: 'communityUpdates', label: 'Community updates & announcements' },
              ].map(pref => (
                <label key={pref.key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!notificationPrefs[pref.key]}
                    onChange={e => setNotificationPrefs(p => ({ ...p, [pref.key]: e.target.checked }))}
                    className="w-4 h-4 rounded accent-ocean"
                  />
                  <span className="text-sm text-charcoal">{pref.label}</span>
                </label>
              ))}
            </div>
            <button onClick={handleSaveNotifications} disabled={savingPrefs}
              className="mt-4 px-4 py-2 bg-ocean/10 text-ocean text-sm font-semibold rounded-lg hover:bg-ocean/20 transition-colors disabled:opacity-60">
              {savingPrefs ? 'Saving...' : 'Save notification preferences'}
            </button>
          </Section>

          {/* Privacy */}
          <Section title="Privacy" icon={Shield}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!privacy.showEmail}
                onChange={e => setPrivacy(p => ({ ...p, showEmail: e.target.checked }))}
                className="w-4 h-4 rounded accent-ocean"
              />
              <span className="text-sm text-charcoal">Show my email on my public profile</span>
            </label>
            <button onClick={handleSavePrivacy} disabled={savingPrefs}
              className="mt-4 px-4 py-2 bg-ocean/10 text-ocean text-sm font-semibold rounded-lg hover:bg-ocean/20 transition-colors disabled:opacity-60">
              {savingPrefs ? 'Saving...' : 'Save privacy settings'}
            </button>
          </Section>

          {/* Safety */}
          <Section title="Safety" icon={AlertCircle}>
            <p className="text-sm text-charcoal/60 mb-3">
              Read our safety guidelines, and report or block anyone who makes you uncomfortable.
            </p>
            <Link to="/safety" className="flex items-center gap-1.5 text-sm font-medium text-ocean hover:text-teal transition-colors w-fit">
              Visit the Safety Centre <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </Section>

          {/* Password */}
          <Section title="Password" icon={Lock}>
            {isGoogleOnly ? (
              <p className="text-sm text-charcoal/60">
                Your password is managed by Google — sign in with Google to change it, there's nothing to change here.
              </p>
            ) : (
              <ChangePasswordForm user={user} />
            )}
          </Section>

          {/* Account */}
          <Section title="Account" icon={LogOut}>
            <button onClick={handleSignOut}
              className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 bg-sand text-charcoal text-sm font-semibold rounded-xl hover:bg-sand/80 transition-colors">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
            <DeleteAccountRequest user={user} profile={profile} navigate={navigate} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-sand">
      <h3 className="font-heading font-semibold text-charcoal text-sm mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-ocean" /> {title}
      </h3>
      {children}
    </div>
  );
}

function ChangePasswordForm({ user }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message }
  const [saving, setSaving] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (newPassword.length < 8) {
      setStatus({ type: 'error', message: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: "New passwords don't match." });
      return;
    }
    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setStatus({ type: 'success', message: 'Password changed successfully.' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setStatus({ type: 'error', message: 'Your current password is incorrect.' });
      } else if (err.code === 'auth/requires-recent-login') {
        setStatus({ type: 'error', message: 'Please sign out and sign in again before changing your password.' });
      } else if (err.code === 'auth/weak-password') {
        setStatus({ type: 'error', message: 'That new password is too weak.' });
      } else {
        setStatus({ type: 'error', message: 'Could not change your password — please try again.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetEmail = async () => {
    await sendPasswordResetEmail(auth, user.email);
    setResetSent(true);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="password" required placeholder="Current password" value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)} className={inputCls} autoComplete="current-password" />
        <input type="password" required placeholder="New password" value={newPassword}
          onChange={e => setNewPassword(e.target.value)} className={inputCls} autoComplete="new-password" />
        <input type="password" required placeholder="Confirm new password" value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)} className={inputCls} autoComplete="new-password" />
        {status && (
          <p className={`text-sm ${status.type === 'success' ? 'text-leaf' : 'text-coral'}`}>{status.message}</p>
        )}
        <button type="submit" disabled={saving}
          className="w-full py-2.5 bg-gradient-to-r from-ocean to-teal text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Change password
        </button>
      </form>
      <div className="pt-3 border-t border-sand">
        <button onClick={handleResetEmail} disabled={resetSent}
          className="text-sm font-medium text-ocean hover:text-teal transition-colors disabled:opacity-60">
          {resetSent ? 'Reset email sent — check your inbox' : 'Or send me a password reset email instead'}
        </button>
      </div>
    </div>
  );
}

function DeleteAccountRequest({ user, profile, navigate }) {
  const [confirming, setConfirming] = useState(false);
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
      <p className="text-sm text-charcoal/60">
        Your account deletion request has been recorded. It'll be processed manually — reach out if you need it expedited.
      </p>
    );
  }

  return confirming ? (
    <div className="space-y-2">
      <p className="text-sm text-coral">Are you sure? This flags your account for deletion — it can't be undone once processed.</p>
      <div className="flex gap-2">
        <button onClick={() => setConfirming(false)} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-charcoal">
          Cancel
        </button>
        <button onClick={handleRequest} disabled={saving}
          className="flex-1 py-2 rounded-lg bg-coral text-white text-sm font-semibold disabled:opacity-60">
          {saving ? 'Requesting...' : 'Confirm request'}
        </button>
      </div>
    </div>
  ) : (
    <button onClick={() => setConfirming(true)}
      className="w-full flex items-center justify-center gap-2 py-2.5 bg-coral/10 text-coral text-sm font-semibold rounded-xl hover:bg-coral/20 transition-colors">
      <Trash2 className="w-4 h-4" /> Request account deletion
    </button>
  );
}
