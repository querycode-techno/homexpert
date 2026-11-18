import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import bcrypt from 'bcryptjs';
import {
  generateUserTokens,
  formatUserResponse,
  verifyOtp,
  normalizePhone,
} from '@/lib/users/userAuthHelpers';

export async function POST(request) {
  try {
    const { phone, otp, name, email } = await request.json();
    const normalized = normalizePhone(phone);

    if (!normalized || !otp) {
      return NextResponse.json(
        { success: false, message: 'Phone and OTP required', errorCode: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const usersCollection = await database.getUsersCollection();
    const user = await usersCollection.findOne({ phone: normalized });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found. Request OTP first.', errorCode: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (user.otpExpiresAt && new Date() > new Date(user.otpExpiresAt)) {
      return NextResponse.json(
        { success: false, message: 'OTP expired', errorCode: 'OTP_EXPIRED' },
        { status: 400 }
      );
    }

    const valid = user.otpHash ? await verifyOtp(String(otp), user.otpHash) : false;
    if (!valid) {
      await usersCollection.updateOne({ _id: user._id }, { $inc: { otpAttempts: 1 } });
      return NextResponse.json(
        { success: false, message: 'Invalid OTP', errorCode: 'INVALID_OTP' },
        { status: 401 }
      );
    }

    const updates = {
      otpHash: null,
      otpExpiresAt: null,
      otpAttempts: 0,
      type: 'user',
      updatedAt: new Date(),
    };
    if (name) updates.name = name;
    if (email) updates.email = email.toLowerCase();

    await usersCollection.updateOne({ _id: user._id }, { $set: updates });
    const updatedUser = await usersCollection.findOne({ _id: user._id });
    const tokens = generateUserTokens(updatedUser);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: formatUserResponse(updatedUser),
        tokens,
      },
    });
  } catch (error) {
    console.error('verify-otp error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', errorCode: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
