import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { verifyUserToken } from '@/lib/middleware/userAuth';

export async function POST(request) {
  const auth = verifyUserToken(request);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: auth.error, errorCode: 'AUTH_ERROR' }, { status: auth.status });
  }

  const { fcmToken } = await request.json();
  if (!fcmToken) {
    return NextResponse.json(
      { success: false, message: 'FCM token required', errorCode: 'INVALID_INPUT' },
      { status: 400 }
    );
  }

  const usersCollection = await database.getUsersCollection();
  await usersCollection.updateOne(
    { _id: new ObjectId(auth.user.userId) },
    { $set: { fcmToken, updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true, message: 'FCM token saved', data: null });
}
