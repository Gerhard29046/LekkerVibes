import {
  collection, doc, getDoc, getDocs, deleteDoc, setDoc, updateDoc,
  query, where, serverTimestamp, getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { apiClient } from '@/api/apiClient';

// Following always requires the target's approval — see Firebase/
// firestore.rules and Worker/src/routes/relationships.ts. Deterministic
// request IDs (`${fromUid}_${toUid}`) both prevent duplicate requests and
// let the rules check "does an accepted request exist" without a query.
function requestId(fromUid, toUid) {
  return `${fromUid}_${toUid}`;
}

export const followApi = {
  async getRequestStatus(fromUid, toUid) {
    const snap = await getDoc(doc(db, 'followRequests', requestId(fromUid, toUid)));
    return snap.exists() ? snap.data() : null;
  },

  sendRequest(fromUid, toUid) {
    return setDoc(doc(db, 'followRequests', requestId(fromUid, toUid)), {
      fromUid, toUid, status: 'pending', createdAt: serverTimestamp(),
    });
  },

  // Re-request after a prior decline/cancel — same doc, status back to pending.
  reRequest(fromUid, toUid) {
    return updateDoc(doc(db, 'followRequests', requestId(fromUid, toUid)), {
      status: 'pending', createdAt: serverTimestamp(),
    });
  },

  cancelRequest(fromUid, toUid) {
    return updateDoc(doc(db, 'followRequests', requestId(fromUid, toUid)), {
      status: 'cancelled', respondedAt: serverTimestamp(),
    });
  },

  declineRequest(fromUid, toUid) {
    return updateDoc(doc(db, 'followRequests', requestId(fromUid, toUid)), {
      status: 'declined', respondedAt: serverTimestamp(),
    });
  },

  // Only the Worker can accept — it must atomically create both relationship
  // docs and a notification (see Worker/src/routes/relationships.ts).
  acceptRequest(requestId) {
    return apiClient.post(`/follow-requests/${requestId}/accept`);
  },

  async listIncomingRequests(uid) {
    const snap = await getDocs(query(
      collection(db, 'followRequests'),
      where('toUid', '==', uid),
      where('status', '==', 'pending'),
    ));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async listOutgoingRequests(uid) {
    const snap = await getDocs(query(
      collection(db, 'followRequests'),
      where('fromUid', '==', uid),
      where('status', '==', 'pending'),
    ));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async listFollowers(uid) {
    const snap = await getDocs(collection(db, 'users', uid, 'followers'));
    return snap.docs.map((d) => d.data());
  },

  async listFollowing(uid) {
    const snap = await getDocs(collection(db, 'users', uid, 'following'));
    return snap.docs.map((d) => d.data());
  },

  async followerCount(uid) {
    const snap = await getCountFromServer(collection(db, 'users', uid, 'followers'));
    return snap.data().count;
  },

  async followingCount(uid) {
    const snap = await getCountFromServer(collection(db, 'users', uid, 'following'));
    return snap.data().count;
  },

  async isFollowing(followerUid, targetUid) {
    const snap = await getDoc(doc(db, 'users', followerUid, 'following', targetUid));
    return snap.exists();
  },

  // Two independent, individually-authorized deletes rather than one atomic
  // op — see Firebase/firestore.rules for why that's an acceptable tradeoff
  // here (nothing security-sensitive depends on both succeeding together).
  async unfollow(followerUid, targetUid) {
    await Promise.all([
      deleteDoc(doc(db, 'users', followerUid, 'following', targetUid)),
      deleteDoc(doc(db, 'users', targetUid, 'followers', followerUid)),
    ]);
  },

  async removeFollower(ownerUid, followerUid) {
    await Promise.all([
      deleteDoc(doc(db, 'users', ownerUid, 'followers', followerUid)),
      deleteDoc(doc(db, 'users', followerUid, 'following', ownerUid)),
    ]);
  },

  // Used on the public-profile follow button to resolve current state in
  // one shot: 'none' | 'requested' | 'following' | 'incoming' (they follow you).
  async getRelationshipState(viewerUid, ownerUid) {
    const [following, outgoingReq] = await Promise.all([
      this.isFollowing(viewerUid, ownerUid),
      this.getRequestStatus(viewerUid, ownerUid),
    ]);
    if (following) return 'following';
    if (outgoingReq?.status === 'pending') return 'requested';
    return 'none';
  },
};
