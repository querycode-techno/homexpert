import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/users/dbConnect';
import SupportTicket from '@/lib/models/supportTicket';
import { verifyUserToken } from '@/lib/middleware/userAuth';

export async function GET(request, { params }) {
  const auth = verifyUserToken(request);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: auth.error, errorCode: 'AUTH_ERROR' }, { status: auth.status });
  }

  const { id } = await params;
  await connectMongo();
  const ticket = await SupportTicket.findOne({ _id: id, createdBy: auth.user.userId }).lean();
  if (!ticket) {
    return NextResponse.json({ success: false, message: 'Ticket not found', errorCode: 'NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'OK', data: ticket });
}
