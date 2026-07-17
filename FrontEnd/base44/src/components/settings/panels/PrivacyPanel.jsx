import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Loader2, ExternalLink, Check, X as XIcon, UserMinus, UserX, Users,
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { profileApi, DEFAULT_PRIVACY } from '@/api/profileApi';
import { followApi } from '@/api/followApi';
import { socialLinksApi } from '@/api/socialLinksApi';
import { blocksApi } from '@/api/blocksApi';
import { FEATURES } from '@/lib/featureFlags';
import {
  PanelHeader, SettingsSection, SettingsRow, SettingsToggle, SettingsSelect,
  SettingsRadioCard, InlineFeedback, SaveButton,
} from '../primitives';

const AUDIENCE_OPTIONS = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'followers', label: 'Approved followers' },
  { value: 'private', label: 'Only me' },
];

const PRIVACY_FIELDS = [
  { key: 'cityVisibility', label: 'General city', description: 'Approximate location shows your general area without displaying your exact suburb.' },
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

export default function PrivacyPanel({ profile, user, theme, onProfileChange, onDirtyChange }) {
  const initial = { ...DEFAULT_PRIVACY, ...profile?.privacy };
  const [privacy, setPrivacy] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const dirty = JSON.stringify(privacy) !== JSON.stringify(initial);

  useEffect(() => {
    onDirtyChange?.(dirty ? { onSave: handleSave, onDiscard: () => setPrivacy(initial), saving } : null);
    return () => onDirtyChange?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, saving]);

  const setField = (key, value) => setPrivacy((p) => ({ ...p, [key]: value }));

  const applyProfileVisibility = (value) => {
    setPrivacy((p) => ({
      ...p,
      profileVisibility: value,
      communitiesVisibility: value, eventsVisibility: value, activityVisibility: value,
      photosVisibility: value, followersVisibility: value, followingVisibility: value,
      savedVisibility: value === 'everyone' ? 'followers' : value,
      visitedVisibility: value === 'everyone' ? 'followers' : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await profileApi.updatePrivacy(user.uid, privacy);
      onProfileChange?.({ privacy });
      setStatus({ type: 'success', message: 'Privacy settings saved.' });
    } catch {
      setStatus({ type: 'error', message: 'Could not save — please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PanelHeader icon={ShieldCheck} color="green" title="Privacy and safety" description="Control who can find, follow and interact with you." />

      <div className="space-y-5">
        <SettingsSection title="Profile visibility">
          <div className="grid sm:grid-cols-3 gap-3">
            <SettingsRadioCard selected={privacy.profileVisibility === 'everyone'} onClick={() => applyProfileVisibility('everyone')}
              title="Public" description="Anyone on LekkerVibes can view your profile." themeColor={theme.primary} />
            <SettingsRadioCard selected={privacy.profileVisibility === 'followers'} onClick={() => applyProfileVisibility('followers')}
              title="Followers only" description="Only people who follow you can see full details." themeColor={theme.primary} />
            <SettingsRadioCard selected={privacy.profileVisibility === 'private'} onClick={() => applyProfileVisibility('private')}
              title="Private" description="Only you can see your profile details." themeColor={theme.primary} />
          </div>
          <p className="mt-3 text-xs text-slate-500">Sets the fields below to match — fine-tune any of them individually afterwards.</p>
        </SettingsSection>

        <SettingsSection title="Who can follow me">
          <div className="grid sm:grid-cols-2 gap-3">
            <SettingsRadioCard selected={privacy.followPermission === 'requests_open'} onClick={() => setField('followPermission', 'requests_open')}
              title="Anyone can request" description="Anyone can send a follow request — you always approve or decline it below." themeColor={theme.primary} />
            <SettingsRadioCard selected={privacy.followPermission === 'nobody'} onClick={() => setField('followPermission', 'nobody')}
              title="Nobody" description="Turn off incoming follow requests entirely." themeColor={theme.primary} />
          </div>
        </SettingsSection>

        <SettingsSection title="Who can send connection requests">
          <div className="grid sm:grid-cols-3 gap-3">
            <SettingsRadioCard selected={privacy.connectionPermission === 'anyone'} onClick={() => setField('connectionPermission', 'anyone')}
              title="Anyone" description="Open to connection requests from anyone." themeColor={theme.primary} />
            <SettingsRadioCard selected={privacy.connectionPermission === 'mutual'} onClick={() => setField('connectionPermission', 'mutual')}
              title="Mutual community members" description="Only people who share a community with you." themeColor={theme.primary} />
            <SettingsRadioCard selected={privacy.connectionPermission === 'nobody'} onClick={() => setField('connectionPermission', 'nobody')}
              title="Nobody" description="Turn off connection requests entirely." themeColor={theme.primary} />
          </div>
          <p className="mt-3 text-xs text-slate-500">Saved now, and applied once dedicated community connection requests launch.</p>
        </SettingsSection>

        <SettingsSection title="What's visible on your profile">
          <div className="space-y-3">
            {PRIVACY_FIELDS.map((field) => (
              <SettingsRow key={field.key} label={field.label} description={field.description} themeColor={theme.primary}>
                <SettingsSelect value={privacy[field.key] || 'everyone'} onChange={(v) => setField(field.key, v)} options={AUDIENCE_OPTIONS} themeColor={theme.primary} />
              </SettingsRow>
            ))}
            <SettingsRow label="Show exact location on profile" description="Off by default — your exact suburb is never shown publicly unless you enable this." themeColor={theme.primary}>
              <SettingsToggle checked={!!privacy.showExactLocation} onChange={(v) => setField('showExactLocation', v)} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Record my recent activity at all" description="Turn off to stop new activity from being logged anywhere on your profile." themeColor={theme.primary}>
              <SettingsToggle checked={privacy.activityFeedEnabled !== false} onChange={(v) => setField('activityFeedEnabled', v)} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Allow profile to appear in search" description="Lets other members find your profile by name or username." themeColor={theme.primary}>
              <SettingsToggle checked={privacy.searchableProfile !== false} onChange={(v) => setField('searchableProfile', v)} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Allow organiser recommendations" description="Event and community organisers may suggest their listings to you." themeColor={theme.primary}>
              <SettingsToggle checked={privacy.organiserRecommendations !== false} onChange={(v) => setField('organiserRecommendations', v)} themeColor={theme.primary} />
            </SettingsRow>
          </div>

          <div className="flex items-center justify-end gap-4 mt-5 pt-5 border-t border-slate-100">
            <InlineFeedback status={status} />
            <SaveButton onClick={handleSave} saving={saving} themeColor={theme.primary} />
          </div>
        </SettingsSection>

        <BlockedUsersSection theme={theme} />

        <SettingsSection title="Report history">
          <p className="text-sm text-slate-500">
            Reports you submit go straight to our safety team for review — a personal history view isn't available yet.
          </p>
          <Link to="/safety" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: theme.primary }}>
            Visit the Safety Centre <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </SettingsSection>

        <FollowRequestsSection user={user} theme={theme} />
        <SocialRevealSection user={user} theme={theme} />
      </div>
    </div>
  );
}

function BlockedUsersSection({ theme }) {
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(FEATURES.blocks);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!FEATURES.blocks) return;
    blocksApi.list().then(setBlocked).catch(() => setBlocked([])).finally(() => setLoading(false));
  }, []);

  if (!FEATURES.blocks) {
    return (
      <SettingsSection title="Blocked users">
        <p className="text-sm text-slate-500">Blocking isn't live in this deployment yet — we're still building it out.</p>
      </SettingsSection>
    );
  }

  const unblock = async (id) => {
    setBusyId(id);
    try {
      await blocksApi.unblock(id);
      setBlocked((b) => b.filter((x) => x.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SettingsSection title="Blocked users">
      {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      {!loading && blocked.length === 0 && <p className="text-sm text-slate-500">You haven't blocked anyone.</p>}
      <div className="space-y-2">
        {blocked.map((b) => (
          <SettingsRow key={b.id} label={b.name || b.id} themeColor={theme.primary}>
            <button disabled={busyId === b.id} onClick={() => unblock(b.id)}
              className="text-xs font-bold text-coral hover:opacity-80 transition-opacity disabled:opacity-50">
              Unblock
            </button>
          </SettingsRow>
        ))}
      </div>
    </SettingsSection>
  );
}

function FollowRequestsSection({ user, theme }) {
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
    setIncoming(inc); setOutgoing(out); setFollowers(fol); setFollowing(fing);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user.uid]);

  const withBusy = (id, fn) => async () => {
    setBusyId(id);
    try { await fn(); await load(); } finally { setBusyId(null); }
  };

  return (
    <SettingsSection title="Follow requests & connections">
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : (
        <div className="space-y-5">
          <RequestGroup title="Requests received" count={incoming.length} icon={Users}>
            {incoming.length === 0 && <p className="text-sm text-slate-400">None right now.</p>}
            {incoming.map((r) => (
              <div key={r.fromUid} className="flex items-center justify-between py-1.5">
                <Link to={`/u/${r.fromUid}`} className="text-sm font-medium text-slate-700 hover:opacity-80 transition-opacity">{r.fromUid}</Link>
                <div className="flex gap-1.5">
                  <button disabled={busyId === r.fromUid} onClick={withBusy(r.fromUid, () => followApi.acceptRequest(`${r.fromUid}_${user.uid}`))}
                    className="p-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors disabled:opacity-50"><Check className="w-3.5 h-3.5" /></button>
                  <button disabled={busyId === r.fromUid} onClick={withBusy(r.fromUid, () => followApi.declineRequest(r.fromUid, user.uid))}
                    className="p-1.5 bg-coral/10 text-coral rounded-lg hover:bg-coral/20 transition-colors disabled:opacity-50"><XIcon className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </RequestGroup>
          <RequestGroup title="Requests sent" count={outgoing.length}>
            {outgoing.length === 0 && <p className="text-sm text-slate-400">None right now.</p>}
            {outgoing.map((r) => (
              <div key={r.toUid} className="flex items-center justify-between py-1.5">
                <Link to={`/u/${r.toUid}`} className="text-sm font-medium text-slate-700 hover:opacity-80 transition-opacity">{r.toUid}</Link>
                <button disabled={busyId === r.toUid} onClick={withBusy(r.toUid, () => followApi.cancelRequest(user.uid, r.toUid))}
                  className="text-xs font-bold text-slate-400 hover:text-coral transition-colors disabled:opacity-50">Cancel</button>
              </div>
            ))}
          </RequestGroup>
          <RequestGroup title="Followers" count={followers.length}>
            {followers.length === 0 && <p className="text-sm text-slate-400">No followers yet.</p>}
            {followers.map((f) => (
              <div key={f.uid} className="flex items-center justify-between py-1.5">
                <Link to={`/u/${f.uid}`} className="text-sm font-medium text-slate-700 hover:opacity-80 transition-opacity">{f.uid}</Link>
                <button disabled={busyId === f.uid} onClick={withBusy(f.uid, () => followApi.removeFollower(user.uid, f.uid))}
                  className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-coral transition-colors disabled:opacity-50">
                  <UserMinus className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            ))}
          </RequestGroup>
          <RequestGroup title="Following" count={following.length}>
            {following.length === 0 && <p className="text-sm text-slate-400">Not following anyone yet.</p>}
            {following.map((f) => (
              <div key={f.uid} className="flex items-center justify-between py-1.5">
                <Link to={`/u/${f.uid}`} className="text-sm font-medium text-slate-700 hover:opacity-80 transition-opacity">{f.uid}</Link>
                <button disabled={busyId === f.uid} onClick={withBusy(f.uid, () => followApi.unfollow(user.uid, f.uid))}
                  className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-coral transition-colors disabled:opacity-50">
                  <UserX className="w-3.5 h-3.5" /> Unfollow
                </button>
              </div>
            ))}
          </RequestGroup>
        </div>
      )}
    </SettingsSection>
  );
}

function RequestGroup({ title, count, children }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{title} ({count})</h4>
      {children}
    </div>
  );
}

function SocialRevealSection({ user, theme }) {
  const [requests, setRequests] = useState([]);
  const [approving, setApproving] = useState(null);
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

  const startApproving = (req) => { setApproving(req.id); setSelectedPlatforms(req.requestedPlatforms || []); };
  const togglePlatform = (p) => setSelectedPlatforms((cur) => cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]);

  const confirmApprove = async () => {
    setBusyId(approving);
    try { await socialLinksApi.acceptReveal(approving, selectedPlatforms); setApproving(null); await load(); }
    finally { setBusyId(null); }
  };

  const decline = async (req) => {
    setBusyId(req.id);
    try { await socialLinksApi.declineReveal(req.requesterUid, req.ownerUid); await load(); }
    finally { setBusyId(null); }
  };

  return (
    <SettingsSection title="Social-link requests">
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : (
        <>
          {requests.length === 0 && <p className="text-sm text-slate-400">No pending requests.</p>}
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <Link to={`/u/${req.requesterUid}`} className="text-sm font-bold text-slate-800 hover:opacity-80 transition-opacity">{req.requesterUid}</Link>
                  {approving !== req.id && (
                    <div className="flex gap-1.5">
                      <button onClick={() => startApproving(req)} className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-bold hover:bg-teal-100 transition-colors">Approve</button>
                      <button disabled={busyId === req.id} onClick={() => decline(req)} className="px-2.5 py-1 bg-coral/10 text-coral rounded-lg text-xs font-bold hover:bg-coral/20 transition-colors disabled:opacity-50">Decline</button>
                    </div>
                  )}
                </div>
                {approving === req.id && (
                  <div className="space-y-2">
                    {(req.requestedPlatforms || []).map((p) => (
                      <label key={p} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={selectedPlatforms.includes(p)} onChange={() => togglePlatform(p)} className="w-4 h-4 rounded" style={{ accentColor: theme.primary }} />
                        <span className="text-sm text-slate-700 capitalize">{p}</span>
                      </label>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => setApproving(null)} className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600">Cancel</button>
                      <button onClick={confirmApprove} disabled={busyId === req.id || selectedPlatforms.length === 0}
                        className="flex-1 py-1.5 rounded-lg text-white text-xs font-bold disabled:opacity-50" style={{ background: theme.primary }}>
                        {busyId === req.id ? 'Approving...' : 'Confirm approval'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </SettingsSection>
  );
}
