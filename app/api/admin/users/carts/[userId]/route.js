import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/users/dbConnect';
import Cart from '@/lib/models/cart';
import CartEvent from '@/lib/models/cartEvent';

export async function GET(request, { params }) {
  await connectMongo();
  const { userId } = await params;
  const cart = await Cart.findOne({ userId, status: 'active' }).lean();
  const events = await CartEvent.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
  return NextResponse.json({ success: true, message: 'OK', data: { cart, events } });
}
