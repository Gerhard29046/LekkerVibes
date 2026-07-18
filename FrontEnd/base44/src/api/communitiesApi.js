import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as fsLimit,
  startAfter,
  writeBatch,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

async function memberCount(communityId) {
  const snap = await getCountFromServer(collection(db, 'communities', communityId, 'members'));
  return snap.data().count;
}

async function membershipFor(communityId, uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'communities', communityId, 'members', uid));
  return snap.exists() ? snap.data() : null;
}

export const communitiesApi = {
  // { city, search, categories } — `categories` (an array, see
  // COMMUNITY_CATEGORY_GROUPS) is filtered client-side alongside `search`
  // rather than a Firestore `in` clause, since combining that with the
  // existing orderBy('createdAt') would need a composite index for what's
  // a rarely-changing, low-volume browse list.
  async list({ city, search, categories } = {}) {
    const clauses = city ? [where('city', '==', city)] : [];
    const q = query(collection(db, 'communities'), ...clauses, orderBy('createdAt', 'desc'), fsLimit(50));
    const snap = await getDocs(q);
    let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (categories?.length) {
      items = items.filter((c) => categories.includes(c.category));
    }
    if (search) {
      const needle = search.toLowerCase();
      items = items.filter((c) =>
        c.name?.toLowerCase().includes(needle) || c.description?.toLowerCase().includes(needle)
      );
    }
    const counts = await Promise.all(items.map((c) => memberCount(c.id)));
    return items.map((c, i) => ({ ...c, memberCount: counts[i] }));
  },

  async get(id, currentUid) {
    const snap = await getDoc(doc(db, 'communities', id));
    if (!snap.exists()) return null;
    const [count, membership, owner] = await Promise.all([
      memberCount(id),
      membershipFor(id, currentUid),
      getDoc(doc(db, 'users', snap.data().ownerId)),
    ]);
    return {
      id: snap.id,
      ...snap.data(),
      memberCount: count,
      myMembership: membership,
      ownerName: owner.exists() ? owner.data().displayName : 'Organiser',
    };
  },

  // { name, description, city, category, rules, imageURL, joinPolicy }
  //
  // joinPolicy: 'open' (default — anyone can self-join) | 'invite_only'
  // (self-join is only accepted if the joiner's membership write carries
  // the matching `inviteToken` — see Firebase/firestore.rules; unlike the
  // events invite-link case this is a plain write-time check, not a read
  // problem, so no Worker round-trip is needed).
  //
  // This is deliberately NOT one atomic writeBatch: the member/conversation
  // docs' security rules need to `get()` the community doc to confirm
  // `ownerId == request.auth.uid`, and Firestore rules evaluate a batch's
  // writes against the state at the START of the batch — they can't see a
  // sibling write's effect from later in the same batch. The community doc
  // must actually exist first, as a separately-committed write, or the
  // member/conversation creates are rejected with PERMISSION_DENIED
  // (confirmed via a live REST test against the deployed rules). If the
  // second step fails, the orphaned community doc is cleaned up rather than
  // left half-created.
  async create(data, currentUser) {
    const communityRef = doc(collection(db, 'communities'));
    const joinPolicy = data.joinPolicy === 'invite_only' ? 'invite_only' : 'open';
    const inviteToken = joinPolicy === 'invite_only' ? crypto.randomUUID() : null;

    await setDoc(communityRef, {
      name: data.name,
      description: data.description || '',
      city: data.city,
      category: data.category || null,
      rules: data.rules || '',
      imageURL: data.imageURL || null,
      joinPolicy,
      inviteToken,
      status: 'active',
      ownerId: currentUser.uid,
      ownerName: currentUser.displayName || currentUser.email || 'Organiser',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'communities', communityRef.id, 'members', currentUser.uid), {
        uid: currentUser.uid,
        role: 'organiser',
        joinedAt: serverTimestamp(),
      });
      // Paired chat conversation — conversationId == communityId, see
      // Firebase/firestore.rules for why this needs no separate memberIds sync.
      batch.set(doc(db, 'conversations', communityRef.id), {
        type: 'community',
        communityId: communityRef.id,
        createdAt: serverTimestamp(),
      });
      await batch.commit();
    } catch (err) {
      await deleteDoc(communityRef).catch(() => {});
      throw err;
    }

    return { id: communityRef.id };
  },

  update(id, data) {
    return updateDoc(doc(db, 'communities', id), { ...data, updatedAt: serverTimestamp() });
  },

  remove(id) {
    return deleteDoc(doc(db, 'communities', id));
  },

  // `token` is only meaningful (and only checked, by the rule) for
  // invite_only communities — harmless to omit for open ones.
  join(id, currentUser, token) {
    return setDoc(doc(db, 'communities', id, 'members', currentUser.uid), {
      uid: currentUser.uid,
      role: 'member',
      joinedAt: serverTimestamp(),
      ...(token ? { joinToken: token } : {}),
    });
  },

  leave(id, uid) {
    return deleteDoc(doc(db, 'communities', id, 'members', uid));
  },

  // Owner/organiser removing someone else — same underlying delete as
  // leave(), just authorized differently (see Firebase/firestore.rules).
  // Doesn't retroactively touch their past messages, only future access.
  removeMember(id, targetUid) {
    return deleteDoc(doc(db, 'communities', id, 'members', targetUid));
  },

  members(id) {
    return getDocs(collection(db, 'communities', id, 'members')).then((snap) =>
      snap.docs.map((d) => d.data())
    );
  },

  // Paginated + enriched with displayName/photoURL/lastActiveAt — for the
  // Messages page's "Members online" popup, reusing the same paginate-
  // rather-than-fetch-everything shape as followApi's list popups.
  async membersPage(communityId, { pageSize = 20, cursor = null } = {}) {
    const constraints = [orderBy('joinedAt', 'desc'), ...(cursor ? [startAfter(cursor)] : []), fsLimit(pageSize)];
    const snap = await getDocs(query(collection(db, 'communities', communityId, 'members'), ...constraints));
    const users = await Promise.all(snap.docs.map((d) => getDoc(doc(db, 'users', d.id))));
    return {
      items: snap.docs.map((d, i) => ({
        uid: d.id,
        role: d.data().role,
        displayName: users[i].exists() ? users[i].data().displayName : 'Member',
        photoURL: users[i].exists() ? users[i].data().photoURL || null : null,
        lastActiveAt: users[i].exists() ? users[i].data().lastActiveAt || null : null,
      })),
      cursor: snap.docs[snap.docs.length - 1] || null,
      hasMore: snap.docs.length === pageSize,
    };
  },

  // Only an existing organiser (or the owner, enforced by rules) can call this.
  setRole(id, targetUid, role) {
    return updateDoc(doc(db, 'communities', id, 'members', targetUid), { role });
  },

  // Per-user community mute — self-owned, same shape as followedGroups.
  // Doesn't currently suppress anything server-side (no automatic FCM
  // send is wired up yet — see CLAUDE.md), it's the persisted preference
  // the Messages page's mute toggle reads/writes, ready for whenever a
  // Worker Cron/trigger does start sending message notifications.
  async isMuted(uid, communityId) {
    const snap = await getDoc(doc(db, 'users', uid, 'mutedCommunities', communityId));
    return snap.exists();
  },
  muteNotifications(uid, communityId) {
    return setDoc(doc(db, 'users', uid, 'mutedCommunities', communityId), { mutedAt: serverTimestamp() });
  },
  unmuteNotifications(uid, communityId) {
    return deleteDoc(doc(db, 'users', uid, 'mutedCommunities', communityId));
  },

  // Communities the given uid belongs to — used on the profile page.
  async myMemberships(uid) {
    if (!uid) return [];
    const memberDocs = await getDocs(query(collectionGroup(db, 'members'), where('uid', '==', uid)));
    const communities = await Promise.all(
      memberDocs.docs.map(async (memberDoc) => {
        const communityRef = memberDoc.ref.parent.parent;
        const communitySnap = await getDoc(communityRef);
        return communitySnap.exists()
          ? { id: communitySnap.id, ...communitySnap.data(), myRole: memberDoc.data().role }
          : null;
      })
    );
    return communities.filter(Boolean);
  },
};
