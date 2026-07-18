import {
  collection,
  doc,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getCountFromServer,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

// Firestore-backed replacement for the old Laravel REST messaging API.
// Function names are kept the same as the pre-migration module so call
// sites elsewhere don't need to change, per the project's "one api/<domain>
// module per resource" convention.
//
// Message shape (existing senderId/senderName/body field names kept as-is
// rather than renamed to match the Messages-page brief's illustrative
// senderUid/senderDisplayName/text — a rename would mean dual-reading old
// and new field names everywhere this collection is already rendered, for
// zero functional benefit):
//   type: 'text' | 'image' | 'event'
//   senderId, senderName, senderPhotoURL
//   body        // for type 'text'
//   imageURL    // for type 'image'
//   eventId     // for type 'event' — the message is a live pointer, not a
//               // frozen snapshot; renderers re-fetch events/{eventId}.
//   reactions   // { '❤️': [uid, ...], '🔥': [uid, ...], '👍': [uid, ...] }
//   isDeleted, isSystem, createdAt
export const messagesApi = {
  // Enriches the raw conversation doc with the `.community`/`.event`
  // sub-object GroupChat.jsx's header/back-link expects (name/title only —
  // this is a chat header, not a place to leak the full parent document).
  conversation: async (conversationId) => {
    const snap = await getDoc(doc(db, 'conversations', conversationId));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (data.type === 'community' && data.communityId) {
      const communitySnap = await getDoc(doc(db, 'communities', data.communityId));
      return {
        id: snap.id, ...data,
        community: communitySnap.exists() ? { id: communitySnap.id, name: communitySnap.data().name } : null,
      };
    }
    if (data.type === 'event' && data.eventId) {
      const eventSnap = await getDoc(doc(db, 'events', data.eventId));
      return {
        id: snap.id, ...data,
        event: eventSnap.exists() ? { id: eventSnap.id, title: eventSnap.data().title } : null,
      };
    }
    return { id: snap.id, ...data };
  },

  // Per-user read marker, used for the community switcher's unread badges.
  // Self-only doc, not part of the conversation itself, so nothing needs
  // to fan out to other members when it's written.
  markConversationRead: async (conversationId, uid) => {
    if (!uid) return;
    await setDoc(doc(db, 'users', uid, 'conversationReads', conversationId), {
      lastReadAt: serverTimestamp(),
    });
  },

  // A single range filter on one field — no composite index needed. Counts
  // everything after the user's last-read marker, or the whole thread if
  // they've never opened it.
  async getUnreadCount(conversationId, uid) {
    if (!uid) return 0;
    const readSnap = await getDoc(doc(db, 'users', uid, 'conversationReads', conversationId));
    const since = readSnap.exists() ? readSnap.data().lastReadAt : null;
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = since ? query(messagesRef, where('createdAt', '>', since)) : messagesRef;
    const snap = await getCountFromServer(q);
    return snap.data().count;
  },

  // Returns an unsubscribe function. `onChange` is called with the full,
  // ordered message list every time it changes — no manual merging needed.
  subscribeToMessages: (conversationId, onChange) => {
    const messagesQuery = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
    );
    return onSnapshot(messagesQuery, (snapshot) => {
      onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  },

  send: async (conversationId, body, sender) => {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    return addDoc(messagesRef, {
      type: 'text',
      senderId: sender.uid,
      senderName: sender.displayName || sender.email || 'Member',
      senderPhotoURL: sender.photoURL || null,
      body,
      imageURL: null,
      eventId: null,
      reactions: {},
      isDeleted: false,
      isSystem: false,
      createdAt: serverTimestamp(),
    });
  },

  sendImage: async (conversationId, imageURL, sender) => {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    return addDoc(messagesRef, {
      type: 'image',
      senderId: sender.uid,
      senderName: sender.displayName || sender.email || 'Member',
      senderPhotoURL: sender.photoURL || null,
      body: null,
      imageURL,
      eventId: null,
      reactions: {},
      isDeleted: false,
      isSystem: false,
      createdAt: serverTimestamp(),
    });
  },

  // Auto-posted when someone hosts a Discover place into this group as an
  // activity (see eventsApi.create()) — never composed manually, so it's
  // not exposed as a general "send" variant callable from the composer.
  postEventCard: async (conversationId, eventId, host) => {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    return addDoc(messagesRef, {
      type: 'event',
      senderId: host.uid,
      senderName: host.displayName || host.email || 'Member',
      senderPhotoURL: host.photoURL || null,
      body: null,
      imageURL: null,
      eventId,
      reactions: {},
      isDeleted: false,
      isSystem: false,
      createdAt: serverTimestamp(),
    });
  },

  // Fixed v1 reaction set (❤️ 🔥 👍) — toggles the caller's own uid in/out
  // of that emoji's array. arrayUnion/arrayRemove make the actual write
  // safe even against a stale read of `current` (worst case under a fast
  // double-tap: one no-op toggle, never a corrupted array).
  async toggleReaction(conversationId, messageId, emoji, uid) {
    const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;
    const current = snap.data().reactions?.[emoji] || [];
    await updateDoc(msgRef, {
      [`reactions.${emoji}`]: current.includes(uid) ? arrayRemove(uid) : arrayUnion(uid),
    });
  },

  // Soft-delete only — matches Firebase/firestore.rules, which lets a
  // sender delete their own message but never hard-delete it.
  remove: async (conversationId, messageId) => {
    await updateDoc(doc(db, 'conversations', conversationId, 'messages', messageId), {
      isDeleted: true,
      body: null,
      imageURL: null,
    });
  },
};
