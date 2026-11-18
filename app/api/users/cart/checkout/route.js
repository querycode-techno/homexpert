import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/users/dbConnect';
import Cart from '@/lib/models/cart';
import CartEvent from '@/lib/models/cartEvent';
import Lead from '@/lib/models/lead';
import { verifyUserToken } from '@/lib/middleware/userAuth';
import { database } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  const auth = verifyUserToken(request);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: auth.error, errorCode: 'AUTH_ERROR' }, { status: auth.status });
  }

  await connectMongo();
  const body = await request.json();
  const { addressId, preferredDate, description, photos, additionalNotes } = body;

  const cart = await Cart.findOne({ userId: auth.user.userId, status: 'active' });
  if (!cart || !cart.items.length) {
    return NextResponse.json(
      { success: false, message: 'Cart is empty', errorCode: 'EMPTY_CART' },
      { status: 400 }
    );
  }

  const usersCollection = await database.getUsersCollection();
  const user = await usersCollection.findOne({ _id: new ObjectId(auth.user.userId) });
  const address = (user.addresses || []).find((a) => a._id.toString() === addressId) || user.addresses?.[0];

  if (!address) {
    return NextResponse.json(
      { success: false, message: 'Address required', errorCode: 'NO_ADDRESS' },
      { status: 400 }
    );
  }

  const addressStr = `${address.street}, ${address.city}, ${address.state} ${address.pincode}`;
  const requestIds = [];

  for (const item of cart.items) {
    const lead = await Lead.create({
      customerName: user.name,
      customerPhone: user.phone,
      customerEmail: user.email,
      service: item.serviceName,
      selectedService: item.serviceName,
      selectedSubService: item.subServiceName || '',
      city: address.city,
      state: address.state,
      address: addressStr,
      description: description || `Service request for ${item.serviceName}`,
      additionalNotes: additionalNotes || '',
      price: item.priceSnapshot * item.quantity,
      preferredDate: preferredDate ? new Date(preferredDate) : new Date(),
      status: 'pending',
      source: 'user_app',
      userId: auth.user.userId,
      cartId: cart._id.toString(),
      paymentMode: 'pay_after_service',
      paymentStatus: 'pending',
      photos: photos || [],
      quantity: item.quantity,
    });
    requestIds.push({ id: lead._id.toString(), service: item.serviceName });
  }

  cart.status = 'converted';
  cart.convertedAt = new Date();
  await cart.save();

  await CartEvent.create({
    eventType: 'checkout_completed',
    userId: auth.user.userId,
    cartId: cart._id,
    payload: { requestIds },
  });

  await Cart.create({ userId: auth.user.userId, items: [], subtotal: 0, status: 'active' });

  return NextResponse.json({
    success: true,
    message: 'Request submitted',
    data: {
      requestIds,
      paymentMode: 'pay_after_service',
      paymentStatus: 'pending',
    },
  });
}
