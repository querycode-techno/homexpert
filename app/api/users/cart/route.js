import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/users/dbConnect';
import Cart from '@/lib/models/cart';
import { verifyUserToken } from '@/lib/middleware/userAuth';
import { getServiceById } from '@/lib/users/catalog';

function calcSubtotal(items) {
  return items.reduce((sum, i) => sum + (i.priceSnapshot || 0) * (i.quantity || 1), 0);
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId, status: 'active' });
  if (!cart) {
    cart = await Cart.create({ userId, items: [], subtotal: 0, status: 'active' });
  }
  return cart;
}

export async function GET(request) {
  const auth = verifyUserToken(request);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: auth.error, errorCode: 'AUTH_ERROR' }, { status: auth.status });
  }

  await connectMongo();
  const cart = await getOrCreateCart(auth.user.userId);
  return NextResponse.json({ success: true, message: 'OK', data: cart });
}

export async function PUT(request) {
  const auth = verifyUserToken(request);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: auth.error, errorCode: 'AUTH_ERROR' }, { status: auth.status });
  }

  await connectMongo();
  const body = await request.json();
  const cart = await getOrCreateCart(auth.user.userId);

  if (body.action === 'add' && body.item) {
    const svc = getServiceById(body.item.serviceId);
    const sub = svc?.subServices?.find((s) => s.id === body.item.subServiceId) || svc?.subServices?.[0];
    const unitPrice = typeof sub?.price === 'number' ? sub.price : body.item.unitPrice || 0;
    const existing = cart.items.find(
      (i) => i.serviceId === body.item.serviceId && i.subServiceId === (body.item.subServiceId || sub?.id)
    );
    if (existing) {
      existing.quantity += body.item.quantity || 1;
      existing.priceSnapshot = unitPrice;
    } else {
      cart.items.push({
        serviceId: body.item.serviceId,
        serviceName: svc?.name || body.item.serviceName,
        subServiceId: body.item.subServiceId || sub?.id,
        subServiceName: sub?.name || body.item.subServiceName,
        quantity: body.item.quantity || 1,
        unitPrice,
        priceSnapshot: unitPrice,
      });
    }
  } else if (body.action === 'update' && body.lineId) {
    const item = cart.items.id(body.lineId);
    if (item && body.quantity) item.quantity = body.quantity;
  } else if (body.items) {
    cart.items = body.items;
  }

  cart.subtotal = calcSubtotal(cart.items);
  cart.lastActivityAt = new Date();
  await cart.save();

  return NextResponse.json({ success: true, message: 'Cart updated', data: cart });
}
