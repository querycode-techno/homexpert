import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { verifyUserToken } from '@/lib/middleware/userAuth';

export async function GET(request) {
  const auth = verifyUserToken(request);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: auth.error, errorCode: 'AUTH_ERROR' }, { status: auth.status });
  }

  const notificationsCollection = await database.getNotificationsCollection();
  const notifications = await notificationsCollection
    .find({ userId: new ObjectId(auth.user.userId) })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return NextResponse.json({
    success: true,
    message: 'OK',
    data: notifications.map((n) => ({
      id: n._id.toString(),
      title: n.title,
      body: n.body || n.message,
      type: n.type,
      read: !!n.read,
      deepLink: n.deepLink,
      createdAt: n.createdAt,
    })),
  });
}
