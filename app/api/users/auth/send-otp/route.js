import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import {
  generateOtp,
  hashOtp,
  normalizePhone,
} from '@/lib/users/userAuthHelpers';

export async function POST(request) {
  try {
    const { phone } = await request.json();
    const normalized = normalizePhone(phone);

    if (!normalized || normalized.length !== 10) {
      return NextResponse.json(
        { success: false, message: 'Valid 10-digit mobile number required', errorCode: 'INVALID_PHONE' },
        { status: 400 }
      );
    }

    const usersCollection = await database.getUsersCollection();
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const existing = await usersCollection.findOne({ phone: normalized });
    if (existing) {
      await usersCollection.updateOne(
        { _id: existing._id },
        { $set: { otpHash, otpExpiresAt, otpAttempts: 0 } }
      );
    } else {
      await usersCollection.insertOne({
        phone: normalized,
        name: 'User',
        email: `${normalized}@homesxpert.user`,
        type: 'user',
        otpHash,
        otpExpiresAt,
        otpAttempts: 0,
        addresses: [],
        notificationPrefs: { pushEnabled: true, marketingEnabled: true, cartRecoveryEnabled: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const response = {
      success: true,
      message: 'OTP sent successfully',
      data: { phone: normalized, expiresIn: 600 },
    };

    if (process.env.NODE_ENV === 'development') {
      response.data.devOtp = otp;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('send-otp error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', errorCode: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
