import { collection, doc, getDocs, updateDoc, deleteDoc, query, orderBy, limit as fsLimit } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

// Firestore-backed replacement for the old Laravel /notifications endpoint.
// Most notification types here are created by the Worker as part of an
// atomic operation (follow accepted, reveal approved) — see Worker/src/
// routes/relationships.ts — a few originate client-side (see Firebase/
// firestore.rules' allow-listed types).
export const notificationsApi = {
  async list(uid) {
    const snap = await getDocs(query(
      collection(db, 'users', uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      fsLimit(50),
    ));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  markRead(uid, notificationId) {
    return updateDoc(doc(db, 'users', uid, 'notifications', notificationId), { read: true });
  },

  remove(uid, notificationId) {
    return deleteDoc(doc(db, 'users', uid, 'notifications', notificationId));
  },
};
