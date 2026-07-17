import React, { useState } from 'react';
import {
  EmailAuthProvider, reauthenticateWithCredential, updatePassword,
  sendPasswordResetEmail, sendEmailVerification,
} from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import { LockKeyhole, Loader2, Mail } from 'lucide-react';
import { PanelHeader, SettingsSection, SettingsRow, StatusBadge, InlineFeedback } from '../primitives';

export default function SecurityPanel({ user, theme }) {
  const isPasswordUser = user?.providerData.some((p) => p.providerId === 'password');
  const isGoogleLinked = user?.providerData.some((p) => p.providerId === 'google.com');

  return (
    <div>
      <PanelHeader icon={LockKeyhole} color="slate" title="Security" description="Protect your account and active sessions." />

      <div className="space-y-5">
        <SettingsSection title="Password">
          {!isPasswordUser ? (
            <p className="text-sm text-slate-500">Your password is managed by Google — sign in with Google to change it, there's nothing to change here.</p>
          ) : (
            <ChangePasswordForm user={user} theme={theme} />
          )}
        </SettingsSection>

        <SettingsSection title="Email verification">
          <EmailVerificationRow user={user} theme={theme} />
        </SettingsSection>

        <SettingsSection title="Two-factor authentication">
          <SettingsRow label="Phone-based 2FA" description="An extra verification step at sign-in — not live in this deployment yet." themeColor={theme.primary}>
            <StatusBadge status="disabled" />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Active sessions">
          <SettingsRow label="This device" description={navigator.userAgent.slice(0, 60)} themeColor={theme.primary}>
            <StatusBadge status="current" />
          </SettingsRow>
          <p className="mt-3 text-xs text-slate-500">Viewing and signing out of other devices individually isn't available yet — use "Sign out" in Data and account to end this session.</p>
        </SettingsSection>

        <SettingsSection title="Login history & alerts">
          <p className="text-sm text-slate-500">A detailed login history and alerting for new sign-ins isn't live yet — we're still building it out.</p>
        </SettingsSection>

        <SettingsSection title="Connected accounts">
          <div className="space-y-3">
            <SettingsRow label="Google" description="Sign in with your Google account." themeColor={theme.primary}>
              <StatusBadge status={isGoogleLinked ? 'enabled' : 'disabled'} />
            </SettingsRow>
            <SettingsRow label="Email & password" themeColor={theme.primary}>
              <StatusBadge status={isPasswordUser ? 'enabled' : 'disabled'} />
            </SettingsRow>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

function EmailVerificationRow({ user, theme }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      await sendEmailVerification(user);
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <SettingsRow label={user?.email} description="Verifying your email helps secure your account and password resets." themeColor={theme.primary}>
      <div className="flex items-center gap-3">
        <StatusBadge status={user?.emailVerified ? 'verified' : 'unverified'} />
        {!user?.emailVerified && (
          <button onClick={handleSend} disabled={sending || sent}
            className="inline-flex items-center gap-1.5 text-xs font-bold disabled:opacity-60" style={{ color: theme.primary }}>
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            {sent ? 'Sent!' : 'Send verification email'}
          </button>
        )}
      </div>
    </SettingsRow>
  );
}

function ChangePasswordForm({ user, theme }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 transition-shadow";

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
          onChange={(e) => setCurrentPassword(e.target.value)} className={inputCls} autoComplete="current-password" style={{ '--tw-ring-color': theme.primary }} />
        <input type="password" required placeholder="New password" value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)} className={inputCls} autoComplete="new-password" style={{ '--tw-ring-color': theme.primary }} />
        <input type="password" required placeholder="Confirm new password" value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)} className={inputCls} autoComplete="new-password" style={{ '--tw-ring-color': theme.primary }} />
        <InlineFeedback status={status} />
        <button type="submit" disabled={saving}
          className="w-full py-2.5 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: theme.primary }}>
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Change password
        </button>
      </form>
      <div className="pt-3 border-t border-slate-100">
        <button onClick={handleResetEmail} disabled={resetSent}
          className="text-sm font-bold disabled:opacity-60" style={{ color: theme.primary }}>
          {resetSent ? 'Reset email sent — check your inbox' : 'Or send me a password reset email instead'}
        </button>
      </div>
    </div>
  );
}
