import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/users/catalog';

export async function GET() {
  return NextResponse.json({ success: true, message: 'OK', data: getCategories() });
}
