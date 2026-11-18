import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/users/dbConnect';
import Slide from '@/lib/models/slide';

export async function PUT(request, { params }) {
  await connectMongo();
  const { id } = await params;
  const body = await request.json();
  const slide = await Slide.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json({ success: true, message: 'Slide updated', data: slide });
}

export async function DELETE(request, { params }) {
  await connectMongo();
  const { id } = await params;
  await Slide.findByIdAndDelete(id);
  return NextResponse.json({ success: true, message: 'Slide deleted', data: null });
}
