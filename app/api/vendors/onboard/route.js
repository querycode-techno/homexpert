import { NextResponse } from 'next/server'
import { database } from '@/lib/db'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'

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
      businessDescription,
      
      // Address
      address,
      
      // Documents
      documents,
      
      // Status and verification
      status = "pending",
      verified = { isVerified: false, verificationNotes: "" }
    } = await request.json()

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json({
        success: false,
        error: 'Personal information is required'
      }, { status: 400 })
    }

    if (!businessName || !services || services.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Business name and at least one service are required'
      }, { status: 400 })
    }

    if (!address?.street || !address?.city || !address?.state || !address?.pincode) {
      return NextResponse.json({
        success: false,
        error: 'Complete address information is required'
      }, { status: 400 })
    }

    // Get database collections
    const usersCollection = await database.getUsersCollection()
    const vendorsCollection = await database.getVendorsCollection()
    const rolesCollection = await database.getRolesCollection()

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [{ email }, { phone }]
    })

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User with this email or phone already exists'
      }, { status: 400 })
    }

    // Get vendor role
    const vendorRole = await rolesCollection.findOne({ name: 'vendor' })
    if (!vendorRole) {
      return NextResponse.json({
        success: false,
        error: 'Vendor role not found'
      }, { status: 500 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user first
    const userResult = await usersCollection.insertOne({
      name,
      email,
      phone,
      password: hashedPassword,
      role: vendorRole._id,
      profileImage: "",
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Create vendor record
    const vendorData = {
      user: userResult.insertedId,
      businessName,
      services,
      businessDescription: businessDescription || "",
      address: {
        street: address.street,
        area: address.area || "",
        city: address.city,
        state: address.state,
        pincode: address.pincode,
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
        verificationNotes: "Vendor registered via onboarding form - pending verification",
        verifiedAt: null,
        verifiedBy: null
      },
      status: "pending",
      rating: 0,
      totalJobs: 0,
      history: [
        {
          action: "registered",
          date: new Date(),
          notes: "Vendor registered via onboarding form"
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const vendorResult = await vendorsCollection.insertOne(vendorData)

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Vendor application submitted successfully',
      data: {
        vendorId: vendorResult.insertedId,
        userId: userResult.insertedId,
        status: 'pending'
      }
    })

  } catch (error) {
    console.error('Error in vendor onboarding:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
} 