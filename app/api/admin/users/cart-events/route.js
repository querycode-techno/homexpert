import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/users/dbConnect';
import CartEvent from '@/lib/models/cartEvent';

export async function GET(request) {
  await connectMongo();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const query = userId ? { userId } : {};
  const events = await CartEvent.find(query).sort({ createdAt: -1 }).limit(200).lean();
  return NextResponse.json({ success: true, message: 'OK', data: events });
}
