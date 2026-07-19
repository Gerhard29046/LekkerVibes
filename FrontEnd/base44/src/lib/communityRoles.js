// Single source of truth for "what is this person's role in this
// community" — every screen that shows admin UI (community detail, the
// Messages page and its header/composer/member popup, own-profile
// badges) resolves through these, rather than each recomputing its own
// version of the same check. Mirrors Firebase/firestore.rules exactly:
// the actual enforcement lives there, this is the client-side read of
// the same members-collection source of truth so the UI agrees with it.
//
// A role is resolved from two primitives every screen already has: the
// community's `ownerId` field, and the target uid's own member-doc
// `role` value ('owner' | 'moderator' | 'member' | legacy 'organiser').
// 'organiser' is a synonym for 'moderator' kept for communities created
// before the role model was named explicitly — see communitiesApi.create().
export function resolveCommunityRole(ownerId, uid, memberRole) {
  if (!uid) return null;
  if (ownerId && ownerId === uid) return 'owner';
  if (memberRole === 'moderator' || memberRole === 'organiser') return 'moderator';
  if (memberRole) return 'member';
  return null;
}

// Shared "admin-tier" actions: add member, remove a plain member, post
// an announcement, pin/unpin a message. Both owner and moderator get these.
export function isCommunityAdmin(role) {
  return role === 'owner' || role === 'moderator';
}

// Owner-only actions: editing core community details (name/description/
// category/cover/joinPolicy/rules/cta*), promoting/demoting moderators,
// removing another moderator.
export function isCommunityOwner(role) {
  return role === 'owner';
}
