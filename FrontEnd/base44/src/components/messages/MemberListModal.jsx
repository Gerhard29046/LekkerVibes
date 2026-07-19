import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { communitiesApi } from '@/api/communitiesApi';
import { isOnline } from '@/lib/presence';
import { resolveCommunityRole } from '@/lib/communityRoles';
import { Loader2, Crown, ShieldCheck, MoreVertical } from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside.jsx';

function RoleBadge({ role }) {
  if (role === 'owner') return <Crown className="w-3.5 h-3.5 text-peach shrink-0" title="Owner" />;
  if (role === 'moderator') return <ShieldCheck className="w-3.5 h-3.5 text-teal shrink-0" title="Moderator" />;
  return null;
}

function MemberRow({ row, ownerId, viewerUid, isOwner, isAdmin, onOpenChange, onRemove, onToggleRole }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = React.useCallback(() => setMenuOpen(false), []);
  const menuRef = useClickOutside(menuOpen, closeMenu);
  const rowRole = resolveCommunityRole(ownerId, row.uid, row.role);
  const isSelf = row.uid === viewerUid;
  // Any admin can manage a plain member; only the owner can touch another
  // moderator's role or membership, and nobody but the owner can ever
  // remove the owner's own row (that's a "leave"/"delete community"
  // decision, not something another admin can force) — mirrors
  // Firebase/firestore.rules' member delete/update rules exactly.
  const canManage = !isSelf && rowRole !== 'owner' && (isOwner || (isAdmin && rowRole !== 'moderator'));
  const canPromote = isOwner && !isSelf && rowRole !== 'owner';

  return (
    <div className="flex items-center gap-3 px-5 py-2.5 hover:bg-sand/40 transition-colors">
      <Link to={`/u/${row.uid}`} onClick={() => onOpenChange(false)} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ocean to-teal flex items-center justify-center overflow-hidden">
            {row.photoURL
              ? <img src={row.photoURL} alt={row.displayName} className="w-full h-full object-cover" />
              : <span className="text-white text-xs font-bold">{(row.displayName || '?')[0].toUpperCase()}</span>}
          </div>
          {isOnline(row.lastActiveAt) && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-leaf border-2 border-white" />
          )}
        </div>
        <span className="truncate text-sm font-medium text-charcoal flex-1">{row.displayName}</span>
        <RoleBadge role={rowRole} />
      </Link>
      {(canManage || canPromote) && (
        <div ref={menuRef} className="relative shrink-0">
          <button onClick={() => setMenuOpen((o) => !o)} className="p-1.5 text-charcoal/40 hover:text-charcoal transition-colors" aria-haspopup="menu" aria-expanded={menuOpen}>
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 top-[calc(100%+4px)] z-20 min-w-[160px] overflow-hidden rounded-xl border border-sand bg-white py-1 shadow-2xl">
              {canPromote && (
                <button
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); onToggleRole(row.uid, rowRole); }}
                  className="w-full text-left px-4 py-2 text-sm text-charcoal hover:bg-sand transition-colors"
                >
                  {rowRole === 'moderator' ? 'Demote to member' : 'Promote to moderator'}
                </button>
              )}
              {canManage && (
                <button
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); onRemove(row.uid); }}
                  className="w-full text-left px-4 py-2 text-sm text-coral hover:bg-sand transition-colors"
                >
                  Remove from community
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Same paginate-not-fetch-everything popup pattern as FollowListModal, for
// a community's full member list (not just who's online) — reused for
// both "See all" under Members online and tapping the member count in
// the thread header. Owner/moderator admin actions (remove, promote/
// demote) live in each row's overflow menu, gated by the viewer's role.
export default function MemberListModal({ open, onOpenChange, communityId, ownerId, viewerUid, isOwner, isAdmin }) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = () => {
    setLoading(true);
    communitiesApi.membersPage(communityId, {}).then((page) => {
      setItems(page.items);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!open) return;
    setItems([]);
    setCursor(null);
    setHasMore(false);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, communityId]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const page = await communitiesApi.membersPage(communityId, { cursor });
      setItems((cur) => [...cur, ...page.items]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRemove = async (targetUid) => {
    if (!window.confirm('Remove this member from the community?')) return;
    await communitiesApi.removeMember(communityId, targetUid);
    setItems((cur) => cur.filter((r) => r.uid !== targetUid));
  };
  // `currentRole` here is the already-resolved role ('owner'/'moderator'/
  // 'member'/null), not the raw stored value — resolveCommunityRole()
  // already normalized the legacy 'organiser' synonym, so this only ever
  // writes the two current values going forward.
  const handleToggleRole = async (targetUid, currentRole) => {
    const nextRole = currentRole === 'moderator' ? 'member' : 'moderator';
    await communitiesApi.setRole(communityId, targetUid, nextRole);
    setItems((cur) => cur.map((r) => r.uid === targetUid ? { ...r, role: nextRole } : r));
  };

  // Owner first, then moderators, then everyone else — each tier keeps
  // its existing joinedAt-desc order from the page it came from.
  const sorted = [...items].sort((a, b) => {
    const rank = (r) => {
      const role = resolveCommunityRole(ownerId, r.uid, r.role);
      return role === 'owner' ? 0 : role === 'moderator' ? 1 : 2;
    };
    return rank(a) - rank(b);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="font-body">Members</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pb-2">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-charcoal/30" /></div>
          ) : items.length === 0 ? (
            <p className="text-sm text-charcoal/40 text-center py-10">No members yet.</p>
          ) : (
            <>
              {sorted.map((row) => (
                <MemberRow
                  key={row.uid}
                  row={row}
                  ownerId={ownerId}
                  viewerUid={viewerUid}
                  isOwner={isOwner}
                  isAdmin={isAdmin}
                  onOpenChange={onOpenChange}
                  onRemove={handleRemove}
                  onToggleRole={handleToggleRole}
                />
              ))}
              {hasMore && (
                <div className="px-5 pt-2">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full py-2 text-xs font-semibold text-ocean hover:text-teal transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
