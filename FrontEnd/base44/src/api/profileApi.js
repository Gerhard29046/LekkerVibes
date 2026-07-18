import { doc, getDoc, getDocs, collection, query, where, orderBy, limit as fsLimit, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

// Fields a user is allowed to write to their own profile. `role` and
// `isVerified` are excluded here too (defense in depth — Firestore rules
// already reject them, see Firebase/firestore.rules). `photoVerified` is
// self-settable (see AuthContext note: it's a "captured live" UX signal,
// not a trust claim).
const EDITABLE_FIELDS = [
  'displayName', 'bio', 'city', 'interests', 'photoURL', 'coverURL', 'photoVerified',
  'username', 'work', 'education', 'languages', 'profileTheme', 'chipStyle',
  'hasInstagram', 'hasFacebook', 'hasStrava', 'hasWebsite',
  'phone', 'dateOfBirth', 'preferredLanguage',
];

function pickEditable(data) {
  return Object.fromEntries(Object.entries(data).filter(([key]) => EDITABLE_FIELDS.includes(key)));
}

// Recommended defaults from the product spec — applied to every new profile
// at first sign-in (see AuthContext.jsx) so privacy is never silently unset
// (Firestore rules fail closed on an unset `privacy` map, which is safe but
// means nobody's followers/following list is readable until this exists).
export const DEFAULT_PRIVACY = {
  profileVisibility: 'everyone',
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
  followPermission: 'requests_open',
  connectionPermission: 'anyone',
  searchableProfile: true,
  organiserRecommendations: true,
  showExactLocation: false,
};

export const profileApi = {
  // Prefix match on displayName — `users/{uid}` is broadly readable
  // (see Firebase/firestore.rules), so a single-field range query needs
  // no composite index. `searchableProfile: false` is filtered client
  // -side after fetching rather than as a query equality filter, since
  // combining that with the range filter above would need one.
  async searchByName(search, max = 10) {
    const needle = search?.trim();
    if (!needle) return [];
    const snap = await getDocs(query(
      collection(db, 'users'),
      orderBy('displayName'),
      where('displayName', '>=', needle),
      where('displayName', '<=', needle + ''),
      fsLimit(max * 2),
    ));
    return snap.docs
      .map((d) => ({ uid: d.id, ...d.data() }))
      .filter((u) => u.privacy?.searchableProfile !== false)
      .slice(0, max);
  },

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

  updateMessagePrefs(uid, messagePrefs) {
    return updateDoc(doc(db, 'users', uid), { messagePrefs, updatedAt: serverTimestamp() });
  },

  updateCommunityPrefs(uid, communityPrefs) {
    return updateDoc(doc(db, 'users', uid), { communityPrefs, updatedAt: serverTimestamp() });
  },

  updateGroupFollowPrefs(uid, groupFollowPrefs) {
    return updateDoc(doc(db, 'users', uid), { groupFollowPrefs, updatedAt: serverTimestamp() });
  },

  updateDiscoveryPrefs(uid, discoveryPrefs) {
    return updateDoc(doc(db, 'users', uid), { discoveryPrefs, updatedAt: serverTimestamp() });
  },

  updateLocationPrefs(uid, locationPrefs) {
    return updateDoc(doc(db, 'users', uid), { locationPrefs, updatedAt: serverTimestamp() });
  },

  updateAccessibilityPrefs(uid, accessibilityPrefs) {
    return updateDoc(doc(db, 'users', uid), { accessibilityPrefs, updatedAt: serverTimestamp() });
  },

  requestDataExport(uid) {
    return updateDoc(doc(db, 'users', uid), { dataExportRequested: true, dataExportRequestedAt: serverTimestamp() });
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
