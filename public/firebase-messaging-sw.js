// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-messaging-compat.js');

// This config should be public
const firebaseConfig = {
    apiKey: "AIzaSyB389Ys6c8FpQJESq7COas3MIYwd6yFi3Y",
    authDomain: "testing-b8899.firebaseapp.com",
    projectId: "testing-b8899",
    storageBucket: "testing-b8899.firebasestorage.app",
    messagingSenderId: "977931125347",
    appId: "1:977931125347:web:9d9d653ab1265fc26e6e56",
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

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// IMPORTANT: Your VAPID key needs to be configured in your Firebase project settings
// and also passed to getToken() on the client.