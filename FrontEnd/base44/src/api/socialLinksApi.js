import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { apiClient } from '@/api/apiClient';

export const PLATFORMS = ['instagram', 'facebook', 'strava', 'website'];

const DOMAIN_HINT = {
  instagram: 'https://instagram.com/yourname',
  facebook: 'https://facebook.com/yourname',
  strava: 'https://strava.com/athletes/yourid',
  website: 'https://yoursite.com',
};

export const socialLinksApi = {
  domainHint: (platform) => DOMAIN_HINT[platform],

  // Owner reading their own links, or a viewer reading one they've been
  // granted — Firebase/firestore.rules enforces per-platform access, this
  // just surfaces a clean 'not-granted' result instead of throwing.
  async get(uid, platform) {
    try {
      const snap = await getDoc(doc(db, 'userSocialLinks', uid, 'platforms', platform));
      return snap.exists() ? snap.data().url : null;
    } catch {
      return null;
    }
  },

  set(uid, platform, url) {
    return setDoc(doc(db, 'userSocialLinks', uid, 'platforms', platform), {
      url, updatedAt: serverTimestamp(),
    });
  },

  remove(uid, platform) {
    return deleteDoc(doc(db, 'userSocialLinks', uid, 'platforms', platform));
  },

  // Reveal-request flow
  requestId: (requesterUid, ownerUid) => `${requesterUid}_${ownerUid}`,

  async getRevealRequestStatus(requesterUid, ownerUid) {
    const snap = await getDoc(doc(db, 'socialRevealRequests', `${requesterUid}_${ownerUid}`));
    return snap.exists() ? snap.data() : null;
  },

  requestReveal(requesterUid, ownerUid, requestedPlatforms) {
    return setDoc(doc(db, 'socialRevealRequests', `${requesterUid}_${ownerUid}`), {
      requesterUid, ownerUid, requestedPlatforms, status: 'pending', createdAt: serverTimestamp(),
    });
  },

  declineReveal(requesterUid, ownerUid) {
    return setDoc(doc(db, 'socialRevealRequests', `${requesterUid}_${ownerUid}`), {
      status: 'declined', respondedAt: serverTimestamp(),
    }, { merge: true });
  },

  // Only the Worker can approve — it must atomically create the grant with
  // exactly the approved platform list and notify the requester.
  acceptReveal(requestId, platforms) {
    return apiClient.post(`/social-reveal-requests/${requestId}/accept`, { platforms });
  },

  async getGrant(ownerUid, viewerUid) {
    const snap = await getDoc(doc(db, 'socialAccess', ownerUid, 'grants', viewerUid));
    return snap.exists() ? snap.data() : null;
  },

  revokeGrant(ownerUid, viewerUid) {
    return deleteDoc(doc(db, 'socialAccess', ownerUid, 'grants', viewerUid));
  },
};
