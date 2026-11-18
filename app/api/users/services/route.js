import { NextResponse } from 'next/server';
import { getCategories, flattenServices, getServiceById, searchServices } from '@/lib/users/catalog';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('_path');

  if (path === 'search') {
    const q = searchParams.get('q') || '';
    return NextResponse.json({ success: true, message: 'OK', data: searchServices(q) });
  }

  const categoryId = searchParams.get('categoryId');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  if (categoryId) {
    const all = flattenServices(categoryId);
    const start = (page - 1) * limit;
    return NextResponse.json({
      success: true,
      message: 'OK',
      data: { items: all.slice(start, start + limit), total: all.length, page, limit },
    });
  }

  return NextResponse.json({ success: true, message: 'OK', data: getCategories() });
}
