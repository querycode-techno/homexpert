import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/users/dbConnect';
import mongoose from 'mongoose';
import SupportTicket from '@/lib/models/supportTicket';
import { verifyUserToken } from '@/lib/middleware/userAuth';

function formatTicket(t) {
  return {
    id: t._id.toString(),
    ticketId: t.ticketId,
    title: t.title,
    description: t.description,
    category: t.category,
    status: t.status,
    priority: t.priority,
    createdAt: t.createdAt,
  };
}

export async function GET(request) {
  const auth = verifyUserToken(request);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: auth.error, errorCode: 'AUTH_ERROR' }, { status: auth.status });
  }

  await connectMongo();
  const tickets = await SupportTicket.find({ createdBy: auth.user.userId, createdByType: 'user' })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ success: true, message: 'OK', data: tickets.map(formatTicket) });
}

export async function POST(request) {
  const auth = verifyUserToken(request);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: auth.error, errorCode: 'AUTH_ERROR' }, { status: auth.status });
  }

  const { title, description, category } = await request.json();
  if (!title || !description) {
    return NextResponse.json(
      { success: false, message: 'Title and description required', errorCode: 'INVALID_INPUT' },
      { status: 400 }
    );
  }

  await connectMongo();
  const ticketId = `USR-${Date.now().toString().slice(-8)}`;
  const ticket = await SupportTicket.create({
    ticketId,
    title,
    description,
    category: category || 'general_inquiry',
    createdBy: new mongoose.Types.ObjectId(auth.user.userId),
    createdByType: 'user',
    status: 'open',
    priority: 'medium',
  });

  return NextResponse.json({ success: true, message: 'Ticket created', data: formatTicket(ticket) });
}
