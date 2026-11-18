import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/users/dbConnect';
import Cart from '@/lib/models/cart';
import CartEvent from '@/lib/models/cartEvent';
import { database } from '@/lib/db';

/** Call via cron (e.g. hourly) to mark abandoned carts and queue recovery notifications */
export async function POST(request) {
  const authHeader = request.headers.get('x-cron-secret');
  if (process.env.CRON_SECRET && authHeader !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  await connectMongo();
  const cutoff = new Date(Date.now() - 60 * 60 * 1000);
  const carts = await Cart.find({ status: 'active', lastActivityAt: { $lt: cutoff }, 'items.0': { $exists: true } });

  const notificationsCollection = await database.getNotificationsCollection();
  let processed = 0;

  for (const cart of carts) {
    cart.status = 'abandoned';
    cart.abandonedAt = new Date();
    await cart.save();
    await CartEvent.create({ eventType: 'checkout_abandoned', userId: cart.userId, cartId: cart._id });

    const usersCollection = await database.getUsersCollection();
    const user = await usersCollection.findOne({ _id: cart.userId });
    if (user?.fcmToken && user?.notificationPrefs?.cartRecoveryEnabled !== false) {
      await notificationsCollection.insertOne({
        userId: cart.userId,
        title: 'Complete your booking',
        body: 'You have items waiting in your cart.',
        type: 'cart_recovery',
        deepLink: 'cart',
        read: false,
        createdAt: new Date(),
      });
      processed++;
    }
  }

  return NextResponse.json({ success: true, data: { abandoned: carts.length, notified: processed } });
}
