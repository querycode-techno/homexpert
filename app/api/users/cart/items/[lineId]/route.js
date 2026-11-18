import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/users/dbConnect';
import Cart from '@/lib/models/cart';
import { verifyUserToken } from '@/lib/middleware/userAuth';

function calcSubtotal(items) {
  return items.reduce((sum, i) => sum + (i.priceSnapshot || 0) * (i.quantity || 1), 0);
}

export async function DELETE(request, { params }) {
  const auth = verifyUserToken(request);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: auth.error, errorCode: 'AUTH_ERROR' }, { status: auth.status });
  }

  const { lineId } = await params;
  await connectMongo();
  const cart = await Cart.findOne({ userId: auth.user.userId, status: 'active' });
  if (!cart) {
    return NextResponse.json({ success: false, message: 'Cart not found', errorCode: 'NOT_FOUND' }, { status: 404 });
  }

  cart.items = cart.items.filter((i) => i._id.toString() !== lineId);
  cart.subtotal = calcSubtotal(cart.items);
  cart.lastActivityAt = new Date();
  await cart.save();

  return NextResponse.json({ success: true, message: 'Item removed', data: cart });
}
