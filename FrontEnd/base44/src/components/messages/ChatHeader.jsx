import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Pin, Bell, BellOff, UserPlus, MoreVertical, LogOut, Flag, Pencil } from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside.jsx';

export default function ChatHeader({ community, onlineCount, isMuted, isAdmin, isOwner, onToggleMute, onInvite, onOpenMembers, onLeave, onReport, hasPinned, onShowPinned }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const menuRef = useClickOutside(menuOpen, closeMenu);

  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-sand bg-white">
      {community.imageURL
        ? <img src={community.imageURL} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
        : <div className="w-11 h-11 rounded-full bg-gradient-to-br from-ocean to-teal shrink-0" />}
      <div className="min-w-0 flex-1">
        <h1 className="font-body font-bold text-lg text-charcoal truncate">{community.name}</h1>
        <button onClick={onOpenMembers} className="flex items-center gap-1.5 text-xs text-charcoal/50 hover:text-charcoal transition-colors">
          {community.memberCount} members
          <span className="flex items-center gap-1">
            · <span className="w-1.5 h-1.5 rounded-full bg-leaf inline-block" /> {onlineCount} online
          </span>
        </button>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {isOwner && (
          <Link
            to={`/club/${community.id}/edit`}
            title="Edit community"
            className="w-9 h-9 rounded-full flex items-center justify-center text-charcoal/60 hover:bg-sand/60 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </Link>
        )}
        {hasPinned && (
          <button onClick={onShowPinned} title="View pinned message" className="w-9 h-9 rounded-full flex items-center justify-center text-charcoal/60 hover:bg-sand/60 transition-colors">
            <Pin className="w-4 h-4" />
          </button>
        )}
        {isAdmin && (
          <button onClick={onInvite} title="Invite people" className="w-9 h-9 rounded-full flex items-center justify-center text-charcoal/60 hover:bg-sand/60 transition-colors">
            <UserPlus className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute this community' : 'Mute this community'}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-ocean/10 text-ocean' : 'text-charcoal/60 hover:bg-sand/60'}`}
        >
          {isMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
        </button>
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="w-9 h-9 rounded-full flex items-center justify-center text-charcoal/60 hover:bg-sand/60 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[180px] overflow-hidden rounded-xl border border-sand bg-white py-1 shadow-2xl">
              <button
                role="menuitem"
                onClick={() => { setMenuOpen(false); onReport(); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-charcoal hover:bg-sand transition-colors"
              >
                <Flag className="w-4 h-4" /> Report community
              </button>
              <button
                role="menuitem"
                onClick={() => { setMenuOpen(false); onLeave(); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-coral hover:bg-sand transition-colors"
              >
                <LogOut className="w-4 h-4" /> Leave community
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
