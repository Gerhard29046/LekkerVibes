import { collection, doc, getDoc, addDoc, getDocs, deleteDoc, serverTimestamp, query, orderBy, limit as fsLimit } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

// Recent-activity feed. Each entry is self-authored by the acting user at
// the moment of the action (see call sites: join community, RSVP, save,
// mark visited) and carries its own visibility — see Firebase/
// firestore.rules. Defaults to 'followers' per the product spec.
export const activityApi = {
  async list(uid) {
    const snap = await getDocs(query(
      collection(db, 'users', uid, 'activity'),
      orderBy('createdAt', 'desc'),
      fsLimit(20),
    ));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  // type: 'joined_community' | 'created_event' | 'going_event' | 'saved_place' | 'visited_place' | 'uploaded_photo'
  // Honors the user's "record my activity at all" toggle (Settings → Privacy)
  // — silently skips instead of writing when they've turned it off.
  async record(uid, type, detail, visibility = 'followers') {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (userSnap.data()?.privacy?.activityFeedEnabled === false) return;
    return addDoc(collection(db, 'users', uid, 'activity'), {
      type, ...detail, visibility, createdAt: serverTimestamp(),
    });
  },

  remove(uid, activityId) {
    return deleteDoc(doc(db, 'users', uid, 'activity', activityId));
  },
};
