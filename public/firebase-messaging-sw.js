// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-messaging-compat.js');

// This config should be public
const firebaseConfig = {
  apiKey: "AIzaSyBui0DiZMxTDw5CBHYrUZw7jamP3aQrmCA",
  authDomain: "home-expert-3ef6e.firebaseapp.com",
  projectId: "home-expert-3ef6e",
  storageBucket: "home-expert-3ef6e.firebasestorage.app",
  messagingSenderId: "771855502285",
  appId: "1:771855502285:web:418f34a9608ff1ad6e1284",
  measurementId: "G-6LTMNNW4TV"
};

// Initialize the Firebase app in the service worker
firebase.initializeApp(firebaseConfig);

// Retrieve the messaging object
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
 
  // payload.fcmOptions?.link comes from our backend API route handle
  // payload.data.link comes from the Firebase Console where link is the 'key'
  const link = payload.fcmOptions?.link || payload.data?.link;

  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/hx-logo.png', // Add an icon
  };

  // self.registration.showNotification(notificationTitle, notificationOptions);
});

// IMPORTANT: Your VAPID key needs to be configured in your Firebase project settings
// and also passed to getToken() on the client.