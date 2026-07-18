import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, SlidersHorizontal, Mountain, HeartPulse, Utensils, Church, Palette, ChevronRight } from 'lucide-react';
import { COMMUNITY_CATEGORY_GROUPS } from '@/config/communityCategories';

const CATEGORY_ICONS = { mountain: Mountain, 'heart-pulse': HeartPulse, utensils: Utensils, church: Church, palette: Palette };

// Persists across the whole Messages section — the community switcher,
// not per-conversation UI. "Your communities" (with unread badges) is
// separate from "Explore categories" (browsing communities you haven't
// joined yet), which routes out to the full Communities directory rather
// than replacing this chat-focused list in place.
export default function MessagesSidebar({ communities, selectedCommunityId, search, onSearchChange }) {
  const navigate = useNavigate();
  const filtered = search
    ? communities.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()))
    : communities;

  return (
    <div className="flex flex-col h-full bg-white border-r border-sand">
      <div className="p-4 space-y-3 border-b border-sand">
        <Link
          to="/create-club"
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-ocean to-teal text-white font-semibold rounded-xl text-sm hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Create Community
        </Link>
        <div className="flex items-center gap-2 px-3 py-2 bg-sand/60 rounded-xl">
          <Search className="w-4 h-4 text-charcoal/40 shrink-0" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search communities"
            className="w-full bg-transparent text-sm focus:outline-none placeholder:text-charcoal/40"
          />
          <SlidersHorizontal className="w-4 h-4 text-charcoal/30 shrink-0" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-charcoal/40">Your communities</p>
        <div className="space-y-1 mb-5">
          {filtered.map((c) => {
            const isActive = c.id === selectedCommunityId;
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/messages/${c.id}`)}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                  isActive ? 'bg-ocean' : 'hover:bg-sand/60'
                }`}
              >
                {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-coral" aria-hidden="true" />}
                {c.imageURL
                  ? <img src={c.imageURL} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                  : <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-ocean to-teal shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-charcoal'}`}>{c.name}</p>
                  <p className={`text-xs truncate ${isActive ? 'text-white/70' : 'text-teal'}`}>{c.category || 'Community'}</p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-coral text-white text-[11px] font-bold flex items-center justify-center">
                    {c.unreadCount > 99 ? '99+' : c.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="px-2 py-4 text-sm text-charcoal/40">
              {communities.length === 0 ? "You haven't joined any communities yet." : 'No matches.'}
            </p>
          )}
        </div>

        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-charcoal/40">Explore categories</p>
        <div className="space-y-0.5">
          {COMMUNITY_CATEGORY_GROUPS.map((group) => {
            const Icon = CATEGORY_ICONS[group.icon];
            return (
              <button
                key={group.label}
                onClick={() => navigate(`/clubs?categories=${encodeURIComponent(group.categories.join(','))}`)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sand/60 text-sm text-charcoal/80 transition-colors text-left"
              >
                <Icon className="w-4 h-4 text-charcoal/50 shrink-0" />
                {group.label}
              </button>
            );
          })}
        </div>
        <Link to="/clubs" className="flex items-center gap-1 px-2 pt-3 text-sm font-medium text-ocean hover:text-teal transition-colors">
          View all categories <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
