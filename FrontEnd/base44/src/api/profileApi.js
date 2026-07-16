import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

// Fields a user is allowed to write to their own profile. `role` and
// `isVerified` are excluded here too (defense in depth — Firestore rules
// already reject them, see Firebase/firestore.rules).
const EDITABLE_FIELDS = ['displayName', 'bio', 'city', 'interests', 'photoURL', 'coverURL'];

function pickEditable(data) {
  return Object.fromEntries(Object.entries(data).filter(([key]) => EDITABLE_FIELDS.includes(key)));
}

export const profileApi = {
  async get(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  update(uid, data) {
    return updateDoc(doc(db, 'users', uid), { ...pickEditable(data), updatedAt: serverTimestamp() });
  },

  updateNotificationPrefs(uid, notificationPrefs) {
    return updateDoc(doc(db, 'users', uid), { notificationPrefs, updatedAt: serverTimestamp() });
  },

  updatePrivacy(uid, privacy) {
    return updateDoc(doc(db, 'users', uid), { privacy, updatedAt: serverTimestamp() });
  },
};
