import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { verifyUserToken } from '@/lib/middleware/userAuth';

function formatAddresses(addresses = []) {
  return addresses.map((a) => ({
    id: a._id?.toString(),
    label: a.label || 'Home',
    street: a.street,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    country: a.country || 'India',
    isDefault: !!a.isDefault,
  }));
}

export async function GET(request) {
  const auth = verifyUserToken(request);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: auth.error, errorCode: 'AUTH_ERROR' }, { status: auth.status });
  }

  const usersCollection = await database.getUsersCollection();
  const user = await usersCollection.findOne({ _id: new ObjectId(auth.user.userId) });
  return NextResponse.json({
    success: true,
    message: 'OK',
    data: formatAddresses(user?.addresses || []),
  });
}

export async function POST(request) {
  const auth = verifyUserToken(request);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: auth.error, errorCode: 'AUTH_ERROR' }, { status: auth.status });
  }

  const body = await request.json();
  const { street, city, state, pincode, label, isDefault, country } = body;
  if (!street || !city || !state || !pincode) {
    return NextResponse.json(
      { success: false, message: 'Address fields required', errorCode: 'INVALID_INPUT' },
      { status: 400 }
    );
  }

  const usersCollection = await database.getUsersCollection();
  const user = await usersCollection.findOne({ _id: new ObjectId(auth.user.userId) });
  const addresses = user.addresses || [];
  const newAddress = {
    _id: new ObjectId(),
    label: label || 'Home',
    street,
    city,
    state,
    pincode,
    country: country || 'India',
    isDefault: !!isDefault || addresses.length === 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (newAddress.isDefault) {
    addresses.forEach((a) => { a.isDefault = false; });
  }
  addresses.push(newAddress);

  await usersCollection.updateOne(
    { _id: new ObjectId(auth.user.userId) },
    { $set: { addresses, updatedAt: new Date() } }
  );

  return NextResponse.json({
    success: true,
    message: 'Address added',
    data: formatAddresses(addresses),
  });
}
