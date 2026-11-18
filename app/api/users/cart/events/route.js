import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/users/dbConnect';
import CartEvent from '@/lib/models/cartEvent';
import { verifyUserToken } from '@/lib/middleware/userAuth';

export async function POST(request) {
  const auth = verifyUserToken(request);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: auth.error, errorCode: 'AUTH_ERROR' }, { status: auth.status });
  }

  await connectMongo();
  const body = await request.json();
  const events = Array.isArray(body.events) ? body.events : [body];

  const docs = events.map((e) => ({
    eventType: e.eventType,
    userId: auth.user.userId,
    cartId: e.cartId,
    serviceId: e.serviceId,
    sessionId: e.sessionId,
    payload: e.payload,
    deviceInfo: e.deviceInfo,
  }));

  await CartEvent.insertMany(docs);

  return NextResponse.json({ success: true, message: 'Events recorded', data: { count: docs.length } });
}
