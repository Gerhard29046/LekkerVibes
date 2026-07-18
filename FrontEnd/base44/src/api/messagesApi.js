import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

// Firestore-backed replacement for the old Laravel REST messaging API.
// Function names are kept the same as the pre-migration module so call
// sites elsewhere don't need to change, per the project's "one api/<domain>
// module per resource" convention.

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

  // Firestore's onSnapshot listener replaces polling entirely — there's no
  // per-user "last read" field in this pass's narrow data model (see
  // Firebase/firestore.rules), so this is a no-op kept only so GroupChat.jsx
  // doesn't need a special case for it.
  markConversationRead: async () => {},

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
      senderId: sender.uid,
      senderName: sender.displayName || sender.email || 'Member',
      body,
      isDeleted: false,
      isSystem: false,
      createdAt: serverTimestamp(),
    });
  },

  // Soft-delete only — matches Firebase/firestore.rules, which lets a
  // sender delete their own message but never hard-delete it.
  remove: async (conversationId, messageId) => {
    await updateDoc(doc(db, 'conversations', conversationId, 'messages', messageId), {
      isDeleted: true,
      body: null,
    });
  },
};
