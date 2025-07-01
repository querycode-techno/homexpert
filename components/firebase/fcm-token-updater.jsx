
'use client'; // This is a Client Component

import { useEffect } from 'react';
import { messaging } from '@/lib/firebase/client';
import { getToken } from 'firebase/messaging';
import { useSession } from 'next-auth/react';

const FCMTokenUpdater = () => {
  const { data: session } = useSession(); // Get the user session

  useEffect(() => {
    // This effect runs only on the client side
    const updateToken = async () => {
      // Check if messaging is available and the user is logged in
      if (messaging && session?.user?.id) {
        console.log("user id", session.user.id);
        try {
          // Get the FCM token. This will prompt the user for permission.
          const currentToken = await getToken(messaging, {
            // This is your public VAPID key from Firebase console
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          });

          if (currentToken) {
            console.log("FCM Token retrieved:", currentToken);
            
            // Now, send this token to your Next.js backend
            await sendTokenToBackend(session.user.id, currentToken);
          } else {
            console.warn("No FCM token available. User may have denied permission.");
          }
        } catch (error) {
          console.error("Error getting FCM token:", error);
        }
      }
    };

    updateToken();
  }, [session]); // Re-run this effect when the user session changes (e.g., after login)

  // This function sends the token to your API Route
  const sendTokenToBackend = async (userId, token) => {
    try {
      const response = await fetch('/api/user/update-fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // You can pass the session token for authentication here
          'Authorization': `Bearer ${session.accessToken}` // Assumes you have an access token in your session
        },
        body: JSON.stringify({ userId, fcmToken: token }),
      });

      if (response.ok) {
        console.log("FCM token successfully updated on the server.");
      } else {
        console.error("Failed to update FCM token on the server.");
      }
    } catch (error) {
      console.error("Error sending token to backend:", error);
    }
  };

  return null; // This component doesn't render any UI
};

export default FCMTokenUpdater;