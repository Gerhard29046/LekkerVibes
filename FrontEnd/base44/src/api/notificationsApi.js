import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit as fsLimit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

// Firestore-backed replacement for the old Laravel /notifications endpoint.
// Most notification types here are created by the Worker as part of an
// atomic operation (follow accepted, reveal approved) — see Worker/src/
// routes/relationships.ts — a few originate client-side (see Firebase/
// firestore.rules' allow-listed types), including the three below.
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

  async markAllRead(uid) {
    const snap = await getDocs(query(
      collection(db, 'users', uid, 'notifications'),
      where('read', '==', false),
    ));
    await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { read: true })));
  },

  remove(uid, notificationId) {
    return deleteDoc(doc(db, 'users', uid, 'notifications', notificationId));
  },

  // Someone joined (or waitlisted for) your event. Deterministic id so a
  // repeat join (leave-then-rejoin) replaces rather than piles up.
  notifyEventJoin(hostUid, joiner, event) {
    if (hostUid === joiner.uid) return Promise.resolve();
    return setDoc(doc(db, 'users', hostUid, 'notifications', `event_join_${event.id}_${joiner.uid}`), {
      type: 'event_join',
      fromUid: joiner.uid,
      targetId: event.id,
      eventTitle: event.title,
      read: false,
      createdAt: serverTimestamp(),
    }).catch(() => {});
  },

  // Fired on cancellation only, not every field edit — see eventsApi.cancel().
  async notifyEventCancelled(attendeeUids, host, event) {
    await Promise.all(
      attendeeUids.filter((uid) => uid !== host.uid).map((uid) =>
        setDoc(doc(db, 'users', uid, 'notifications', `event_update_${event.id}`), {
          type: 'event_update',
          fromUid: host.uid,
          targetId: event.id,
          eventTitle: event.title,
          read: false,
          createdAt: serverTimestamp(),
        }).catch(() => {})
      )
    );
  },

  // Lightweight "X new messages in {group}" — deliberately one upserted
  // doc per (recipient, conversation) rather than one row per message, so
  // a busy chat doesn't flood the panel with individual rows or leak
  // message content into notifications (see CLAUDE.md: no second channel
  // for reading messages outside the chat itself). Best-effort — a failed
  // notification write should never block sending the message it's for.
  async notifyGroupMessage(conversationId, sender) {
    const convoSnap = await getDoc(doc(db, 'conversations', conversationId));
    if (!convoSnap.exists()) return;
    const convo = convoSnap.data();

    let memberUids = [];
    let groupName = null;
    if (convo.type === 'community' && convo.communityId) {
      const [membersSnap, communitySnap] = await Promise.all([
        getDocs(collection(db, 'communities', convo.communityId, 'members')),
        getDoc(doc(db, 'communities', convo.communityId)),
      ]);
      memberUids = membersSnap.docs.map((d) => d.id);
      groupName = communitySnap.exists() ? communitySnap.data().name : null;
    } else if (convo.type === 'event' && convo.eventId) {
      const [attendeesSnap, eventSnap] = await Promise.all([
        getDocs(collection(db, 'events', convo.eventId, 'attendees')),
        getDoc(doc(db, 'events', convo.eventId)),
      ]);
      memberUids = attendeesSnap.docs.map((d) => d.id);
      groupName = eventSnap.exists() ? eventSnap.data().title : null;
    } else {
      return; // legacy memberIds conversations — no group-name convention to reuse safely
    }

    const recipients = memberUids.filter((uid) => uid !== sender.uid);
    const notifId = `group_message_${conversationId}`;
    await Promise.all(recipients.map(async (uid) => {
      const notifRef = doc(db, 'users', uid, 'notifications', notifId);
      const existing = await getDoc(notifRef).catch(() => null);
      const fields = {
        type: 'group_message',
        fromUid: sender.uid,
        targetId: conversationId,
        groupName,
        read: false,
        createdAt: serverTimestamp(),
      };
      if (existing?.exists() && existing.data().type === 'group_message') {
        await updateDoc(notifRef, { ...fields, count: (existing.data().count || 1) + 1 }).catch(() => {});
      } else {
        await setDoc(notifRef, { ...fields, count: 1 }).catch(() => {});
      }
    }));
  },
};
