import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { verifyUserToken } from '@/lib/middleware/userAuth';
import { formatUserResponse } from '@/lib/users/userAuthHelpers';

export async function GET(request) {
  const auth = verifyUserToken(request);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: auth.error, errorCode: 'AUTH_ERROR' }, { status: auth.status });
  }

  const usersCollection = await database.getUsersCollection();
  const user = await usersCollection.findOne({ _id: new ObjectId(auth.user.userId) });
  if (!user) {
    return NextResponse.json({ success: false, message: 'User not found', errorCode: 'NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'OK', data: formatUserResponse(user) });
}

export async function PUT(request) {
  const auth = verifyUserToken(request);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: auth.error, errorCode: 'AUTH_ERROR' }, { status: auth.status });
  }

  const body = await request.json();
  const allowed = ['name', 'email', 'notificationPrefs', 'preferredCategories', 'profileImage'];
  const updates = { updatedAt: new Date() };
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const usersCollection = await database.getUsersCollection();
  await usersCollection.updateOne({ _id: new ObjectId(auth.user.userId) }, { $set: updates });
  const user = await usersCollection.findOne({ _id: new ObjectId(auth.user.userId) });

  return NextResponse.json({ success: true, message: 'Profile updated', data: formatUserResponse(user) });
}
