import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import bcrypt from 'bcryptjs';
import {
  generateUserTokens,
  formatUserResponse,
  normalizePhone,
} from '@/lib/users/userAuthHelpers';

export async function POST(request) {
  try {
    const { phone, password } = await request.json();
    const normalized = normalizePhone(phone);

    if (!normalized || !password) {
      return NextResponse.json(
        { success: false, message: 'Phone and password required', errorCode: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const usersCollection = await database.getUsersCollection();
    const user = await usersCollection.findOne({ phone: normalized, type: 'user' });

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone or password', errorCode: 'AUTH_FAILED' },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone or password', errorCode: 'AUTH_FAILED' },
        { status: 401 }
      );
    }

    const tokens = generateUserTokens(user);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: formatUserResponse(user),
        tokens,
      },
    });
  } catch (error) {
    console.error('user login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', errorCode: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
