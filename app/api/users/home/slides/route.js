import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/users/dbConnect';
import Slide from '@/lib/models/slide';

export async function GET() {
  try {
    await connectMongo();
    const now = new Date();
    const slides = await Slide.find({
      isActive: true,
      $or: [
        { startDate: { $exists: false }, endDate: { $exists: false } },
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } },
      ],
    })
      .sort({ sortOrder: 1 })
      .lean();

    return NextResponse.json({ success: true, message: 'OK', data: slides });
  } catch (error) {
    console.error('slides error:', error);
    return NextResponse.json({ success: true, message: 'OK', data: [] });
  }
}
