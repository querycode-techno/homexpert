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
    const { name, email, phone, password } = await request.json();
    const normalized = normalizePhone(phone);

    if (!name || !email || !normalized || !password) {
      return NextResponse.json(
        { success: false, message: 'All fields required', errorCode: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters', errorCode: 'WEAK_PASSWORD' },
        { status: 400 }
      );
    }

    const usersCollection = await database.getUsersCollection();
    const existing = await usersCollection.findOne({
      $or: [{ phone: normalized }, { email: email.toLowerCase() }],
    });

    if (existing?.password && existing.type === 'user') {
      return NextResponse.json(
        { success: false, message: 'Account already exists', errorCode: 'DUPLICATE_USER' },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    const doc = {
      name,
      email: email.toLowerCase(),
      phone: normalized,
      password: hashed,
      type: 'user',
      addresses: [],
      notificationPrefs: { pushEnabled: true, marketingEnabled: true, cartRecoveryEnabled: true },
      updatedAt: new Date(),
    };

    let user;
    if (existing) {
      await usersCollection.updateOne({ _id: existing._id }, { $set: doc });
      user = await usersCollection.findOne({ _id: existing._id });
    } else {
      doc.createdAt = new Date();
      const result = await usersCollection.insertOne(doc);
      user = await usersCollection.findOne({ _id: result.insertedId });
    }

    const tokens = generateUserTokens(user);

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: { user: formatUserResponse(user), tokens },
    });
  } catch (error) {
    console.error('register error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', errorCode: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
