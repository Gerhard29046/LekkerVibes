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
  serverTimestamp,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

const CATEGORIES = [
  'Running', 'Hiking', 'Surfing', 'Cycling', 'Yoga & Wellness',
  'Food & Markets', 'Faith & Community', 'Social & Dining', 'Book Club', 'Gaming',
];

async function attendeeCount(eventId) {
  const snap = await getCountFromServer(collection(db, 'events', eventId, 'attendees'));
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

export const eventsApi = {
  // { city, communityId, category, mood, search }
  async list({ city, communityId, category, mood, search } = {}) {
    const clauses = [where('status', '==', 'active'), where('date', '>=', todayIso())];
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
  //   imageURL, externalUrl }
  async create(data, currentUser) {
    const eventRef = doc(collection(db, 'events'));
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
      communityId: data.communityId || null,
      organiserId: currentUser.uid,
      capacity: data.capacity || null,
      visibility: data.visibility || 'public',
      imageURL: data.imageURL || null,
      externalUrl: data.externalUrl || null,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: eventRef.id };
  },

  update(id, data) {
    return updateDoc(doc(db, 'events', id), { ...data, updatedAt: serverTimestamp() });
  },

  cancel(id) {
    return updateDoc(doc(db, 'events', id), { status: 'cancelled', updatedAt: serverTimestamp() });
  },

  remove(id) {
    return deleteDoc(doc(db, 'events', id));
  },

  // status: 'going' | 'interested'
  rsvp(id, currentUser, status = 'going') {
    return setDoc(doc(db, 'events', id, 'attendees', currentUser.uid), {
      uid: currentUser.uid,
      status,
      joinedAt: serverTimestamp(),
    });
  },

  leave(id, uid) {
    return deleteDoc(doc(db, 'events', id, 'attendees', uid));
  },

  // A single equality filter (no composite index needed) — used for a
  // public profile's "upcoming public events" list, filtered client-side
  // rather than adding a dedicated (organiserId, status, date) index for a
  // rarely-hit, low-volume query.
  async byOrganiser(organiserId) {
    const snap = await getDocs(query(collection(db, 'events'), where('organiserId', '==', organiserId)));
    const today = todayIso();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((e) => e.status === 'active' && e.visibility === 'public' && e.date >= today);
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
