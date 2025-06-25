import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'homexpert-dev-secret-2024';

export function verifyVendorToken(request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return {
        success: false,
        error: 'Authorization header missing',
        status: 401
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return {
        success: false,
        error: 'Access token missing',
        status: 401
      };
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'homexpert-vendor',
      audience: 'vendor-mobile-app'
    });

    // Check if it's not a refresh token
    if (decoded.type === 'refresh') {
      return {
        success: false,
        error: 'Invalid token type. Use access token.',
        status: 401
      };
    }

    // Return decoded token data
    return {
      success: true,
      user: {
        userId: decoded.userId,
        vendorId: decoded.vendorId,
        email: decoded.email,
        phone: decoded.phone,
        name: decoded.name,
        role: decoded.role,
        verified: decoded.verified,
        status: decoded.status
      }
    };

  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return {
        success: false,
        error: 'Access token expired. Please refresh token.',
        status: 401
      };
    }
    
    if (error.name === 'JsonWebTokenError') {
      return {
        success: false,
        error: 'Invalid access token',
        status: 401
      };
    }

    return {
      success: false,
      error: 'Token verification failed',
      status: 500
    };
  }
}

export function createAuthErrorResponse(error, status) {
  return NextResponse.json(
    {
      success: false,
      error: error
    },
    { status }
  );
}

// Middleware wrapper for protected routes
export function withVendorAuth(handler) {
  return async (request, params) => {
    const authResult = verifyVendorToken(request);
    
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error, authResult.status);
    }

    // Add user data to request for use in handler
    request.vendorUser = authResult.user;
    
    return handler(request, params);
  };
} 