import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, serverTimestamp, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

// "Following" a community/group — a lightweight, no-approval subscription
// for updates, distinct from actively joining it (communitiesApi.join).
// See Firebase/firestore.rules for why this needs no Worker/approval flow,
// unlike following a person.
export const groupFollowApi = {
  async isFollowing(uid, communityId) {
    const snap = await getDoc(doc(db, 'users', uid, 'followedGroups', communityId));
    return snap.exists();
  },

  async follow(uid, communityId) {
    await Promise.all([
      setDoc(doc(db, 'communities', communityId, 'followers', uid), { uid, followedAt: serverTimestamp() }),
      setDoc(doc(db, 'users', uid, 'followedGroups', communityId), { communityId, notify: true, followedAt: serverTimestamp() }),
    ]);
  },

  async unfollow(uid, communityId) {
    await Promise.all([
      deleteDoc(doc(db, 'communities', communityId, 'followers', uid)),
      deleteDoc(doc(db, 'users', uid, 'followedGroups', communityId)),
    ]);
  },

  async setNotify(uid, communityId, notify) {
    await setDoc(doc(db, 'users', uid, 'followedGroups', communityId), { notify }, { merge: true });
  },

  async followerCount(communityId) {
    const snap = await getCountFromServer(collection(db, 'communities', communityId, 'followers'));
    return snap.data().count;
  },

  // Communities the given uid follows (not necessarily joined) — used on
  // the profile's "Following groups" tab.
  async listFollowedGroups(uid) {
    const snap = await getDocs(collection(db, 'users', uid, 'followedGroups'));
    const entries = snap.docs.map((d) => ({ communityId: d.id, ...d.data() }));
    const communities = await Promise.all(entries.map(async (entry) => {
      const communitySnap = await getDoc(doc(db, 'communities', entry.communityId));
      return communitySnap.exists() ? { id: communitySnap.id, ...communitySnap.data(), notify: entry.notify } : null;
    }));
    return communities.filter(Boolean);
  },
};
