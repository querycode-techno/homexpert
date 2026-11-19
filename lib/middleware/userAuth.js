import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not set');
}
const JWT_SECRET = process.env.NEXTAUTH_SECRET;

export function verifyUserToken(request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return { success: false, error: 'Authorization header missing', status: 401 };
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return { success: false, error: 'Access token missing', status: 401 };
    }

    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'homexpert-user',
      audience: 'user-mobile-app',
    });

    if (decoded.type === 'refresh') {
      return { success: false, error: 'Invalid token type. Use access token.', status: 401 };
    }

    return {
      success: true,
      user: {
        userId: decoded.userId,
        email: decoded.email,
        phone: decoded.phone,
        name: decoded.name,
        role: decoded.role,
      },
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { success: false, error: 'Access token expired. Please refresh token.', status: 401 };
    }
    if (error.name === 'JsonWebTokenError') {
      return { success: false, error: 'Invalid access token', status: 401 };
    }
    return { success: false, error: 'Token verification failed', status: 500 };
  }
}

export function createUserAuthErrorResponse(error, status) {
  return NextResponse.json({ success: false, message: error, errorCode: 'AUTH_ERROR' }, { status });
}

export function withUserAuth(handler) {
  return async (request, params) => {
    const authResult = verifyUserToken(request);

    if (!authResult.success) {
      return createUserAuthErrorResponse(authResult.error, authResult.status);
    }

    request.userAuth = authResult.user;
    return handler(request, params);
  };
}
