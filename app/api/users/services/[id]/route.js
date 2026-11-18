import { NextResponse } from 'next/server';
import { getServiceById } from '@/lib/users/catalog';

export async function GET(request, { params }) {
  const { id } = await params;
  const service = getServiceById(id);
  if (!service) {
    return NextResponse.json({ success: false, message: 'Service not found', errorCode: 'NOT_FOUND' }, { status: 404 });
  }
  return NextResponse.json({ success: true, message: 'OK', data: service });
}
