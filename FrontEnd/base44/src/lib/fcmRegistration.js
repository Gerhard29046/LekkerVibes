import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getToken as getFcmToken, onMessage } from 'firebase/messaging';
import { db, getMessagingIfSupported } from '@/lib/firebaseClient';
import { toast } from '@/components/ui/use-toast';

// Registers this browser's FCM token under users/{uid}/fcmTokens/{token} so
// the Worker's POST /v1/notifications/send can target it later. This is the
// client-side half of push notifications — actually SENDING a push is a
// trusted operation and lives in the Worker (see Worker/src/lib/fcm.ts).
//
// Called on every auth-state change (see AuthContext.jsx), which doubles as
// "token refresh handling" — the FCM SDK rotates its underlying token
// occasionally, and re-requesting it here each session keeps the stored
// doc current. Each browser/device gets its own token document (keyed by
// the token value itself), so one user can hold several — multi-device by
// construction, no extra bookkeeping needed.
export async function registerFcmToken(uid) {
  try {
    const messaging = await getMessagingIfSupported();
    if (!messaging) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) return;

    const token = await getFcmToken(messaging, { vapidKey });
    if (!token) return;

    await setDoc(doc(db, 'users', uid, 'fcmTokens', token), {
      token,
      platform: 'web',
      createdAt: serverTimestamp(),
    });

    listenForForegroundMessages();
  } catch {
    // Non-fatal: push notifications are a nice-to-have, never block auth.
  }
}

let foregroundListenerAttached = false;

// Background pushes are handled by public/firebase-messaging-sw.js. When
// the tab has focus, FCM delivers the message here instead of to the
// service worker — surface it as an in-app toast so it isn't silently lost.
async function listenForForegroundMessages() {
  if (foregroundListenerAttached) return;
  const messaging = await getMessagingIfSupported();
  if (!messaging) return;

  foregroundListenerAttached = true;
  onMessage(messaging, (payload) => {
    const { title, body } = payload.notification || {};
    toast({ title: title || 'LekkerVibes', description: body });
  });
}
