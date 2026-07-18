import React from 'react';
import { Pin, X } from 'lucide-react';

// Dismissing hides it for this user only (a localStorage flag keyed by
// message id, see Messages.jsx) — it doesn't unpin the message for the
// group. Only the organiser/owner can set/clear the pin itself (see the
// per-message "Pin"/"Unpin" control in MessageBubble.jsx).
export default function PinnedMessageBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 px-5 py-3 bg-leaf/10 border-b border-leaf/15">
      <Pin className="w-4 h-4 text-leaf shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-leaf">Pinned by {message.senderName}</p>
        <p className="text-sm text-charcoal/80 truncate">{message.body || (message.type === 'image' ? 'Photo' : 'Shared activity')}</p>
      </div>
      <button onClick={onDismiss} aria-label="Dismiss pinned message" className="shrink-0 p-1 text-charcoal/40 hover:text-charcoal transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
