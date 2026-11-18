import { NextResponse } from 'next/server';
import { verifyUserToken } from '@/lib/middleware/userAuth';

export async function POST(request) {
  const authResult = verifyUserToken(request);
  if (!authResult.success) {
    return NextResponse.json(
      { success: false, message: authResult.error, errorCode: 'AUTH_ERROR' },
      { status: authResult.status }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Logged out successfully',
    data: null,
  });
}
