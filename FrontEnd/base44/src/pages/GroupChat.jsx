import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Pin, Flag, Trash2, MessageCircle } from 'lucide-react';
import moment from 'moment';

export default function GroupChat() {
  const { groupType, groupId } = useParams();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [group, setGroup] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const profiles = await base44.entities.UserProfile.filter({ user_id: me.id });
      setProfile(profiles[0] || null);

      // Load group info
      if (groupType === 'club') {
        const c = await base44.entities.Club.get(groupId).catch(() => null);
        setGroup(c);
      } else {
        const a = await base44.entities.Activity.get(groupId).catch(() => null);
        setGroup(a);
      }

      // Load messages
      const msgs = await base44.entities.GroupMessage.filter(
        { group_type: groupType, group_id: groupId, is_deleted: false },
        'created_date', 50
      );
      setMessages(msgs);
      setLoading(false);
    };
    load();
  }, [groupType, groupId]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsub = base44.entities.GroupMessage.subscribe((event) => {
      if (event.data?.group_id === groupId && event.data?.group_type === groupType && !event.data?.is_deleted) {
        if (event.type === 'create') setMessages(m => [...m, event.data]);
        if (event.type === 'delete') setMessages(m => m.filter(msg => msg.id !== event.id));
      }
    });
    return unsub;
  }, [groupId, groupType]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const msg = await base44.entities.GroupMessage.create({
      group_type: groupType,
      group_id: groupId,
      user_id: user.id,
      user_name: profile?.display_name || user?.full_name || 'Member',
      user_photo: profile?.profile_photo || '',
      content: text.trim(),
      message_type: 'text',
    });
    setMessages(m => [...m, msg]);
    setText('');
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const deleteMessage = async (msgId) => {
    await base44.entities.GroupMessage.update(msgId, { is_deleted: true });
    setMessages(m => m.filter(msg => msg.id !== msgId));
  };

  const backLink = groupType === 'club' ? `/club/${groupId}` : `/activity/${groupId}`;

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
          <p className="font-heading font-semibold text-charcoal text-sm truncate">{group?.name || group?.title || 'Group Chat'}</p>
          <p className="text-xs text-charcoal/50 capitalize">{groupType} chat · {messages.length} messages</p>
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
          const isOwn = msg.user_id === user?.id;
          return (
            <div key={msg.id} className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ocean to-teal flex items-center justify-center shrink-0 overflow-hidden">
                {msg.user_photo
                  ? <img src={msg.user_photo} alt={msg.user_name} className="w-full h-full object-cover" />
                  : <span className="text-white text-xs font-bold">{(msg.user_name || 'M')[0].toUpperCase()}</span>
                }
              </div>
              <div className={`max-w-xs sm:max-w-sm lg:max-w-md group ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isOwn && <p className="text-xs text-charcoal/50 font-medium mb-1 px-1">{msg.user_name}</p>}
                {msg.message_type === 'announcement' && (
                  <div className="flex items-center gap-1 mb-1">
                    <Pin className="w-3 h-3 text-coral" />
                    <span className="text-xs text-coral font-semibold">Announcement</span>
                  </div>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isOwn
                    ? 'bg-gradient-to-r from-ocean to-teal text-white rounded-tr-sm'
                    : msg.message_type === 'announcement'
                      ? 'bg-coral/10 border border-coral/20 text-charcoal rounded-tl-sm'
                      : 'bg-white border border-sand text-charcoal rounded-tl-sm shadow-sm'
                }`}>
                  {msg.content}
                </div>
                <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <p className="text-[10px] text-charcoal/40 px-1">{moment(msg.created_date).fromNow()}</p>
                  {isOwn && (
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