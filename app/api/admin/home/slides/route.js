import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/users/dbConnect';
import Slide from '@/lib/models/slide';

export async function GET() {
  await connectMongo();
  const slides = await Slide.find().sort({ sortOrder: 1 }).lean();
  return NextResponse.json({ success: true, message: 'OK', data: slides });
}

export async function POST(request) {
  await connectMongo();
  const body = await request.json();
  const slide = await Slide.create(body);
  return NextResponse.json({ success: true, message: 'Slide created', data: slide });
}
