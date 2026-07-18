import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { followApi } from '@/api/followApi';
import { Loader2, UserPlus, Clock, UserCheck } from 'lucide-react';

// Instagram-style chained popups: profile → followers/following list → tap
// a row → land on that person's profile → tap their counts → keep
// browsing. Reused for both directions via `type`; each row's Follow
// button reuses the same request-based relationship model as the profile
// page itself (see followApi.getRelationshipState) — following here is
// never instant, consistent with the rest of the app.
export default function FollowListModal({ open, onOpenChange, uid, type, viewerUid }) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [relationships, setRelationships] = useState({});
  const [busyUid, setBusyUid] = useState(null);

  const fetchPage = useCallback(
    (targetUid, opts) => (type === 'followers' ? followApi.listFollowersPage(targetUid, opts) : followApi.listFollowingPage(targetUid, opts)),
    [type],
  );

  const loadRelationships = useCallback(async (rows) => {
    if (!viewerUid) return;
    const others = rows.filter((r) => r.uid !== viewerUid);
    const states = await Promise.all(others.map((r) => followApi.getRelationshipState(viewerUid, r.uid)));
    setRelationships((cur) => ({ ...cur, ...Object.fromEntries(others.map((r, i) => [r.uid, states[i]])) }));
  }, [viewerUid]);

  useEffect(() => {
    if (!open) return;
    setItems([]);
    setCursor(null);
    setHasMore(false);
    setRelationships({});
    setLoading(true);
    fetchPage(uid, {}).then((page) => {
      setItems(page.items);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
      loadRelationships(page.items);
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, uid, type]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const page = await fetchPage(uid, { cursor });
      setItems((cur) => [...cur, ...page.items]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
      loadRelationships(page.items);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFollow = async (rowUid) => {
    setBusyUid(rowUid);
    try {
      await followApi.sendRequest(viewerUid, rowUid);
      setRelationships((cur) => ({ ...cur, [rowUid]: 'requested' }));
    } finally {
      setBusyUid(null);
    }
  };

  const title = type === 'followers' ? 'Followers' : 'Following';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="font-body">{title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pb-2">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-charcoal/30" /></div>
          ) : items.length === 0 ? (
            <p className="text-sm text-charcoal/40 text-center py-10">
              {type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </p>
          ) : (
            <>
              {items.map((row) => (
                <div key={row.uid} className="flex items-center gap-3 px-5 py-2.5 hover:bg-sand/40 transition-colors">
                  <Link to={`/u/${row.uid}`} onClick={() => onOpenChange(false)} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ocean to-teal flex items-center justify-center overflow-hidden shrink-0">
                      {row.photoURL
                        ? <img src={row.photoURL} alt={row.displayName} className="w-full h-full object-cover" />
                        : <span className="text-white text-xs font-bold">{(row.displayName || '?')[0].toUpperCase()}</span>}
                    </div>
                    <span className="truncate text-sm font-medium text-charcoal">{row.displayName}</span>
                  </Link>
                  {row.uid === viewerUid ? (
                    <span className="text-xs text-charcoal/40 font-medium shrink-0">You</span>
                  ) : relationships[row.uid] === 'following' ? (
                    <span className="flex items-center gap-1 text-xs text-teal font-medium shrink-0"><UserCheck className="w-3.5 h-3.5" /> Following</span>
                  ) : relationships[row.uid] === 'requested' ? (
                    <span className="flex items-center gap-1 text-xs text-charcoal/40 font-medium shrink-0"><Clock className="w-3.5 h-3.5" /> Requested</span>
                  ) : (
                    <button
                      onClick={() => handleFollow(row.uid)}
                      disabled={busyUid === row.uid}
                      className="flex items-center gap-1 px-2.5 py-1 bg-ocean/10 text-ocean rounded-lg text-xs font-semibold hover:bg-ocean/20 transition-colors disabled:opacity-50 shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Follow
                    </button>
                  )}
                </div>
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
