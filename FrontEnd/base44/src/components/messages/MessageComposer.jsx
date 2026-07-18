import React, { useState, useRef, useCallback } from 'react';
import { Paperclip, Smile, Send, Loader2 } from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside.jsx';
import { uploadsApi } from '@/api/uploadsApi';

const EMOJI_SET = ['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '🙌', '🔥', '❤️', '🎉', '🏔️', '🥾', '🏃', '🌊', '☀️', '🙏', '👏', '😢', '😮'];

export default function MessageComposer({ communityName, onSend, onSendImage, currentUser }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [gifNotice, setGifNotice] = useState(false);
  const fileInputRef = useRef(null);
  const closeEmoji = useCallback(() => setEmojiOpen(false), []);
  const emojiRef = useClickOutside(emojiOpen, closeEmoji);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await onSend(text.trim());
      setText('');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFilePick = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || !currentUser) return;
    setUploading(true);
    try {
      const url = await uploadsApi.upload(file, `messages/${currentUser.uid}-${Date.now()}`);
      await onSendImage(url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-t border-sand bg-white px-4 py-3">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFilePick} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Share a photo"
          className="w-10 h-10 rounded-full flex items-center justify-center text-charcoal/50 hover:bg-sand/60 transition-colors disabled:opacity-50 shrink-0"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        </button>

        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full bg-sand/60">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${communityName}...`}
            className="w-full bg-transparent text-sm focus:outline-none placeholder:text-charcoal/40"
          />
        </div>

        <div ref={emojiRef} className="relative shrink-0">
          <button onClick={() => setEmojiOpen((o) => !o)} title="Emoji" className="w-10 h-10 rounded-full flex items-center justify-center text-charcoal/50 hover:bg-sand/60 transition-colors">
            <Smile className="w-4 h-4" />
          </button>
          {emojiOpen && (
            <div className="absolute bottom-full right-0 mb-2 grid grid-cols-5 gap-1 bg-white border border-sand rounded-2xl shadow-2xl p-2 w-56">
              {EMOJI_SET.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => { setText((t) => t + emoji); setEmojiOpen(false); }}
                  className="w-9 h-9 rounded-lg hover:bg-sand/60 flex items-center justify-center text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => { setGifNotice(true); setTimeout(() => setGifNotice(false), 2000); }}
            title="GIF"
            className="h-10 px-3 rounded-full flex items-center justify-center text-xs font-bold text-charcoal/50 hover:bg-sand/60 transition-colors"
          >
            GIF
          </button>
          {gifNotice && (
            <div className="absolute bottom-full right-0 mb-2 w-48 rounded-xl border border-sand bg-white shadow-2xl p-2.5 text-[11px] text-charcoal/60">
              GIF search isn't connected in this deployment yet.
            </div>
          )}
        </div>

        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full bg-coral text-white flex items-center justify-center hover:bg-coral/90 transition-colors disabled:opacity-40 shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
