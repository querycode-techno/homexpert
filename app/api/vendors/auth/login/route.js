import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'homexpert-dev-secret-2024';

export async function POST(request) {
  try {
    const { phone, password } = await request.json();

    // Validate input
    if (!phone || !password) {
      return NextResponse.json({
        success: false,
        error: 'Phone and password are required'
      }, { status: 400 });
    }

    // Get database collections
    const usersCollection = await database.getUsersCollection();
    const vendorsCollection = await database.getVendorsCollection();
    const rolesCollection = await database.getRolesCollection();

    // Find user by phone
    const user = await usersCollection.findOne({ phone: phone.trim() });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid phone number or password'
      }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        error: 'Invalid phone number or password'
      }, { status: 401 });
    }

    // Get user role
    const role = await rolesCollection.findOne({ _id: user.role });
    
    if (!role || role.name !== 'vendor') {
      return NextResponse.json({
        success: false,
        error: 'Access denied. Vendor account required.'
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

    // Check if vendor account is active
    if (vendor.status === 'suspended' || vendor.status === 'inactive') {
      return NextResponse.json({
        success: false,
        error: 'Your account has been suspended. Please contact support.'
      }, { status: 403 });
    }

    // Create JWT payload
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

    // Generate tokens
    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { 
      expiresIn: '24h',
      issuer: 'homexpert-vendor',
      audience: 'vendor-mobile-app'
    });

    const refreshToken = jwt.sign(
      { userId: user._id.toString(), type: 'refresh' }, 
      JWT_SECRET, 
      { 
        expiresIn: '7d',
        issuer: 'homexpert-vendor',
        audience: 'vendor-mobile-app'
      }
    );

    // Prepare response data (exclude sensitive info)
    const responseData = {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage
      },
      vendor: {
        id: vendor._id.toString(),
        businessName: vendor.businessName,
        services: vendor.services,
        status: vendor.status,
        verified: vendor.verified.isVerified,
        rating: vendor.rating,
        totalJobs: vendor.totalJobs,
        address: vendor.address
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 86400 // 24 hours in seconds
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: responseData
    });

  } catch (error) {
    console.error('Vendor login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 