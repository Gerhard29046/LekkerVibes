import React, { useState, useEffect } from 'react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseClient';
import { profileApi, DEFAULT_PRIVACY } from '@/api/profileApi';
import { followApi } from '@/api/followApi';
import { socialLinksApi } from '@/api/socialLinksApi';
import { useAuth } from '@/lib/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import {
  ArrowLeft, Bell, Shield, Lock, LogOut, Trash2, Loader2, UserMinus, UserX,
  CheckCircle2, AlertCircle, ExternalLink, Check, X as XIcon, Users,
} from 'lucide-react';

const AUDIENCE_OPTIONS = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'followers', label: 'Approved followers' },
  { value: 'private', label: 'Only me' },
];

const PRIVACY_FIELDS = [
  { key: 'cityVisibility', label: 'General city' },
  { key: 'communitiesVisibility', label: 'Communities joined' },
  { key: 'eventsVisibility', label: 'Events joined' },
  { key: 'eventsOrganisedVisibility', label: 'Events organised' },
  { key: 'savedVisibility', label: 'Saved places' },
  { key: 'visitedVisibility', label: 'Places visited' },
  { key: 'activityVisibility', label: 'Recent activity' },
  { key: 'photosVisibility', label: 'Photos' },
  { key: 'followersVisibility', label: 'Follower list' },
  { key: 'followingVisibility', label: 'Following list' },
  { key: 'workVisibility', label: 'Work' },
  { key: 'educationVisibility', label: 'Education' },
  { key: 'languagesVisibility', label: 'Languages' },
];

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [notificationPrefs, setNotificationPrefs] = useState({ email: true, push: true, communityUpdates: true });
  const [privacy, setPrivacy] = useState(DEFAULT_PRIVACY);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  const isPasswordUser = user?.providerData.some(p => p.providerId === 'password');
  const isGoogleOnly = !isPasswordUser && user?.providerData.some(p => p.providerId === 'google.com');

  useEffect(() => {
    if (!user) return;
    profileApi.get(user.uid).then((data) => {
      setProfile(data);
      if (data?.notificationPrefs) setNotificationPrefs(data.notificationPrefs);
      if (data?.privacy) setPrivacy({ ...DEFAULT_PRIVACY, ...data.privacy });
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
    setSavingPrivacy(true);
    try {
      await profileApi.updatePrivacy(user.uid, privacy);
    } finally {
      setSavingPrivacy(false);
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
          <Section title="Profile" icon={CheckCircle2}>
            <p className="text-sm text-charcoal/60 mb-3">
              Display name, bio, city, photos, social links and interests are edited from your profile page.
            </p>
            <Link to="/profile" className="text-sm font-medium text-ocean hover:text-teal transition-colors">
              Go to profile →
            </Link>
          </Section>

          <FollowRequestsSection user={user} />

          <SocialRevealSection user={user} />

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

          <Section title="Privacy" icon={Shield}>
            <div className="space-y-3">
              {PRIVACY_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-charcoal">{field.label}</span>
                  <select
                    value={privacy[field.key] || 'everyone'}
                    onChange={(e) => setPrivacy((p) => ({ ...p, [field.key]: e.target.value }))}
                    className="px-3 py-1.5 rounded-lg border border-border bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ocean/30"
                  >
                    {AUDIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}
              <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-sand">
                <input type="checkbox" checked={privacy.activityFeedEnabled !== false}
                  onChange={(e) => setPrivacy((p) => ({ ...p, activityFeedEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded accent-ocean" />
                <span className="text-sm text-charcoal">Record my recent activity at all</span>
              </label>
            </div>
            <button onClick={handleSavePrivacy} disabled={savingPrivacy}
              className="mt-4 px-4 py-2 bg-ocean/10 text-ocean text-sm font-semibold rounded-lg hover:bg-ocean/20 transition-colors disabled:opacity-60">
              {savingPrivacy ? 'Saving...' : 'Save privacy settings'}
            </button>
          </Section>

          <Section title="Safety" icon={AlertCircle}>
            <p className="text-sm text-charcoal/60 mb-3">
              Read our safety guidelines, and report or block anyone who makes you uncomfortable from their profile.
            </p>
            <Link to="/safety" className="flex items-center gap-1.5 text-sm font-medium text-ocean hover:text-teal transition-colors w-fit">
              Visit the Safety Centre <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </Section>

          <Section title="Password" icon={Lock}>
            {isGoogleOnly ? (
              <p className="text-sm text-charcoal/60">
                Your password is managed by Google — sign in with Google to change it, there's nothing to change here.
              </p>
            ) : (
              <ChangePasswordForm user={user} />
            )}
          </Section>

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

function FollowRequestsSection({ user }) {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    const [inc, out, fol, fing] = await Promise.all([
      followApi.listIncomingRequests(user.uid),
      followApi.listOutgoingRequests(user.uid),
      followApi.listFollowers(user.uid),
      followApi.listFollowing(user.uid),
    ]);
    setIncoming(inc);
    setOutgoing(out);
    setFollowers(fol);
    setFollowing(fing);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user.uid]);

  const withBusy = (id, fn) => async () => {
    setBusyId(id);
    try { await fn(); await load(); } finally { setBusyId(null); }
  };

  if (loading) return <Section title="Follow requests" icon={Users}><Loader2 className="w-4 h-4 animate-spin text-charcoal/40" /></Section>;

  return (
    <Section title="Follow requests & connections" icon={Users}>
      <div className="space-y-5">
        <div>
          <h4 className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-2">Requests received ({incoming.length})</h4>
          {incoming.length === 0 && <p className="text-sm text-charcoal/40">None right now.</p>}
          {incoming.map((r) => (
            <div key={r.fromUid} className="flex items-center justify-between py-1.5">
              <Link to={`/u/${r.fromUid}`} className="text-sm text-charcoal hover:text-ocean transition-colors">{r.fromUid}</Link>
              <div className="flex gap-1.5">
                <button disabled={busyId === r.fromUid} onClick={withBusy(r.fromUid, () => followApi.acceptRequest(`${r.fromUid}_${user.uid}`))}
                  className="p-1.5 bg-teal/10 text-teal rounded-lg hover:bg-teal/20 transition-colors disabled:opacity-50"><Check className="w-3.5 h-3.5" /></button>
                <button disabled={busyId === r.fromUid} onClick={withBusy(r.fromUid, () => followApi.declineRequest(r.fromUid, user.uid))}
                  className="p-1.5 bg-coral/10 text-coral rounded-lg hover:bg-coral/20 transition-colors disabled:opacity-50"><XIcon className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h4 className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-2">Requests sent ({outgoing.length})</h4>
          {outgoing.length === 0 && <p className="text-sm text-charcoal/40">None right now.</p>}
          {outgoing.map((r) => (
            <div key={r.toUid} className="flex items-center justify-between py-1.5">
              <Link to={`/u/${r.toUid}`} className="text-sm text-charcoal hover:text-ocean transition-colors">{r.toUid}</Link>
              <button disabled={busyId === r.toUid} onClick={withBusy(r.toUid, () => followApi.cancelRequest(user.uid, r.toUid))}
                className="text-xs font-medium text-charcoal/50 hover:text-coral transition-colors disabled:opacity-50">Cancel</button>
            </div>
          ))}
        </div>

        <div>
          <h4 className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-2">Followers ({followers.length})</h4>
          {followers.length === 0 && <p className="text-sm text-charcoal/40">No followers yet.</p>}
          {followers.map((f) => (
            <div key={f.uid} className="flex items-center justify-between py-1.5">
              <Link to={`/u/${f.uid}`} className="text-sm text-charcoal hover:text-ocean transition-colors">{f.uid}</Link>
              <button disabled={busyId === f.uid} onClick={withBusy(f.uid, () => followApi.removeFollower(user.uid, f.uid))}
                className="flex items-center gap-1 text-xs font-medium text-charcoal/50 hover:text-coral transition-colors disabled:opacity-50">
                <UserMinus className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          ))}
        </div>

        <div>
          <h4 className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-2">Following ({following.length})</h4>
          {following.length === 0 && <p className="text-sm text-charcoal/40">Not following anyone yet.</p>}
          {following.map((f) => (
            <div key={f.uid} className="flex items-center justify-between py-1.5">
              <Link to={`/u/${f.uid}`} className="text-sm text-charcoal hover:text-ocean transition-colors">{f.uid}</Link>
              <button disabled={busyId === f.uid} onClick={withBusy(f.uid, () => followApi.unfollow(user.uid, f.uid))}
                className="flex items-center gap-1 text-xs font-medium text-charcoal/50 hover:text-coral transition-colors disabled:opacity-50">
                <UserX className="w-3.5 h-3.5" /> Unfollow
              </button>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function SocialRevealSection({ user }) {
  const [requests, setRequests] = useState([]);
  const [approving, setApproving] = useState(null); // requestId being edited
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    const snap = await getDocs(query(
      collection(db, 'socialRevealRequests'),
      where('ownerUid', '==', user.uid),
      where('status', '==', 'pending'),
    ));
    setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user.uid]);

  const startApproving = (req) => {
    setApproving(req.id);
    setSelectedPlatforms(req.requestedPlatforms || []);
  };

  const togglePlatform = (p) => {
    setSelectedPlatforms((cur) => cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]);
  };

  const confirmApprove = async () => {
    setBusyId(approving);
    try {
      await socialLinksApi.acceptReveal(approving, selectedPlatforms);
      setApproving(null);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const decline = async (req) => {
    setBusyId(req.id);
    try {
      await socialLinksApi.declineReveal(req.requesterUid, req.ownerUid);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Section title="Social-link requests" icon={Lock}><Loader2 className="w-4 h-4 animate-spin text-charcoal/40" /></Section>;

  return (
    <Section title="Social-link requests" icon={Lock}>
      {requests.length === 0 && <p className="text-sm text-charcoal/40">No pending requests.</p>}
      <div className="space-y-3">
        {requests.map((req) => (
          <div key={req.id} className="border border-sand rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <Link to={`/u/${req.requesterUid}`} className="text-sm font-medium text-charcoal hover:text-ocean transition-colors">{req.requesterUid}</Link>
              {approving !== req.id && (
                <div className="flex gap-1.5">
                  <button onClick={() => startApproving(req)} className="px-2.5 py-1 bg-teal/10 text-teal rounded-lg text-xs font-medium hover:bg-teal/20 transition-colors">Approve</button>
                  <button disabled={busyId === req.id} onClick={() => decline(req)} className="px-2.5 py-1 bg-coral/10 text-coral rounded-lg text-xs font-medium hover:bg-coral/20 transition-colors disabled:opacity-50">Decline</button>
                </div>
              )}
            </div>
            {approving === req.id && (
              <div className="space-y-2">
                {(req.requestedPlatforms || []).map((p) => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedPlatforms.includes(p)} onChange={() => togglePlatform(p)} className="w-4 h-4 rounded accent-ocean" />
                    <span className="text-sm text-charcoal capitalize">{p}</span>
                  </label>
                ))}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setApproving(null)} className="flex-1 py-1.5 rounded-lg border border-border text-xs font-medium text-charcoal">Cancel</button>
                  <button onClick={confirmApprove} disabled={busyId === req.id || selectedPlatforms.length === 0}
                    className="flex-1 py-1.5 rounded-lg bg-ocean text-white text-xs font-semibold disabled:opacity-50">
                    {busyId === req.id ? 'Approving...' : 'Confirm approval'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

function ChangePasswordForm({ user }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState(null);
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
