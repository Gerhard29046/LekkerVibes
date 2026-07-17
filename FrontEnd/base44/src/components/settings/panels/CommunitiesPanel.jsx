import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UsersRound, ArrowRight } from 'lucide-react';
import { profileApi } from '@/api/profileApi';
import { DEFAULT_COMMUNITY_PREFS, DEFAULT_GROUP_FOLLOW_PREFS } from '@/lib/settingsDefaults';
import { PanelHeader, SettingsSection, SettingsRow, SettingsToggle, InlineFeedback, SaveButton } from '../primitives';

export default function CommunitiesPanel({ profile, user, theme, onProfileChange, onDirtyChange }) {
  const initialCommunity = { ...DEFAULT_COMMUNITY_PREFS, ...profile?.communityPrefs };
  const initialGroupFollow = { ...DEFAULT_GROUP_FOLLOW_PREFS, ...profile?.groupFollowPrefs };
  const [community, setCommunity] = useState(initialCommunity);
  const [groupFollow, setGroupFollow] = useState(initialGroupFollow);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const dirty = JSON.stringify(community) !== JSON.stringify(initialCommunity)
    || JSON.stringify(groupFollow) !== JSON.stringify(initialGroupFollow);

  useEffect(() => {
    onDirtyChange?.(dirty ? {
      onSave: handleSave,
      onDiscard: () => { setCommunity(initialCommunity); setGroupFollow(initialGroupFollow); },
      saving,
    } : null);
    return () => onDirtyChange?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, saving]);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await Promise.all([
        profileApi.updateCommunityPrefs(user.uid, community),
        profileApi.updateGroupFollowPrefs(user.uid, groupFollow),
      ]);
      onProfileChange?.({ communityPrefs: community, groupFollowPrefs: groupFollow });
      setStatus({ type: 'success', message: 'Community preferences saved.' });
    } catch {
      setStatus({ type: 'error', message: 'Could not save — please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PanelHeader icon={UsersRound} color="sky" title="Communities and groups" description="Manage community participation and followed groups." />

      <div className="space-y-5">
        <SettingsSection title="Communities you've joined">
          <p className="text-xs text-slate-500 mb-3 -mt-2">Communities are groups you actively participate in.</p>
          <div className="space-y-3">
            <SettingsRow label="Automatically follow communities I join" description="Get updates from a community as soon as you become a member." themeColor={theme.primary}>
              <SettingsToggle checked={community.autoFollowOnJoin} onChange={(v) => setCommunity((c) => ({ ...c, autoFollowOnJoin: v }))} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Community invitation notifications" description="Get notified when you're invited to join a community." themeColor={theme.primary}>
              <SettingsToggle checked={community.invitationNotifications} onChange={(v) => setCommunity((c) => ({ ...c, invitationNotifications: v }))} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Membership approval notifications" description="Know as soon as your join request is approved or declined." themeColor={theme.primary}>
              <SettingsToggle checked={community.approvalNotifications} onChange={(v) => setCommunity((c) => ({ ...c, approvalNotifications: v }))} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Community announcement alerts" description="Important announcements from communities you belong to." themeColor={theme.primary}>
              <SettingsToggle checked={community.announcementAlerts} onChange={(v) => setCommunity((c) => ({ ...c, announcementAlerts: v }))} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Event alerts from my communities" description="New events created by communities you've joined." themeColor={theme.primary}>
              <SettingsToggle checked={community.eventAlertsFromCommunities} onChange={(v) => setCommunity((c) => ({ ...c, eventAlertsFromCommunities: v }))} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Show communities on profile" description="Let others see which communities you're a member of." themeColor={theme.primary}>
              <SettingsToggle checked={community.showCommunitiesOnProfile} onChange={(v) => setCommunity((c) => ({ ...c, showCommunitiesOnProfile: v }))} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Allow community members to send connection requests" description="Members you share a community with can reach out to connect." themeColor={theme.primary}>
              <SettingsToggle checked={community.allowMembersToConnect} onChange={(v) => setCommunity((c) => ({ ...c, allowMembersToConnect: v }))} themeColor={theme.primary} />
            </SettingsRow>
          </div>
          <Link to="/clubs" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: theme.primary }}>
            Manage communities <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </SettingsSection>

        <SettingsSection title="Groups you follow">
          <p className="text-xs text-slate-500 mb-3 -mt-2">Following lets you get updates without joining as a member.</p>
          <div className="space-y-3">
            <SettingsRow label="New post alerts" description="Get notified about new posts from groups you follow." themeColor={theme.primary}>
              <SettingsToggle checked={groupFollow.newPostAlerts} onChange={(v) => setGroupFollow((g) => ({ ...g, newPostAlerts: v }))} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="New event alerts" description="Get notified when a followed group creates an event." themeColor={theme.primary}>
              <SettingsToggle checked={groupFollow.newEventAlerts} onChange={(v) => setGroupFollow((g) => ({ ...g, newEventAlerts: v }))} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Important announcements only" description="Mute everything except major announcements from followed groups." themeColor={theme.primary}>
              <SettingsToggle checked={groupFollow.importantOnly} onChange={(v) => setGroupFollow((g) => ({ ...g, importantOnly: v }))} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Show followed groups on profile" description="Let others see which groups you follow." themeColor={theme.primary}>
              <SettingsToggle checked={groupFollow.showFollowedGroupsOnProfile} onChange={(v) => setGroupFollow((g) => ({ ...g, showFollowedGroupsOnProfile: v }))} themeColor={theme.primary} />
            </SettingsRow>
          </div>
          <Link to="/profile?tab=Following%20groups" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: theme.primary }}>
            Manage followed groups <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </SettingsSection>

        <div className="flex items-center justify-end gap-4">
          <InlineFeedback status={status} />
          <SaveButton onClick={handleSave} saving={saving} themeColor={theme.primary} />
        </div>
      </div>
    </div>
  );
}
