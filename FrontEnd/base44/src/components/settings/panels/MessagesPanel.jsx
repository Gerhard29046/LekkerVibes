import React, { useState, useEffect } from 'react';
import { MessagesSquare, Info } from 'lucide-react';
import { profileApi } from '@/api/profileApi';
import { DEFAULT_MESSAGE_PREFS } from '@/lib/settingsDefaults';
import { PanelHeader, SettingsSection, SettingsRow, SettingsToggle, InlineFeedback, SaveButton } from '../primitives';

export default function MessagesPanel({ profile, user, theme, onProfileChange, onDirtyChange }) {
  const initial = { ...DEFAULT_MESSAGE_PREFS, ...profile?.messagePrefs };
  const [prefs, setPrefs] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

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
      await profileApi.updateMessagePrefs(user.uid, prefs);
      onProfileChange?.({ messagePrefs: prefs });
      setStatus({ type: 'success', message: 'Message preferences saved.' });
    } catch {
      setStatus({ type: 'error', message: 'Could not save — please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PanelHeader icon={MessagesSquare} color="lavender" title="Messages" description="Manage community, group and event chat preferences." />

      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-2xl bg-[#F3EEFF] border border-[#D8C8FF] p-4">
          <Info className="w-5 h-5 text-[#6D3FD1] shrink-0 mt-0.5" />
          <p className="text-sm text-[#6D3FD1] leading-6">
            Messages on LekkerVibes are limited to community, group and event chats — there's no personal direct-messaging inbox.
          </p>
        </div>

        <SettingsSection title="Chat notifications">
          <div className="space-y-3">
            <SettingsRow label="Community messages" description="Messages posted in your community chats." themeColor={theme.primary}>
              <SettingsToggle checked={prefs.communityMessages} onChange={(v) => set('communityMessages', v)} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Event chat messages" description="Messages posted in event chats you've joined." themeColor={theme.primary}>
              <SettingsToggle checked={prefs.eventChatMessages} onChange={(v) => set('eventChatMessages', v)} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Group chat messages" description="Messages in group chats you belong to." themeColor={theme.primary}>
              <SettingsToggle checked={prefs.groupChatMessages} onChange={(v) => set('groupChatMessages', v)} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Mentions" description="Someone tags you directly in a chat." themeColor={theme.primary}>
              <SettingsToggle checked={prefs.mentions} onChange={(v) => set('mentions', v)} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Replies" description="Someone replies to your message." themeColor={theme.primary}>
              <SettingsToggle checked={prefs.replies} onChange={(v) => set('replies', v)} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Message reactions" description="Someone reacts to something you sent." themeColor={theme.primary}>
              <SettingsToggle checked={prefs.reactions} onChange={(v) => set('reactions', v)} themeColor={theme.primary} />
            </SettingsRow>
          </div>
        </SettingsSection>

        <SettingsSection title="Chat experience">
          <div className="space-y-3">
            <SettingsRow label="Show message previews" description="Preview the latest message text in notifications." themeColor={theme.primary}>
              <SettingsToggle checked={prefs.showPreviews} onChange={(v) => set('showPreviews', v)} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Chat sound" description="Play a sound for new messages while the chat is open." themeColor={theme.primary}>
              <SettingsToggle checked={prefs.chatSound} onChange={(v) => set('chatSound', v)} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Push-message alerts" description="Get push notifications for new chat activity." themeColor={theme.primary}>
              <SettingsToggle checked={prefs.pushAlerts} onChange={(v) => set('pushAlerts', v)} themeColor={theme.primary} />
            </SettingsRow>
            <SettingsRow label="Allow community moderators to contact me" description="Moderators can reach you directly about chat conduct." themeColor={theme.primary}>
              <SettingsToggle checked={prefs.allowModeratorContact} onChange={(v) => set('allowModeratorContact', v)} themeColor={theme.primary} />
            </SettingsRow>
          </div>
        </SettingsSection>

        <SettingsSection title="Muted chats">
          <p className="text-sm text-slate-500">Mute a specific chat from inside that chat's own menu — muted chats will appear here for quick management once that's wired up.</p>
        </SettingsSection>

        <div className="flex items-center justify-end gap-4">
          <InlineFeedback status={status} />
          <SaveButton onClick={handleSave} saving={saving} themeColor={theme.primary} />
        </div>
      </div>
    </div>
  );
}
