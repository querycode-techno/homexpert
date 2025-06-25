import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'homexpert-dev-secret-2024';

export async function POST(request) {
  try {
    const {
      // Personal Information
      name,
      email,
      phone,
      password,
      
      // Business Information
      businessName,
      services,
      
      // Address
      address,
      
      // Optional: Documents can be uploaded later
      documents = {}
    } = await request.json();

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json({
        success: false,
        error: 'Name, email, phone, and password are required'
      }, { status: 400 });
    }

    if (!businessName || !services || services.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Business name and at least one service are required'
      }, { status: 400 });
    }

    if (!address?.street || !address?.city || !address?.state || !address?.pincode) {
      return NextResponse.json({
        success: false,
        error: 'Complete address information is required'
      }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 6 characters long'
      }, { status: 400 });
    }

    // Get database collections
    const usersCollection = await database.getUsersCollection();
    const vendorsCollection = await database.getVendorsCollection();
    const rolesCollection = await database.getRolesCollection();

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [{ email: email.toLowerCase() }, { phone: phone.trim() }]
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User with this email or phone already exists'
      }, { status: 400 });
    }

    // Get vendor role
    const vendorRole = await rolesCollection.findOne({ name: 'vendor' });
    if (!vendorRole) {
      return NextResponse.json({
        success: false,
        error: 'Vendor role not found. Please contact support.'
      }, { status: 500 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user first
    const userResult = await usersCollection.insertOne({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
      role: vendorRole._id,
      profileImage: "",
      address: {
        street: address.street?.trim(),
        city: address.city?.trim(),
        state: address.state?.trim(),
        pincode: address.pincode?.trim(),
        country: 'India'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create vendor record
    const vendorData = {
      user: userResult.insertedId,
      businessName: businessName.trim(),
      services: services.map(s => s.trim()),
      address: {
        street: address.street.trim(),
        area: address.area?.trim() || "",
        city: address.city.trim(),
        state: address.state.trim(),
        pincode: address.pincode.trim(),
        serviceAreas: []
      },
      documents: {
        aadharCard: {
          number: documents?.aadharCard?.number || "",
          imageUrl: documents?.aadharCard?.imageUrl || "",
          verified: false
        },
        panCard: {
          number: documents?.panCard?.number || "",
          imageUrl: documents?.panCard?.imageUrl || "",
          verified: false
        },
        businessLicense: {
          number: documents?.businessLicense?.number || "",
          imageUrl: documents?.businessLicense?.imageUrl || "",
          verified: false
        },
        bankDetails: {
          accountNumber: documents?.bankDetails?.accountNumber || "",
          ifscCode: documents?.bankDetails?.ifscCode || "",
          accountHolderName: documents?.bankDetails?.accountHolderName || "",
          verified: false
        }
      },
      verified: {
        isVerified: false,
        verificationNotes: "Vendor registered via mobile app - pending verification"
      },
      status: "pending",
      rating: 0,
      totalJobs: 0,
      history: [
        {
          action: "registered",
          date: new Date(),
          notes: "Vendor registered via mobile app"
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const vendorResult = await vendorsCollection.insertOne(vendorData);

    // Create JWT payload for auto-login
    const tokenPayload = {
      userId: userResult.insertedId.toString(),
      vendorId: vendorResult.insertedId.toString(),
      email: email.toLowerCase(),
      phone: phone.trim(),
      name: name.trim(),
      role: 'vendor',
      verified: false,
      status: 'pending'
    };

    // Generate tokens
    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { 
      expiresIn: '24h',
      issuer: 'homexpert-vendor',
      audience: 'vendor-mobile-app'
    });

    const refreshToken = jwt.sign(
      { userId: userResult.insertedId.toString(), type: 'refresh' }, 
      JWT_SECRET, 
      { 
        expiresIn: '7d',
        issuer: 'homexpert-vendor',
        audience: 'vendor-mobile-app'
      }
    );

    // Return success response with auto-login data
    return NextResponse.json({
      success: true,
      message: 'Vendor registration successful',
      data: {
        user: {
          id: userResult.insertedId.toString(),
          name: name.trim(),
          email: email.toLowerCase(),
          phone: phone.trim(),
          profileImage: ""
        },
        vendor: {
          id: vendorResult.insertedId.toString(),
          businessName: businessName.trim(),
          services: services.map(s => s.trim()),
          status: 'pending',
          verified: false,
          rating: 0,
          totalJobs: 0,
          address: vendorData.address
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 86400 // 24 hours in seconds
        },
        message: "Registration successful! Your account is pending verification. You can still access your dashboard."
      }
    });

  } catch (error) {
    console.error('Vendor registration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 