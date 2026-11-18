import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { verifyOtp, normalizePhone } from '@/lib/users/userAuthHelpers';

export async function POST(request) {
  try {
    const { identifier, otp, newPassword } = await request.json();

    if (!identifier || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'All fields required', errorCode: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const usersCollection = await database.getUsersCollection();
    const isPhone = /^\d+$/.test(String(identifier).replace(/\D/g, ''));
    const query = isPhone
      ? { phone: normalizePhone(identifier) }
      : { email: identifier.toLowerCase() };

    const user = await usersCollection.findOne({ ...query, type: 'user' });
    if (!user || !user.otpHash) {
      return NextResponse.json(
        { success: false, message: 'Invalid request', errorCode: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const valid = await verifyOtp(String(otp), user.otpHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: 'Invalid OTP', errorCode: 'INVALID_OTP' },
        { status: 401 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { password: hashed, otpHash: null, otpExpiresAt: null, updatedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: 'Password reset successful',
      data: null,
    });
  } catch (error) {
    console.error('reset-password error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', errorCode: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
