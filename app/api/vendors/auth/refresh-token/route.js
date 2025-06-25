import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'homexpert-dev-secret-2024';

export async function POST(request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json({
        success: false,
        error: 'Refresh token is required'
      }, { status: 400 });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET, {
        issuer: 'homexpert-vendor',
        audience: 'vendor-mobile-app'
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired refresh token'
      }, { status: 401 });
    }

    if (decoded.type !== 'refresh') {
      return NextResponse.json({
        success: false,
        error: 'Invalid token type'
      }, { status: 401 });
    }

    // Get database collections
    const usersCollection = await database.getUsersCollection();
    const vendorsCollection = await database.getVendorsCollection();
    const rolesCollection = await database.getRolesCollection();

    // Find user
    const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Get user role
    const role = await rolesCollection.findOne({ _id: user.role });
    
    if (!role || role.name !== 'vendor') {
      return NextResponse.json({
        success: false,
        error: 'Invalid user role'
      }, { status: 403 });
    }

    // Get vendor details
    const vendor = await vendorsCollection.findOne({ user: user._id });
    
    if (!vendor) {
      return NextResponse.json({
        success: false,
        error: 'Vendor profile not found'
      }, { status: 404 });
    }

    // Check if vendor account is still active
    if (vendor.status === 'suspended' || vendor.status === 'inactive') {
      return NextResponse.json({
        success: false,
        error: 'Your account has been suspended. Please contact support.'
      }, { status: 403 });
    }

    // Create new JWT payload with updated data
    const tokenPayload = {
      userId: user._id.toString(),
      vendorId: vendor._id.toString(),
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: role.name,
      verified: vendor.verified.isVerified,
      status: vendor.status
    };

    // Generate new access token
    const newAccessToken = jwt.sign(tokenPayload, JWT_SECRET, { 
      expiresIn: '24h',
      issuer: 'homexpert-vendor',
      audience: 'vendor-mobile-app'
    });

    // Generate new refresh token
    const newRefreshToken = jwt.sign(
      { userId: user._id.toString(), type: 'refresh' }, 
      JWT_SECRET, 
      { 
        expiresIn: '7d',
        issuer: 'homexpert-vendor',
        audience: 'vendor-mobile-app'
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: 86400 // 24 hours in seconds
        }
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 