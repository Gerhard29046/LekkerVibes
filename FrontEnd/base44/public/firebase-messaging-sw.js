importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// The Firebase Messaging SDK requires this exact config shape at the top
// level of a background service worker (can't read import.meta.env here —
// service workers aren't processed by Vite). Keep these six values in sync
// with FrontEnd/base44/.env.local's VITE_FIREBASE_* vars.
firebase.initializeApp({
  apiKey: 'AIzaSyAPs8YdIECxZ4oO4fTtZ60WB6V7hqwT2Ew',
  authDomain: 'lekkervibes-lvid001.firebaseapp.com',
  projectId: 'lekkervibes-lvid001',
  storageBucket: 'lekkervibes-lvid001.firebasestorage.app',
  messagingSenderId: '1066895584753',
  appId: '1:1066895584753:web:d60fa8faa243516363e850',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'LekkerVibes', { body });
});
