import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { communitiesApi } from '@/api/communitiesApi';
import { messagesApi } from '@/api/messagesApi';
import { reportsApi } from '@/api/reportsApi';
import { FEATURES } from '@/lib/featureFlags';
import ComingSoon from '@/components/ComingSoon';
import Navbar from '@/components/landing/Navbar';
import MessagesSidebar from '@/components/messages/MessagesSidebar';
import ChatHeader from '@/components/messages/ChatHeader';
import PinnedMessageBanner from '@/components/messages/PinnedMessageBanner';
import MessageBubble from '@/components/messages/MessageBubble';
import MessageComposer from '@/components/messages/MessageComposer';
import CommunityContextPanel from '@/components/messages/CommunityContextPanel';
import MemberListModal from '@/components/messages/MemberListModal';

export default function Messages() {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [myCommunities, setMyCommunities] = useState([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState('');

  const [community, setCommunity] = useState(null);
  const [previewMembers, setPreviewMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [pinDismissed, setPinDismissed] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const bottomRef = useRef(null);

  // "Your communities" for the left panel, each enriched with an unread
  // count — recomputed whenever the selected thread changes (a message
  // arriving elsewhere doesn't live-update every row's badge in this
  // pass, only a full reload does).
  const loadCommunities = useCallback(() => {
    if (!user) return;
    setCommunitiesLoading(true);
    communitiesApi.myMemberships(user.uid).then(async (list) => {
      const counts = await Promise.all(list.map((c) => messagesApi.getUnreadCount(c.id, user.uid).catch(() => 0)));
      setMyCommunities(list.map((c, i) => ({ ...c, unreadCount: counts[i] })));
    }).finally(() => setCommunitiesLoading(false));
  }, [user]);

  useEffect(() => { loadCommunities(); }, [loadCommunities]);

  // Default to the first community once the list is known, if the route
  // didn't already pin one.
  useEffect(() => {
    if (!communityId && myCommunities.length > 0) {
      navigate(`/messages/${myCommunities[0].id}`, { replace: true });
    }
  }, [communityId, myCommunities, navigate]);

  const selectedId = communityId || myCommunities[0]?.id || null;

  useEffect(() => {
    if (!selectedId || !user) return;
    let cancelled = false;
    communitiesApi.get(selectedId, user.uid).then((data) => { if (!cancelled) setCommunity(data); });
    communitiesApi.membersPage(selectedId, { pageSize: 50 }).then((page) => { if (!cancelled) setPreviewMembers(page.items); });
    communitiesApi.isMuted(user.uid, selectedId).then((v) => { if (!cancelled) setIsMuted(v); });
    messagesApi.markConversationRead(selectedId, user.uid).then(() => loadCommunities());
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, user]);

  useEffect(() => {
    if (!selectedId) return;
    const unsubscribe = messagesApi.subscribeToMessages(selectedId, setMessages);
    return unsubscribe;
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!community?.pinnedMessageId) { setPinDismissed(false); return; }
    setPinDismissed(localStorage.getItem(`lv_dismissed_pin_${community.id}_${community.pinnedMessageId}`) === '1');
  }, [community?.id, community?.pinnedMessageId]);

  if (!FEATURES.messages) {
    return <ComingSoon feature="Messages" />;
  }

  const handleSend = async (text) => {
    if (!selectedId || !user) return;
    await messagesApi.send(selectedId, text, user);
  };
  const handleSendImage = async (url) => {
    if (!selectedId || !user) return;
    await messagesApi.sendImage(selectedId, url, user);
  };
  const handleToggleReaction = (messageId, emoji) => {
    if (!selectedId || !user) return;
    messagesApi.toggleReaction(selectedId, messageId, emoji, user.uid);
  };
  const handleToggleMute = async () => {
    if (!user || !selectedId) return;
    if (isMuted) await communitiesApi.unmuteNotifications(user.uid, selectedId);
    else await communitiesApi.muteNotifications(user.uid, selectedId);
    setIsMuted((m) => !m);
  };
  const handleInvite = async () => {
    if (!community) return;
    const url = `${window.location.origin}/club/${community.id}${community.joinPolicy === 'invite_only' ? `?token=${community.inviteToken}` : ''}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };
  const handleLeave = async () => {
    if (!user || !community) return;
    if (!window.confirm(`Leave ${community.name}?`)) return;
    await communitiesApi.leave(community.id, user.uid);
    navigate('/messages');
    loadCommunities();
  };
  const handleReport = async () => {
    if (!user || !community) return;
    await reportsApi.create({ reportableType: 'community', reportableId: community.id, reason: 'other', details: undefined }, user);
  };
  const handlePinToggle = async (messageId) => {
    if (!community) return;
    const next = community.pinnedMessageId === messageId ? null : messageId;
    await communitiesApi.update(community.id, { pinnedMessageId: next });
    setCommunity((c) => ({ ...c, pinnedMessageId: next }));
  };
  const dismissPin = () => {
    if (!community?.pinnedMessageId) return;
    localStorage.setItem(`lv_dismissed_pin_${community.id}_${community.pinnedMessageId}`, '1');
    setPinDismissed(true);
  };

  const pinnedMessage = community?.pinnedMessageId && !pinDismissed
    ? messages.find((m) => m.id === community.pinnedMessageId && !m.isDeleted)
    : null;
  const onlineCount = previewMembers.filter((m) => m.lastActiveAt && (Date.now() - (m.lastActiveAt.toDate ? m.lastActiveAt.toDate() : new Date(m.lastActiveAt)).getTime()) < 2 * 60 * 1000).length;
  const isOrganiser = community?.myMembership?.role === 'organiser' || community?.ownerId === user?.uid;

  return (
    <div className="h-screen flex flex-col bg-cream">
      <Navbar />
      <div className="flex-1 flex pt-16 sm:pt-[72px] min-h-0">
        <div className="w-[280px] shrink-0 hidden md:block">
          <MessagesSidebar
            communities={myCommunities}
            selectedCommunityId={selectedId}
            search={sidebarSearch}
            onSearchChange={setSidebarSearch}
          />
        </div>

        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center text-center px-6">
            {communitiesLoading ? null : (
              <div>
                <p className="text-lg font-semibold text-charcoal mb-2">No communities yet</p>
                <p className="text-sm text-charcoal/50">Join or create a community to start chatting.</p>
              </div>
            )}
          </div>
        ) : !community ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-sand border-t-ocean rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col min-w-0 bg-cream">
              <ChatHeader
                community={community}
                onlineCount={onlineCount}
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
                onInvite={handleInvite}
                inviteCopied={inviteCopied}
                onOpenMembers={() => setMembersOpen(true)}
                onLeave={handleLeave}
                onReport={handleReport}
                hasPinned={!!community.pinnedMessageId}
                onShowPinned={() => {
                  if (community.pinnedMessageId) {
                    localStorage.removeItem(`lv_dismissed_pin_${community.id}_${community.pinnedMessageId}`);
                    setPinDismissed(false);
                  }
                }}
              />
              {pinnedMessage && <PinnedMessageBanner message={pinnedMessage} onDismiss={dismissPin} />}

              <div className="flex-1 overflow-y-auto px-5 py-3">
                {messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    currentUser={user}
                    isOrganiser={isOrganiser}
                    isPinned={community.pinnedMessageId === m.id}
                    onToggleReaction={handleToggleReaction}
                    onPinToggle={() => handlePinToggle(m.id)}
                    onImageClick={setLightboxUrl}
                  />
                ))}
                <div ref={bottomRef} />
              </div>

              <MessageComposer communityName={community.name} onSend={handleSend} onSendImage={handleSendImage} currentUser={user} />
            </div>

            <div className="w-[300px] shrink-0 hidden lg:block border-l border-sand bg-white">
              <CommunityContextPanel
                community={community}
                previewMembers={previewMembers}
                messages={messages}
                currentUser={user}
                onOpenMembers={() => setMembersOpen(true)}
                onViewAllEvents={() => navigate(`/club/${community.id}`)}
                onViewAllPhotos={() => {}}
              />
            </div>

            <MemberListModal open={membersOpen} onOpenChange={setMembersOpen} communityId={community.id} />
          </>
        )}
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6"
          onClick={() => setLightboxUrl(null)}
        >
          <button onClick={() => setLightboxUrl(null)} className="absolute top-5 right-5 text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
          <img src={lightboxUrl} alt="" className="max-w-full max-h-full rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
