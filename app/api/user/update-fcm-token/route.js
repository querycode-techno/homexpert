import { NextResponse } from 'next/server';
import connectDB from '@/lib/connnectDB';
import User from '@/lib/models/user'; // Your Mongoose User model
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth"; // Your NextAuth.js config

export async function POST(req) {
  try {
    // 1. Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse the request body
    const { userId, fcmToken } = await req.json();
    

    // 3. Validate input and check authorization
    if (!userId || !fcmToken) {
      return NextResponse.json({ message: 'Missing userId or fcmToken' }, { status: 400 });
    }
    
    // Crucial: Make sure the user is updating their own token
    if (session.user.id !== userId) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // 4. Connect to your MongoDB database
    await connectDB();

    // 5. Find the user and update the token
    const user = await User.findById(userId);
   

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // update the fcm token
     user.fcmToken = fcmToken;
    
     try {
        await user.save();
      } catch (err) {
        console.error("Error saving user:", err);
      }
      console.log(`FCM token updated for user ${userId}.`);
      return NextResponse.json({ message: 'FCM token updated successfully.' });
    
  } catch (error) {
    console.error('Error updating FCM token:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}