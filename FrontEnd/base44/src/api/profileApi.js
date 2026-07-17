import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

// Fields a user is allowed to write to their own profile. `role` and
// `isVerified` are excluded here too (defense in depth — Firestore rules
// already reject them, see Firebase/firestore.rules). `photoVerified` is
// self-settable (see AuthContext note: it's a "captured live" UX signal,
// not a trust claim).
const EDITABLE_FIELDS = [
  'displayName', 'bio', 'city', 'interests', 'photoURL', 'coverURL', 'photoVerified',
  'username', 'work', 'education', 'languages', 'profileTheme',
  'hasInstagram', 'hasFacebook', 'hasStrava', 'hasWebsite',
];

function pickEditable(data) {
  return Object.fromEntries(Object.entries(data).filter(([key]) => EDITABLE_FIELDS.includes(key)));
}

// Recommended defaults from the product spec — applied to every new profile
// at first sign-in (see AuthContext.jsx) so privacy is never silently unset
// (Firestore rules fail closed on an unset `privacy` map, which is safe but
// means nobody's followers/following list is readable until this exists).
export const DEFAULT_PRIVACY = {
  cityVisibility: 'everyone',
  communitiesVisibility: 'followers',
  eventsVisibility: 'followers',
  eventsOrganisedVisibility: 'everyone',
  savedVisibility: 'private',
  visitedVisibility: 'private',
  activityVisibility: 'followers',
  photosVisibility: 'followers',
  followersVisibility: 'followers',
  followingVisibility: 'followers',
  workVisibility: 'everyone',
  educationVisibility: 'everyone',
  languagesVisibility: 'everyone',
  activityFeedEnabled: true,
};

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

  // Always pass the FULL privacy object (read current, merge locally, then
  // call this) — this replaces the whole `privacy` map, not a deep merge.
  updatePrivacy(uid, privacy) {
    return updateDoc(doc(db, 'users', uid), { privacy, updatedAt: serverTimestamp() });
  },

  ensureDefaultPrivacy(uid) {
    return setDoc(doc(db, 'users', uid), { privacy: DEFAULT_PRIVACY }, { merge: true });
  },

  // Username uniqueness rides entirely on Firestore's own create-fails-if-
  // exists semantics (see Firebase/firestore.rules) — no read-then-write
  // race, since the create itself is the atomic uniqueness check.
  async claimUsername(uid, username, previousUsername) {
    await setDoc(doc(db, 'usernames', username), { uid });
    if (previousUsername && previousUsername !== username) {
      await deleteDoc(doc(db, 'usernames', previousUsername)).catch(() => {});
    }
    await updateDoc(doc(db, 'users', uid), { username, updatedAt: serverTimestamp() });
  },

  async isUsernameAvailable(username) {
    const snap = await getDoc(doc(db, 'usernames', username));
    return !snap.exists();
  },
};
