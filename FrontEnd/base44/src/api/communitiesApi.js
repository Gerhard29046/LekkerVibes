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
  // { city, search }
  async list({ city, search } = {}) {
    const clauses = city ? [where('city', '==', city)] : [];
    const q = query(collection(db, 'communities'), ...clauses, orderBy('createdAt', 'desc'), fsLimit(50));
    const snap = await getDocs(q);
    let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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

  // { name, description, city, category, rules, imageURL }
  async create(data, currentUser) {
    const communityRef = doc(collection(db, 'communities'));
    const batch = writeBatch(db);

    batch.set(communityRef, {
      name: data.name,
      description: data.description || '',
      city: data.city,
      category: data.category || null,
      rules: data.rules || '',
      imageURL: data.imageURL || null,
      status: 'active',
      ownerId: currentUser.uid,
      ownerName: currentUser.displayName || currentUser.email || 'Organiser',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
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
    return { id: communityRef.id };
  },

  update(id, data) {
    return updateDoc(doc(db, 'communities', id), { ...data, updatedAt: serverTimestamp() });
  },

  remove(id) {
    return deleteDoc(doc(db, 'communities', id));
  },

  join(id, currentUser) {
    return setDoc(doc(db, 'communities', id, 'members', currentUser.uid), {
      uid: currentUser.uid,
      role: 'member',
      joinedAt: serverTimestamp(),
    });
  },

  leave(id, uid) {
    return deleteDoc(doc(db, 'communities', id, 'members', uid));
  },

  members(id) {
    return getDocs(collection(db, 'communities', id, 'members')).then((snap) =>
      snap.docs.map((d) => d.data())
    );
  },

  // Only an existing organiser (or the owner, enforced by rules) can call this.
  setRole(id, targetUid, role) {
    return updateDoc(doc(db, 'communities', id, 'members', targetUid), { role });
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
