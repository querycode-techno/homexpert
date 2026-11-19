import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not set');
}
const JWT_SECRET = process.env.NEXTAUTH_SECRET;

export function generateUserTokens(user, roleName = 'user') {
  const tokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    phone: user.phone,
    name: user.name,
    role: roleName,
  };

  const accessToken = jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: '30d',
    issuer: 'homexpert-user',
    audience: 'user-mobile-app',
  });

  const refreshToken = jwt.sign(
    { userId: user._id.toString(), type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '90d', issuer: 'homexpert-user', audience: 'user-mobile-app' }
  );

  return { accessToken, refreshToken, expiresIn: 2592000 };
}

export function formatUserResponse(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    profileImage: user.profileImage || null,
    notificationPrefs: user.notificationPrefs || {},
    preferredCategories: user.preferredCategories || [],
    addresses: user.addresses || [],
  };
}

export function generateOtp() {
  return process.env.NODE_ENV === 'development' ? '123456' : String(Math.floor(100000 + Math.random() * 900000));
}

export async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

export async function verifyOtp(otp, hash) {
  return bcrypt.compare(otp, hash);
}

export function normalizePhone(phone) {
  return String(phone).replace(/\D/g, '').slice(-10);
}

export function apiSuccess(data, message = 'OK') {
  return { success: true, data, message };
}

export function apiError(message, errorCode = 'ERROR', status = 400) {
  return { body: { success: false, data: null, message, errorCode }, status };
}
