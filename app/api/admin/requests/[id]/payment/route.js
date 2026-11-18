import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/users/dbConnect';
import Lead from '@/lib/models/lead';

export async function PUT(request, { params }) {
  await connectMongo();
  const { id } = await params;
  const { paymentStatus } = await request.json();

  const lead = await Lead.findByIdAndUpdate(
    id,
    { paymentStatus: paymentStatus || 'paid' },
    { new: true }
  );

  if (!lead) {
    return NextResponse.json({ success: false, message: 'Request not found', errorCode: 'NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'Payment updated', data: { id: lead._id.toString(), paymentStatus: lead.paymentStatus } });
}
