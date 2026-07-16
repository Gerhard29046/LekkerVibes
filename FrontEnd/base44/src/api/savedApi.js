import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

// Firestore-backed replacement for the old Laravel /saved endpoint. Two
// self-only subcollections under users/{uid}: `saved` (bookmarks) and
// `plans` ("add to plans" / intent-to-attend) — see Firebase/firestore.rules.
// `item` is a small denormalized snapshot (name/photoUrl/address/etc.) so
// the saved/plans list can render without re-querying the source (a
// LekkerVibes event doc or an external Google Place).
function subcollection(uid, kind) {
  return collection(db, 'users', uid, kind);
}

function makeStore(kind) {
  return {
    list: async (uid) => {
      const snap = await getDocs(subcollection(uid, kind));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
    add: (uid, itemId, item) =>
      setDoc(doc(db, 'users', uid, kind, itemId), { ...item, savedAt: serverTimestamp() }),
    remove: (uid, itemId) => deleteDoc(doc(db, 'users', uid, kind, itemId)),
    has: async (uid, itemId) => (await getDoc(doc(db, 'users', uid, kind, itemId))).exists(),
  };
}

export const savedApi = makeStore('saved');
export const plansApi = makeStore('plans');
