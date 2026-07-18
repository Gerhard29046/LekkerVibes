import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as fsLimit,
  updateDoc,
  deleteDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { apiClient } from '@/api/apiClient';
import { notificationsApi } from '@/api/notificationsApi';
import { messagesApi } from '@/api/messagesApi';

const CATEGORIES = [
  'Running', 'Hiking', 'Surfing', 'Cycling', 'Yoga & Wellness',
  'Food & Markets', 'Faith & Community', 'Social & Dining', 'Book Club', 'Gaming',
];

async function attendeeCount(eventId) {
  const snap = await getCountFromServer(collection(db, 'events', eventId, 'attendees'));
  return snap.data().count;
}

// Capacity/waitlist decisions only ever care about people actually going —
// 'interested' isn't a capacity-consuming RSVP, and 'waitlisted' obviously
// isn't either. Deliberately separate from attendeeCount() above (which
// counts the whole subcollection for the "X going" display everywhere
// else) so fixing capacity math here doesn't change that existing display.
async function goingCount(eventId) {
  const snap = await getCountFromServer(
    query(collection(db, 'events', eventId, 'attendees'), where('status', '==', 'going'))
  );
  return snap.data().count;
}

async function attendanceFor(eventId, uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'events', eventId, 'attendees', uid));
  return snap.exists() ? snap.data() : null;
}

