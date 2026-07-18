import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Link2, Check, Loader2, UserPlus } from 'lucide-react';
import { profileApi } from '@/api/profileApi';
import { notificationsApi } from '@/api/notificationsApi';

// "Search users" never silently adds anyone — it sends a community_invite
// notification the recipient accepts themselves (see
// notificationsApi.notifyCommunityInvite), consistent with every other
// cross-user relationship in this app (follow requests, social-link
// reveals). The generated link is the other, consent-free path — anyone
// holding it can join on their own terms.
export default function InviteMembersModal({ open, onOpenChange, community, currentUser }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [invitedUids, setInvitedUids] = useState([]);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setResults([]);
      setInvitedUids([]);
    }
  }, [open]);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const timeout = setTimeout(() => {
      setSearching(true);
      profileApi.searchByName(search).then(setResults).finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleInvite = async (targetUid) => {
    await notificationsApi.notifyCommunityInvite(currentUser.uid, targetUid, community);
    setInvitedUids((cur) => [...cur, targetUid]);
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/club/${community.id}${community.joinPolicy === 'invite_only' ? `?token=${community.inviteToken}` : ''}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-body">Invite to {community.name}</DialogTitle>
        </DialogHeader>

        <button
          onClick={handleCopyLink}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-sand text-sm font-semibold text-ocean hover:bg-sand/40 transition-colors"
        >
          {linkCopied ? <Check className="w-4 h-4 text-leaf" /> : <Link2 className="w-4 h-4" />}
          {linkCopied ? 'Copied!' : 'Copy invite link'}
        </button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people by name..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-sand bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30"
          />
        </div>

        <div className="max-h-64 overflow-y-auto -mx-1">
          {searching ? (
            <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-charcoal/30" /></div>
          ) : results.length === 0 && search.trim() ? (
            <p className="text-sm text-charcoal/40 text-center py-6">No one found.</p>
          ) : (
            results.map((r) => {
              const invited = invitedUids.includes(r.uid);
              return (
                <div key={r.uid} className="flex items-center gap-3 px-1 py-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ocean to-teal flex items-center justify-center overflow-hidden shrink-0">
                    {r.photoURL
                      ? <img src={r.photoURL} alt={r.displayName} className="w-full h-full object-cover" />
                      : <span className="text-white text-xs font-bold">{(r.displayName || '?')[0].toUpperCase()}</span>}
                  </div>
                  <span className="text-sm font-medium text-charcoal flex-1 truncate">{r.displayName}</span>
                  <button
                    onClick={() => handleInvite(r.uid)}
                    disabled={invited}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                      invited ? 'bg-leaf/10 text-leaf' : 'bg-ocean/10 text-ocean hover:bg-ocean/20'
                    }`}
                  >
                    {invited ? <><Check className="w-3.5 h-3.5" /> Invited</> : <><UserPlus className="w-3.5 h-3.5" /> Invite</>}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
