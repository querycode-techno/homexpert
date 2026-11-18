import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/users/dbConnect';
import { database } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function POST(request, { params }) {
  const { userId } = await params;
  const { message, deepLink } = await request.json();

  const usersCollection = await database.getUsersCollection();
  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

  if (!user?.fcmToken) {
    return NextResponse.json(
      { success: false, message: 'User has no FCM token', errorCode: 'NO_TOKEN' },
      { status: 400 }
    );
  }

  await connectMongo();
  const notificationsCollection = await database.getNotificationsCollection();
  await notificationsCollection.insertOne({
    userId: new ObjectId(userId),
    title: 'Complete your booking',
    body: message || 'You left items in your cart. Tap to continue.',
    type: 'cart_recovery',
    deepLink: deepLink || 'cart',
    read: false,
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true, message: 'Notification queued', data: null });
}
