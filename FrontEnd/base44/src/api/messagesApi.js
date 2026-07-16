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
  conversation: async (conversationId) => {
    const snap = await getDoc(doc(db, 'conversations', conversationId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
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
