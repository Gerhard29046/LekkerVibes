import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

// Firestore-backed replacement for the old Laravel /reports endpoint.
// Write-only from the client — see Firebase/firestore.rules: only staff
// (custom claim role in [admin, moderator]) can read the queue back.
export const reportsApi = {
  create: ({ reportableType, reportableId, reason, details }, currentUser) =>
    addDoc(collection(db, 'reports'), {
      reporterId: currentUser.uid,
      targetType: reportableType,
      targetId: reportableId,
      reason,
      details: details || null,
      status: 'open',
      createdAt: serverTimestamp(),
    }),
};
