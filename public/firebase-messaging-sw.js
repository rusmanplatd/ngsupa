// Firebase Messaging Service Worker
// Handles background push notifications when the app is not in focus

importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAyZjxZyrfP-DuvXTmcpfXVtvST0TW4Qw8",
  authDomain: "rusmanplatd.firebaseapp.com",
  projectId: "rusmanplatd",
  storageBucket: "rusmanplatd.appspot.com",
  messagingSenderId: "537239787710",
  appId: "1:537239787710:web:77ff809109969655b366ef",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'New Notification';
  const options = {
    body: payload.notification?.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
  };

  self.registration.showNotification(title, options);
});
