import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { generateOtp, hashOtp, normalizePhone } from '@/lib/users/userAuthHelpers';

export async function POST(request) {
  try {
    const { identifier } = await request.json();
    if (!identifier) {
      return NextResponse.json(
        { success: false, message: 'Email or phone required', errorCode: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const usersCollection = await database.getUsersCollection();
    const isPhone = /^\d+$/.test(String(identifier).replace(/\D/g, ''));
    const query = isPhone
      ? { phone: normalizePhone(identifier) }
      : { email: identifier.toLowerCase() };

    const user = await usersCollection.findOne({ ...query, type: 'user' });
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a reset code has been sent',
        data: null,
      });
    }

    const otp = generateOtp();
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { otpHash: await hashOtp(otp), otpExpiresAt: new Date(Date.now() + 15 * 60 * 1000) } }
    );

    const response = {
      success: true,
      message: 'Reset code sent',
      data: { expiresIn: 900 },
    };
    if (process.env.NODE_ENV === 'development') response.data.devOtp = otp;

    return NextResponse.json(response);
  } catch (error) {
    console.error('forgot-password error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', errorCode: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