// Today at midnight, ISO date (yyyy-mm-dd) — events store `date` as this
// sortable string form rather than a Firestore Timestamp so plain string
// range queries ("today or later") don't need a separate boundary field.
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// Firestore rejects an entire list/query (not just individual documents)
// unless it can statically prove the read rule holds for every possible
// result. The events read rule is `visibility != 'members' || (member
// check)` — a query with no visibility filter mixes both branches, which
// Firestore can't prove safe for an arbitrary/anonymous viewer, and 403s
// the whole query (confirmed live: a plain city+status+date query 403'd for
// a signed-out user even though the matching public event was individually
// readable via a direct get()). Every general-purpose list must therefore
// filter `visibility == 'public'` explicitly. Members-only events are only
// ever listed scoped to one specific community (see listCommunityEvents),
// where the extra `communityId` equality filter makes the membership check
// invariant across the result set and therefore provable.
export const eventsApi = {
  // { city, communityId, category, mood, search }
  async list({ city, communityId, category, mood, search } = {}) {
    const clauses = [where('status', '==', 'active'), where('date', '>=', todayIso()), where('visibility', '==', 'public')];
    if (communityId) clauses.push(where('communityId', '==', communityId));
    else if (city) clauses.push(where('city', '==', city));
    const q = query(collection(db, 'events'), ...clauses, orderBy('date', 'asc'), fsLimit(50));
    const snap = await getDocs(q);
    let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (category) items = items.filter((e) => e.category === category);
    if (mood) items = items.filter((e) => e.mood === mood);
    if (search) {
      const needle = search.toLowerCase();
      items = items.filter((e) =>
        e.title?.toLowerCase().includes(needle) || e.description?.toLowerCase().includes(needle)
      );
    }
    const counts = await Promise.all(items.map((e) => attendeeCount(e.id)));
    return items.map((e, i) => ({ ...e, attendeeCount: counts[i] }));
  },

  // A community's full upcoming-events list (public + members-only),
  // for use on a community page where `isMember` has already been
  // established client-side. Two separate queries because mixing both
  // visibility values in one query is exactly the unprovable case above.
  async listCommunityEvents(communityId, isMember) {
    const base = [where('status', '==', 'active'), where('date', '>=', todayIso()), where('communityId', '==', communityId)];
    const publicQuery = query(collection(db, 'events'), ...base, where('visibility', '==', 'public'), orderBy('date', 'asc'));
    const queries = [getDocs(publicQuery)];
    if (isMember) {
      const membersQuery = query(collection(db, 'events'), ...base, where('visibility', '==', 'members'), orderBy('date', 'asc'));
      queries.push(getDocs(membersQuery));
    }
    const snaps = await Promise.all(queries);
    const items = snaps.flatMap((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    const counts = await Promise.all(items.map((e) => attendeeCount(e.id)));
    return items.map((e, i) => ({ ...e, attendeeCount: counts[i] })).sort((a, b) => a.date.localeCompare(b.date));
  },

  async get(id, currentUid) {
    const snap = await getDoc(doc(db, 'events', id));
    if (!snap.exists()) return null;
    const data = snap.data();
    const [count, attendance, organiser, community] = await Promise.all([
      attendeeCount(id),
      attendanceFor(id, currentUid),
      getDoc(doc(db, 'users', data.organiserId)),
      data.communityId ? getDoc(doc(db, 'communities', data.communityId)) : null,
    ]);
    return {
      id: snap.id,
      ...data,
      attendeeCount: count,
      myAttendance: attendance,
      organiserName: organiser.exists() ? organiser.data().displayName : 'Organiser',
      community: community?.exists() ? { id: community.id, name: community.data().name } : null,
    };
  },

  // { title, description, category, mood, date, startTime, endTime, venue,
  //   address, city, coordinates, communityId, capacity, visibility,
  //   imageURL, externalUrl, placeId, placeName, placePhotoUrl }
  //
  // Every event gets a paired group chat, created in the same client batch
  // as the host's own 'going' attendee doc — same two-step resilience
  // pattern as communitiesApi.create() (parent doc committed on its own
  // first, since the batch's writes need to get() it mid-batch to prove
  // the host is who they say they are; orphaned parent cleaned up if the
  // batch fails). `chatId` is just `eventRef.id` — conversationId ==
  // eventId, mirroring the community-scoped conversation pattern, so
  // there's nothing to keep in sync on join/leave (membership is derived
  // from events/{id}/attendees, not a duplicated memberIds array).
  //
  // `visibility`: 'public' | 'members' (the spec's "My community only" —
  // named 'members' to match the pre-existing enum this reuses) |
  // 'invite_link' (generates `inviteToken`; see Firebase/firestore.rules
  // and Worker/src/routes/events.ts for why that can only be resolved
  // through the Worker before the requester has joined).
  async create(data, currentUser) {
    const eventRef = doc(collection(db, 'events'));
    const visibility = data.visibility || 'public';
    const inviteToken = visibility === 'invite_link' ? crypto.randomUUID() : null;

    await setDoc(eventRef, {
      title: data.title,
      description: data.description || '',
      category: data.category || null,
      mood: data.mood || null,
      date: data.date,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      venue: data.venue || '',
      address: data.address || '',
      city: data.city,
      coordinates: data.coordinates || null,
      communityId: visibility === 'members' ? data.communityId || null : null,
      organiserId: currentUser.uid,
      capacity: data.capacity || null,
      visibility,
      inviteToken,
      chatId: eventRef.id,
      placeId: data.placeId || null,
      placeName: data.placeName || null,
      placePhotoUrl: data.placePhotoUrl || null,
      imageURL: data.imageURL || data.placePhotoUrl || null,
      externalUrl: data.externalUrl || null,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'events', eventRef.id, 'attendees', currentUser.uid), {
        uid: currentUser.uid,
        status: 'going',
        joinedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'conversations', eventRef.id), {
        type: 'event',
        eventId: eventRef.id,
        createdAt: serverTimestamp(),
      });
      await batch.commit();
    } catch (err) {
      await deleteDoc(eventRef).catch(() => {});
      throw err;
    }

    // Hosted into a community (visibility 'members'): the group's own
    // ongoing chat gets an auto-posted event card announcing it, distinct
    // from the event's own dedicated attendee chat created above. Best
    // -effort — a message-post failure shouldn't fail event creation.
    if (visibility === 'members' && data.communityId) {
      messagesApi.postEventCard(data.communityId, eventRef.id, currentUser).catch(() => {});
    }

    return { id: eventRef.id, chatId: eventRef.id };
  },

  // `editor` is optional so existing call sites that don't pass it (none
  // left after EditActivity.jsx, but keeping the parameter optional rather
  // than required avoids a hard break for any other caller) still work —
  // just without the attendee notification.
  async update(id, data, editor) {
    // `data` may only carry the fields actually being changed (e.g. just
    // capacity) — read the title fresh rather than assume it's present.
    const title = data.title ?? (await getDoc(doc(db, 'events', id))).data()?.title;
    await updateDoc(doc(db, 'events', id), { ...data, updatedAt: serverTimestamp() });
    if (editor) {
      const attendeesSnap = await getDocs(collection(db, 'events', id, 'attendees'));
      await notificationsApi.notifyEventUpdated(
        attendeesSnap.docs.map((d) => d.id), editor, { id, title },
      );
    }
  },

  // Cancelling archives (never deletes) the paired chat, per spec — the
  // conversation doc's `isArchived` flag is the only field its rules allow
  // the host to update post-creation. Notifies every other attendee —
  // deliberately scoped to cancellation only, not every field edit, since
  // that's the one change attendees genuinely need to know about.
  async cancel(id, host) {
    const eventSnap = await getDoc(doc(db, 'events', id));
    await updateDoc(doc(db, 'events', id), { status: 'cancelled', updatedAt: serverTimestamp() });
    await updateDoc(doc(db, 'conversations', id), { isArchived: true }).catch(() => {});
    if (host && eventSnap.exists()) {
      const attendeesSnap = await getDocs(collection(db, 'events', id, 'attendees'));
      await notificationsApi.notifyEventCancelled(
        attendeesSnap.docs.map((d) => d.id), host, { id, title: eventSnap.data().title },
      );
    }
  },

  remove(id) {
    return deleteDoc(doc(db, 'events', id));
  },

  // status: 'going' | 'interested'. Capacity-aware joining (which can land
  // on 'waitlisted' instead) is the dedicated `join()` method below —
  // this one stays a plain, unconditional status setter since 'interested'
  // never needs a capacity check and existing call sites (e.g. the
  // long-standing "I'm Interested" button) already depend on that.
  rsvp(id, currentUser, status = 'going') {
    return setDoc(doc(db, 'events', id, 'attendees', currentUser.uid), {
      uid: currentUser.uid,
      status,
      joinedAt: serverTimestamp(),
    });
  },

  // Capacity-aware join: counts current 'going' attendees against the
  // event's capacity (if any) and lands the caller on 'waitlisted' instead
  // of 'going' when it's full. Count-then-write isn't atomic — the same
  // small, accepted race window as the rest of this file's non-batched
  // cross-document syncs — a mild over-capacity edge case under
  // simultaneous joins, not a security issue.
  async join(id, currentUser) {
    const eventSnap = await getDoc(doc(db, 'events', id));
    const eventData = eventSnap.exists() ? eventSnap.data() : null;
    const capacity = eventData?.capacity ?? null;
    let status = 'going';
    if (capacity != null) {
      const count = await goingCount(id);
      if (count >= capacity) status = 'waitlisted';
    }
    await setDoc(doc(db, 'events', id, 'attendees', currentUser.uid), {
      uid: currentUser.uid,
      status,
      joinedAt: serverTimestamp(),
    });
    if (eventData) {
      notificationsApi.notifyEventJoin(eventData.organiserId, currentUser, { id, title: eventData.title });
    }
    return { status };
  },

  // A waitlisted attendee can only ever update their OWN attendee doc (see
  // Firebase/firestore.rules) — there's no Cloud Function/Cron in this
  // architecture to instantly promote the next person the moment a spot
  // opens up (see CLAUDE.md), so promotion is this opportunistic
  // self-check instead: call it whenever a waitlisted attendee views the
  // event, and if there's room now, they promote themselves. No stored
  // queue/ordering — first waitlisted viewer to check after a spot opens
  // gets it, an accepted v1 simplification over strict FIFO.
  async tryPromoteSelf(id, currentUser) {
    const attendeeSnap = await getDoc(doc(db, 'events', id, 'attendees', currentUser.uid));
    if (!attendeeSnap.exists() || attendeeSnap.data().status !== 'waitlisted') return false;
    const eventSnap = await getDoc(doc(db, 'events', id));
    const capacity = eventSnap.exists() ? eventSnap.data().capacity : null;
    if (capacity == null) return false;
    const count = await goingCount(id);
    if (count >= capacity) return false;
    await updateDoc(doc(db, 'events', id, 'attendees', currentUser.uid), { status: 'going' });
    return true;
  },

  leave(id, uid) {
    return deleteDoc(doc(db, 'events', id, 'attendees', uid));
  },

  // A small "who's going" avatar stack for the event page — public events
  // only call this (see ActivityDetail.jsx), so no extra visibility check
  // is needed here: anyone who can already read the event can read its
  // attendees subcollection (see Firebase/firestore.rules — that match is
  // simply `request.auth != null`, not gated per-event).
  async goingAttendees(eventId, max = 6) {
    const snap = await getDocs(query(
      collection(db, 'events', eventId, 'attendees'),
      where('status', '==', 'going'),
      fsLimit(max),
    ));
    const users = await Promise.all(
      snap.docs.map((d) => getDoc(doc(db, 'users', d.data().uid)))
    );
    return users
      .filter((u) => u.exists())
      .map((u) => ({ uid: u.id, displayName: u.data().displayName, photoURL: u.data().photoURL || null }));
  },

  // How many public, upcoming, active events are tied to a given Google
  // Place — powers the "N activities happening here" line on a Discover
  // place card. Scoped to `visibility=='public'` only (same reasoning as
  // list() below: a general place-card viewer shouldn't learn about a
  // members-only or invite-link event just because it happens to share a
  // place), which is also what keeps this query provable/anonymous-safe.
  async countUpcomingForPlace(placeId) {
    const snap = await getCountFromServer(query(
      collection(db, 'events'),
      where('status', '==', 'active'),
      where('visibility', '==', 'public'),
      where('placeId', '==', placeId),
      where('date', '>=', todayIso()),
    ));
    return snap.data().count;
  },

  async byPlace(placeId) {
    const snap = await getDocs(query(
      collection(db, 'events'),
      where('status', '==', 'active'),
      where('visibility', '==', 'public'),
      where('placeId', '==', placeId),
      where('date', '>=', todayIso()),
      orderBy('date', 'asc'),
    ));
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const counts = await Promise.all(items.map((e) => attendeeCount(e.id)));
    return items.map((e, i) => ({ ...e, attendeeCount: counts[i] }));
  },

  // Invite-link events can't be fetched via plain client Firestore before
  // the requester has joined (see Firebase/firestore.rules' note on why a
  // rule can never safely check "did this query supply the right token").
  // This goes through the Worker instead, which compares the token against
  // the stored value using the service account and returns just enough to
  // preview the event and decide whether to join.
  resolveInvite(token) {
    return apiClient.get('/events/resolve-invite', { token });
  },

  // Equality-only filters (no orderBy) — Firestore doesn't need a composite
  // index for pure-equality multi-field queries. The explicit visibility
  // filter is required for the query to be provable for an anonymous
  // viewer (see the note above `list()`); status/date are filtered
  // client-side rather than added to the query, since combining them with
  // orderBy would need a dedicated index for what's a rare, low-volume call.
  async byOrganiser(organiserId) {
    const snap = await getDocs(query(
      collection(db, 'events'),
      where('organiserId', '==', organiserId),
      where('visibility', '==', 'public'),
    ));
    const today = todayIso();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((e) => e.status === 'active' && e.date >= today);
  },

  // Events the given uid is attending — "my plans" on the profile page.
  async myPlans(uid) {
    if (!uid) return [];
    const attendeeDocs = await getDocs(query(collectionGroup(db, 'attendees'), where('uid', '==', uid)));
    const events = await Promise.all(
      attendeeDocs.docs.map(async (attendeeDoc) => {
        const eventRef = attendeeDoc.ref.parent.parent;
        const eventSnap = await getDoc(eventRef);
        return eventSnap.exists()
          ? { id: eventSnap.id, ...eventSnap.data(), myStatus: attendeeDoc.data().status }
          : null;
      })
    );
    return events.filter(Boolean);
  },
};

export const activitiesApi = eventsApi;
export const eventCategoriesApi = {
  list: async () => CATEGORIES.map((name) => ({ id: name, name })),
};
