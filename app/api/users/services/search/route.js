import { NextResponse } from 'next/server';
import { searchServices } from '@/lib/users/catalog';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  return NextResponse.json({ success: true, message: 'OK', data: searchServices(q) });
}
