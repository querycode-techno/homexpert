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
  const body = await request.json();
  const usersCollection = await database.getUsersCollection();
  const user = await usersCollection.findOne({ _id: new ObjectId(auth.user.userId) });
  const addresses = user.addresses || [];
  const idx = addresses.findIndex((a) => a._id.toString() === id);

  if (idx === -1) {
    return NextResponse.json({ success: false, message: 'Address not found', errorCode: 'NOT_FOUND' }, { status: 404 });
  }

  Object.assign(addresses[idx], body, { updatedAt: new Date() });
  if (body.isDefault) {
    addresses.forEach((a, i) => { if (i !== idx) a.isDefault = false; });
    addresses[idx].isDefault = true;
  }

  await usersCollection.updateOne(
    { _id: new ObjectId(auth.user.userId) },
    { $set: { addresses, updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true, message: 'Address updated', data: addresses[idx] });
}

export async function DELETE(request, { params }) {
  const auth = verifyUserToken(request);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: auth.error, errorCode: 'AUTH_ERROR' }, { status: auth.status });
  }

  const { id } = await params;
  const usersCollection = await database.getUsersCollection();
  const user = await usersCollection.findOne({ _id: new ObjectId(auth.user.userId) });
  let addresses = (user.addresses || []).filter((a) => a._id.toString() !== id);

  if (addresses.length && !addresses.some((a) => a.isDefault)) {
    addresses[0].isDefault = true;
  }

  await usersCollection.updateOne(
    { _id: new ObjectId(auth.user.userId) },
    { $set: { addresses, updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true, message: 'Address deleted', data: null });
}
