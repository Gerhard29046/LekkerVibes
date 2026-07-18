import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { communitiesApi } from '@/api/communitiesApi';
import { isOnline } from '@/lib/presence';
import { Loader2 } from 'lucide-react';

// Same paginate-not-fetch-everything popup pattern as FollowListModal, for
// a community's full member list (not just who's online) — reused for
// both "See all" under Members online and tapping the member count in
// the thread header.
export default function MemberListModal({ open, onOpenChange, communityId }) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!open) return;
    setItems([]);
    setCursor(null);
    setHasMore(false);
    setLoading(true);
    communitiesApi.membersPage(communityId, {}).then((page) => {
      setItems(page.items);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    }).finally(() => setLoading(false));
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
              {items.map((row) => (
                <Link
                  key={row.uid}
                  to={`/u/${row.uid}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 px-5 py-2.5 hover:bg-sand/40 transition-colors"
                >
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
                  {row.role === 'organiser' && (
                    <span className="text-[11px] font-semibold text-ocean shrink-0">Organiser</span>
                  )}
                </Link>
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
