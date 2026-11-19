import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { generateUserTokens, formatUserResponse } from '@/lib/users/userAuthHelpers';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not set');
}
const JWT_SECRET = process.env.NEXTAUTH_SECRET;

export async function POST(request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token required', errorCode: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET, {
        issuer: 'homexpert-user',
        audience: 'user-mobile-app',
      });
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid refresh token', errorCode: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    if (decoded.type !== 'refresh') {
      return NextResponse.json(
        { success: false, message: 'Invalid token type', errorCode: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const usersCollection = await database.getUsersCollection();
    const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId), type: 'user' });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found', errorCode: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const tokens = generateUserTokens(user);

    return NextResponse.json({
      success: true,
      message: 'Token refreshed',
      data: { tokens, user: formatUserResponse(user) },
    });
  } catch (error) {
    console.error('refresh error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', errorCode: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
