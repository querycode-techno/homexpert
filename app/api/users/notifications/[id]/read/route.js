import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { verifyUserToken } from '@/lib/middleware/userAuth';

export async function PUT(request, { params }) {
  const auth = verifyUserToken(request);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: auth.error, errorCode: 'AUTH_ERROR' }, { status: auth.status });
  }

  const { id } = await params;
  const notificationsCollection = await database.getNotificationsCollection();
  await notificationsCollection.updateOne(
    { _id: new ObjectId(id), userId: new ObjectId(auth.user.userId) },
    { $set: { read: true, readAt: new Date() } }
  );

  return NextResponse.json({ success: true, message: 'Marked as read', data: null });
}
