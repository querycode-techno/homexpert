import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/users/dbConnect';
import Lead from '@/lib/models/lead';
import { verifyUserToken } from '@/lib/middleware/userAuth';

const STATUS_TIMELINE = [
  'pending',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
];

function formatLead(lead) {
  return {
    id: lead._id.toString(),
    requestNumber: `HX-${lead._id.toString().slice(-4).toUpperCase()}`,
    service: lead.service,
    selectedService: lead.selectedService,
    selectedSubService: lead.selectedSubService,
    status: lead.status,
    address: lead.address,
    city: lead.city,
    state: lead.state,
    description: lead.description,
    preferredDate: lead.preferredDate,
    paymentMode: lead.paymentMode || 'pay_after_service',
    paymentStatus: lead.paymentStatus || 'pending',
    price: lead.price,
    createdAt: lead.createdAt,
    timeline: (lead.leadProgressHistory || []).map((h) => ({
      status: h.toStatus,
      date: h.date,
      reason: h.reason,
    })),
  };
}

export async function GET(request) {
  const auth = verifyUserToken(request);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: auth.error, errorCode: 'AUTH_ERROR' }, { status: auth.status });
  }

  await connectMongo();
  const leads = await Lead.find({ userId: auth.user.userId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ success: true, message: 'OK', data: leads.map(formatLead) });
}
