import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/users/dbConnect';
import Lead from '@/lib/models/lead';
import { verifyUserToken } from '@/lib/middleware/userAuth';

export async function POST(request, { params }) {
  const auth = verifyUserToken(request);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: auth.error, errorCode: 'AUTH_ERROR' }, { status: auth.status });
  }

  const { id } = await params;
  await connectMongo();
  const lead = await Lead.findOne({ _id: id, userId: auth.user.userId });
  if (!lead) {
    return NextResponse.json({ success: false, message: 'Request not found', errorCode: 'NOT_FOUND' }, { status: 404 });
  }

  if (!['pending', 'available'].includes(lead.status)) {
    return NextResponse.json(
      { success: false, message: 'Cannot cancel at this stage', errorCode: 'POLICY_DENIED' },
      { status: 403 }
    );
  }

  lead.status = 'cancelled';
  lead.cancelledAt = new Date();
  lead.paymentStatus = 'cancelled';
  await lead.save();

  return NextResponse.json({ success: true, message: 'Request cancelled', data: { id: lead._id.toString() } });
}
