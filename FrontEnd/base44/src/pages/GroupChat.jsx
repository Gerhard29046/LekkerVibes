import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { messagesApi } from '@/api/messagesApi';
import { notificationsApi } from '@/api/notificationsApi';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft, Send, Trash2, MessageCircle } from 'lucide-react';
import moment from 'moment';

// Real-time via a Firestore onSnapshot listener — no polling. See
// documentation/DECISIONS.md for the Laravel-Reverb-era polling approach
// this replaced.

export default function GroupChat() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    messagesApi.conversation(conversationId).then((convo) => {
      if (!cancelled) setConversation(convo);
    });
    messagesApi.markConversationRead().catch(() => {});

    const unsubscribe = messagesApi.subscribeToMessages(conversationId, (msgs) => {
      if (cancelled) return;
      setMessages(msgs);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || sending || !user) return;
    setSending(true);
    try {
      await messagesApi.send(conversationId, text.trim(), user);
      setText('');
      // Best-effort, never blocks sending — a lightweight "X new messages"
      // indicator for members who aren't currently looking at this chat.
      notificationsApi.notifyGroupMessage(conversationId, user).catch(() => {});
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const deleteMessage = async (msgId) => {
    await messagesApi.remove(conversationId, msgId);
  };

  const backLink = conversation?.community ? `/club/${conversation.community.id}`
    : conversation?.event ? `/activity/${conversation.event.id}`
      : '/';
  const groupName = conversation?.community?.name || conversation?.event?.title || conversation?.title || 'Group Chat';

  return (
    <div className="flex flex-col h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-sand px-4 py-3 flex items-center gap-3 shadow-sm">
        <Link to={backLink} className="p-2 hover:bg-sand rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-charcoal" />
        </Link>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ocean to-teal flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-charcoal text-sm truncate">{groupName}</p>
          <p className="text-xs text-charcoal/50">{messages.length} messages</p>
        </div>
        <div className="text-xs text-charcoal/40 hidden sm:block">No private messages · Group only</div>
      </div>

      {/* Safety banner */}
      <div className="bg-teal/5 border-b border-teal/10 px-4 py-2 text-center">
        <p className="text-xs text-teal/80">🛡️ This is a safe, moderated group space. No private messaging. Be kind.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-sand border-t-ocean rounded-full animate-spin" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-charcoal/40 py-16">
            <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">Be the first to say something!</p>
            <p className="text-xs mt-1">Say hi, ask questions, connect with the group.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
              {/* Avatar — tappable through to the sender's profile; system
                  messages have no real sender, so they stay static. */}
              {msg.isSystem ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ocean to-teal flex items-center justify-center shrink-0 overflow-hidden">
                  <span className="text-white text-xs font-bold">LV</span>
                </div>
              ) : (
                <Link
                  to={`/u/${msg.senderId}`}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-ocean to-teal flex items-center justify-center shrink-0 overflow-hidden hover:opacity-80 transition-opacity"
                  title={msg.senderName}
                >
                  <span className="text-white text-xs font-bold">{(msg.senderName || 'M')[0].toUpperCase()}</span>
                </Link>
              )}
              <div className={`max-w-xs sm:max-w-sm lg:max-w-md group ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isOwn && msg.senderName && (
                  msg.isSystem ? (
                    <p className="text-xs text-charcoal/50 font-medium mb-1 px-1">{msg.senderName}</p>
                  ) : (
                    <Link to={`/u/${msg.senderId}`} className="text-xs text-charcoal/50 font-medium mb-1 px-1 hover:text-ocean hover:underline transition-colors w-fit">
                      {msg.senderName}
                    </Link>
                  )
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.isDeleted
                    ? 'bg-sand/60 text-charcoal/40 italic rounded-tl-sm'
                    : isOwn
                      ? 'bg-gradient-to-r from-ocean to-teal text-white rounded-tr-sm'
                      : msg.isSystem
                        ? 'bg-coral/10 border border-coral/20 text-charcoal rounded-tl-sm'
                        : 'bg-white border border-sand text-charcoal rounded-tl-sm shadow-sm'
                }`}>
                  {msg.isDeleted ? 'This message was deleted' : msg.body}
                </div>
                <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <p className="text-[10px] text-charcoal/40 px-1">{msg.createdAt ? moment(msg.createdAt.toDate ? msg.createdAt.toDate() : msg.createdAt).fromNow() : 'sending…'}</p>
                  {isOwn && !msg.isDeleted && (
                    <button onClick={() => deleteMessage(msg.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-sand rounded">
                      <Trash2 className="w-3 h-3 text-charcoal/40" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-sand px-4 py-3">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Say something to the group..."
              rows={1}
              className="w-full px-4 py-3 rounded-2xl border border-border bg-sand text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 resize-none leading-relaxed"
              style={{ minHeight: 44, maxHeight: 120 }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            className="w-11 h-11 bg-gradient-to-r from-ocean to-teal text-white rounded-xl flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-40 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
