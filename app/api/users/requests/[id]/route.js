import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/users/dbConnect';
import Lead from '@/lib/models/lead';
import { verifyUserToken } from '@/lib/middleware/userAuth';

function formatLeadDetail(lead) {
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
    photos: lead.photos || [],
    createdAt: lead.createdAt,
    timeline: buildTimeline(lead),
    vendorName: lead.takenBy ? 'Assigned Vendor' : null,
  };
}

function buildTimeline(lead) {
  const steps = [
    { key: 'pending', label: 'Request Created', done: true, date: lead.createdAt },
    { key: 'assigned', label: 'Vendor Assigned', done: ['assigned', 'taken', 'in_progress', 'completed'].includes(lead.status) },
    { key: 'in_progress', label: 'In Progress', done: ['in_progress', 'completed'].includes(lead.status) },
    { key: 'completed', label: 'Completed & Pay After Service', done: lead.status === 'completed' },
  ];
  return steps.map((s) => ({
    ...s,
    active: lead.status === s.key || (s.key === 'assigned' && lead.status === 'taken'),
  }));
}

export async function GET(request, { params }) {
  const auth = verifyUserToken(request);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: auth.error, errorCode: 'AUTH_ERROR' }, { status: auth.status });
  }

  const { id } = await params;
  await connectMongo();
  const lead = await Lead.findOne({ _id: id, userId: auth.user.userId }).lean();
  if (!lead) {
    return NextResponse.json({ success: false, message: 'Request not found', errorCode: 'NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'OK', data: formatLeadDetail(lead) });
}
