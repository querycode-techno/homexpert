import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/users/dbConnect';
import Cart from '@/lib/models/cart';

export async function GET(request) {
  await connectMongo();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const query = status ? { status } : {};
  const carts = await Cart.find(query).sort({ lastActivityAt: -1 }).limit(100).populate('userId', 'name phone email').lean();
  return NextResponse.json({ success: true, message: 'OK', data: carts });
}
