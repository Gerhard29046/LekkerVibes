import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

// A visited place is only ever recorded from an explicit user action (Mark
// as visited / confirm event attendance) — never inferred from location,
// search, or map-opening. See Firebase/firestore.rules for the `source`
// allow-list this is checked against.
export const visitedPlacesApi = {
  async list(uid) {
    const snap = await getDocs(collection(db, 'users', uid, 'visitedPlaces'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async has(uid, placeId) {
    const snap = await getDoc(doc(db, 'users', uid, 'visitedPlaces', placeId));
    return snap.exists();
  },

  // { placeId, placeName, broadArea, source: 'user_confirmed'|'event_attendance', visibility }
  markVisited(uid, item) {
    return setDoc(doc(db, 'users', uid, 'visitedPlaces', item.placeId), {
      ...item,
      visibility: item.visibility || 'private',
      visitedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  },

  unmark(uid, placeId) {
    return deleteDoc(doc(db, 'users', uid, 'visitedPlaces', placeId));
  },
};
