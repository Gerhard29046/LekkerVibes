import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import EventMessageCard from './EventMessageCard';

const REACTION_EMOJIS = ['❤️', '🔥', '👍'];

// Fixed v1 reaction set, count-only (no "who reacted" list) — see
// Firebase/firestore.rules' note on why that keeps the security stakes of
// a spoofed uid low. `overlay` renders the pill row floating over the
// bottom-right corner (image messages) instead of below (text/event).
function Reactions({ reactions, currentUid, onToggle, overlay }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const active = REACTION_EMOJIS.filter((e) => (reactions?.[e]?.length || 0) > 0);

  const content = (
    <div className="flex items-center gap-1.5 flex-wrap">
      {active.map((emoji) => {
        const uids = reactions[emoji] || [];
        const mine = uids.includes(currentUid);
        return (
          <button
            key={emoji}
            onClick={() => onToggle(emoji)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
              mine ? 'bg-ocean/10 border-ocean/30 text-ocean' : overlay ? 'bg-white/90 border-transparent text-charcoal/70' : 'bg-sand/60 border-transparent text-charcoal/70 hover:border-sand'
            }`}
          >
            {emoji} {uids.length}
          </button>
        );
      })}
      <div className="relative">
        <button
          onClick={() => setPickerOpen((o) => !o)}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-sm transition-colors ${
            overlay ? 'bg-white/90 text-charcoal/50' : 'text-charcoal/30 hover:bg-sand/60 hover:text-charcoal/60'
          }`}
        >
          +
        </button>
        {pickerOpen && (
          <div className="absolute bottom-full left-0 mb-1 flex items-center gap-1 bg-white border border-sand rounded-full shadow-lg p-1 z-10">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { onToggle(emoji); setPickerOpen(false); }}
                className="w-7 h-7 rounded-full hover:bg-sand/60 flex items-center justify-center text-sm transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (overlay) return <div className="absolute bottom-2 right-2">{content}</div>;
  return <div className="mt-1.5">{content}</div>;
}

export default function MessageBubble({ message, currentUser, isOrganiser, isPinned, onToggleReaction, onPinToggle, onImageClick }) {
  const isOwn = message.senderId === currentUser?.uid;
  const timeLabel = message.createdAt
    ? moment(message.createdAt.toDate ? message.createdAt.toDate() : message.createdAt).format('h:mm A')
    : 'sending…';

  if (message.isSystem) {
    return <p className="text-center text-xs text-charcoal/40 py-2">{message.body}</p>;
  }

  return (
    <div className="group flex gap-3 py-2">
      <Link to={`/u/${message.senderId}`} className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-ocean to-teal flex items-center justify-center hover:opacity-80 transition-opacity">
        {message.senderPhotoURL
          ? <img src={message.senderPhotoURL} alt="" className="w-full h-full object-cover" />
          : <span className="text-white text-xs font-bold">{(message.senderName || 'M')[0].toUpperCase()}</span>}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <Link to={`/u/${message.senderId}`} className="text-sm font-semibold text-charcoal hover:text-ocean transition-colors">
            {message.senderName}
          </Link>
          {isOrganiser && (
            <button
              onClick={onPinToggle}
              className="opacity-0 group-hover:opacity-100 text-[11px] font-medium text-charcoal/40 hover:text-ocean transition-opacity"
            >
              {isPinned ? 'Unpin' : 'Pin'}
            </button>
          )}
        </div>

        {message.isDeleted ? (
          <p className="text-sm text-charcoal/40 italic mt-0.5">This message was deleted</p>
        ) : message.type === 'event' && message.eventId ? (
          <div className="mt-1.5">
            <EventMessageCard eventId={message.eventId} />
          </div>
        ) : message.type === 'image' && message.imageURL ? (
          <div className="relative mt-1.5 max-w-md rounded-2xl overflow-hidden">
            <button onClick={() => onImageClick(message.imageURL)} className="block w-full">
              <img src={message.imageURL} alt="" className="w-full max-h-96 object-cover" />
            </button>
            <Reactions reactions={message.reactions} currentUid={currentUser?.uid} onToggle={(e) => onToggleReaction(message.id, e)} overlay />
          </div>
        ) : (
          <>
            <div className="inline-block mt-0.5 px-3.5 py-2 rounded-2xl bg-sand/70 text-sm text-charcoal max-w-md">
              {message.body}
            </div>
            <Reactions reactions={message.reactions} currentUid={currentUser?.uid} onToggle={(e) => onToggleReaction(message.id, e)} />
          </>
        )}
        <p className="text-[11px] text-charcoal/35 mt-1">{timeLabel}</p>
      </div>
    </div>
  );
}
