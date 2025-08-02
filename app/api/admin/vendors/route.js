import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { requireAdmin } from '@/lib/dal';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// GET /api/admin/vendors - Get all vendors
export async function GET(request) {
  try {
    const { user, role } = await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const city = searchParams.get('city') || '';
    const service = searchParams.get('service') || '';
    const verified = searchParams.get('verified');

    const vendorsCollection = await database.getVendorsCollection();
    const usersCollection = await database.getUsersCollection();

    // Build query
    let query = {};
    
    // Role-based filtering: Only admins see all vendors, others see only their onboarded vendors
    if (role.name !== 'admin') {
      query.onboardedBy = new ObjectId(user.id);
    }
    
    // Search across multiple fields
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { services: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by city
    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }

    // Filter by service
    if (service) {
      query.services = { $regex: service, $options: 'i' };
    }

    // Filter by verification
    console.log('DEBUG VENDORS: verified param:', verified, 'type:', typeof verified);
    if (verified && verified !== 'all' && verified !== '') {
      if (verified === 'verified') {
        query['verified.isVerified'] = true;
      } else if (verified === 'unverified') {
        query['verified.isVerified'] = false;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Debug logging - let's see what's actually in the database
    console.log('DEBUG VENDORS: Starting debug...');
    
    // Check vendors collection
    const allVendorsCount = await vendorsCollection.countDocuments({});
    const allVendors = await vendorsCollection.find({}).limit(3).toArray();
    console.log('DEBUG VENDORS: Total vendors in collection:', allVendorsCount);
    console.log('DEBUG VENDORS: Sample vendors:', allVendors.map(v => ({
      id: v._id,
      businessName: v.businessName,
      userRef: v.user,
      userRefType: typeof v.user,
      status: v.status
    })));
    
    // Check users collection
    const usersCount = await usersCollection.countDocuments({});
    const sampleUsers = await usersCollection.find({}).limit(3).toArray();
    console.log('DEBUG VENDORS: Total users in collection:', usersCount);
    console.log('DEBUG VENDORS: Sample users:', sampleUsers.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role
    })));
    
    // Test lookup manually for first vendor
    if (allVendors.length > 0) {
      const testVendor = allVendors[0];
      console.log('DEBUG VENDORS: Testing lookup for vendor:', testVendor._id, 'user ref:', testVendor.user);
      
      const userLookupTest = await usersCollection.findOne({ _id: testVendor.user });
      console.log('DEBUG VENDORS: Direct user lookup result:', userLookupTest ? {
        id: userLookupTest._id,
        name: userLookupTest.name,
        email: userLookupTest.email
      } : 'No user found with ID: ' + testVendor.user);
    }

    // Debug the query object
    console.log('DEBUG VENDORS: Query object:', JSON.stringify(query, null, 2));
    
    // Check if we want to show ALL users with vendor role (including those without vendor profiles)
    // or only actual vendors (with vendor profiles)
    const showAllVendorUsers = true; // Set to true to include users without vendor profiles

    let vendors;
    let total;
    
    if (showAllVendorUsers) {
      // Start from users collection to get ALL users with vendor role
      const rolesCollection = await database.getRolesCollection();
      const vendorRole = await rolesCollection.findOne({ name: 'vendor' });
      
      if (!vendorRole) {
        throw new Error('Vendor role not found');
      }

      // Build user query
      let userQuery = { role: vendorRole._id };
      
      // Add search to user fields
      if (search) {
        userQuery.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { 'address.city': { $regex: search, $options: 'i' } }
        ];
      }

      // Get total count for users with vendor role
      total = await usersCollection.countDocuments(userQuery);
      console.log('DEBUG VENDORS: Total vendor users count:', total);

      vendors = await usersCollection.aggregate([
        { $match: userQuery },
        {
          $lookup: {
            from: 'vendors',
            localField: '_id',
            foreignField: 'user',
            as: 'vendorData'
          }
        },
        {
          $addFields: {
            // If vendor data exists, use it; otherwise create default values
            businessName: {
              $cond: [
                { $gt: [{ $size: '$vendorData' }, 0] },
                { $arrayElemAt: ['$vendorData.businessName', 0] },
                '$name' // Use user name as fallback
              ]
            },
            services: {
              $cond: [
                { $gt: [{ $size: '$vendorData' }, 0] },
                { $arrayElemAt: ['$vendorData.services', 0] },
                [] // Empty services array
              ]
            },
            status: {
              $cond: [
                { $gt: [{ $size: '$vendorData' }, 0] },
                { $arrayElemAt: ['$vendorData.status', 0] },
                'incomplete' // Special status for users without vendor profile
              ]
            },
            verified: {
              $cond: [
                { $gt: [{ $size: '$vendorData' }, 0] },
                { $arrayElemAt: ['$vendorData.verified', 0] },
                { isVerified: false }
              ]
            },
            rating: {
              $cond: [
                { $gt: [{ $size: '$vendorData' }, 0] },
                { $arrayElemAt: ['$vendorData.rating', 0] },
                0
              ]
            },
            totalJobs: {
              $cond: [
                { $gt: [{ $size: '$vendorData' }, 0] },
                { $arrayElemAt: ['$vendorData.totalJobs', 0] },
                0
              ]
            },
            vendorId: {
              $cond: [
                { $gt: [{ $size: '$vendorData' }, 0] },
                { $arrayElemAt: ['$vendorData._id', 0] },
                null
              ]
            },
            userData: {
              _id: '$_id',
              name: '$name',
              email: '$email',
              phone: '$phone',
              profileImage: '$profileImage'
            },
            address: '$address',
            createdAt: '$createdAt'
          }
        },
        { $project: { vendorData: 0, password: 0 } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ]).toArray();

      console.log('DEBUG VENDORS: Showing ALL vendor users (including incomplete profiles)');
    } else {
      // Original approach: only show actual vendors (with vendor profiles)
      console.log('DEBUG VENDORS: Showing only vendors with complete profiles');
      
      // Get total count for vendors
      total = await vendorsCollection.countDocuments(query);
      console.log('DEBUG VENDORS: Total vendors count:', total);
      
      vendors = await vendorsCollection.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData',
          pipeline: [
            { $project: { password: 0 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'onboardedBy',
          foreignField: '_id',
          as: 'onboardedByUser',
          pipeline: [
            { $project: { name: 1, email: 1, role: 1 } }
          ]
        }
      },
      { $unwind: '$userData' },
      {
        $addFields: {
          onboardedByUser: { $arrayElemAt: ['$onboardedByUser', 0] }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]).toArray();
    }

    // Debug logging
    console.log('DEBUG VENDORS: Found', vendors.length, 'vendors with filters:', { 
      status, verified, service, city, search 
    });
    
    if (vendors.length > 0) {
      console.log('DEBUG VENDORS: Sample vendor structure:', {
        businessName: vendors[0].businessName,
        status: vendors[0].status,
        verified: vendors[0].verified,
        services: vendors[0].services,
        city: vendors[0].address?.city
      });
    } else {
      console.log('DEBUG VENDORS: No vendors after $unwind - user lookup failed');
    }

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get summary stats (with same logic as main vendor list)
    let statusStats = {
      pending: 0,
      active: 0,
      suspended: 0,
      inactive: 0,
      incomplete: 0
    };

    if (showAllVendorUsers) {
      // Count all users with vendor role and their statuses
      const rolesCollection = await database.getRolesCollection();
      const vendorRole = await rolesCollection.findOne({ name: 'vendor' });
      
      if (vendorRole) {
        const allVendorUsers = await usersCollection.aggregate([
          { $match: { role: vendorRole._id } },
          {
            $lookup: {
              from: 'vendors',
              localField: '_id',
              foreignField: 'user',
              as: 'vendorData'
            }
          },
          {
            $addFields: {
              status: {
                $cond: [
                  { $gt: [{ $size: '$vendorData' }, 0] },
                  { $arrayElemAt: ['$vendorData.status', 0] },
                  'incomplete'
                ]
              }
            }
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]).toArray();

        allVendorUsers.forEach(stat => {
          statusStats[stat._id] = stat.count;
        });
      }
    } else {
      // Original vendor-only stats
      let statsQuery = {};
      if (role.name !== 'admin') {
        statsQuery.onboardedBy = new ObjectId(user.id);
      }
      
      const stats = await vendorsCollection.aggregate([
        { $match: statsQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      stats.forEach(stat => {
        statusStats[stat._id] = stat.count;
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        vendors,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage
        },
        stats: statusStats
      }
    });

  } catch (error) {
    console.error('Error fetching vendors:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch vendors',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/vendors - Create new vendor
export async function POST(request) {
  try {
    const { user } = await requireAdmin();

    const body = await request.json();
    const { 
      name, 
      email, 
      phone, 
      password, 
      businessName, 
      services, 
      address,
      documents,
      profileImage 
    } = body;

    // Validation
    if (!name || !email || !phone || !password || !businessName || !services || !address) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: name, email, phone, password, businessName, services, address' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email format' 
        },
        { status: 400 }
      );
    }

    // Validate phone format
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid phone format' 
        },
        { status: 400 }
      );
    }

    // Validate services array
    if (!Array.isArray(services) || services.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Services must be a non-empty array' 
        },
        { status: 400 }
      );
    }

    // Validate address
    if (!address.street || !address.city || !address.state || !address.pincode) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Address must include street, city, state, and pincode' 
        },
        { status: 400 }
      );
    }

    const usersCollection = await database.getUsersCollection();
    const vendorsCollection = await database.getVendorsCollection();
    const rolesCollection = await database.getRolesCollection();

    // Get vendor role
    const vendorRole = await rolesCollection.findOne({ name: 'vendor' });
    if (!vendorRole) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Vendor role not found. Please create vendor role first.' 
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email already exists' 
        },
        { status: 409 }
      );
    }

    // Check if phone already exists
    const existingPhone = await usersCollection.findOne({ phone });
    if (existingPhone) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Phone number already exists' 
        },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user data
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
      role: vendorRole._id,
      profileImage: profileImage || null,
      address: {
        street: address.street?.trim(),
        city: address.city?.trim(),
        state: address.state?.trim(),
        pincode: address.pincode?.trim(),
        country: address.country || 'India'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create user first
    const userResult = await usersCollection.insertOne(userData);

    // Create vendor data
    const vendorData = {
      user: userResult.insertedId,
      businessName: businessName.trim(),
      services: services.map(s => s.trim()),
      address: {
        street: address.street.trim(),
        area: address.area?.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        pincode: address.pincode.trim(),
        serviceAreas: address.serviceAreas || []
      },
      documents: documents || {
        identity: {
          type: "",
          number: "",
          docImageUrl: ""
        },
        business: {
          type: "",
          number: "",
          docImageUrl: ""
        }
      },
      verified: {
        isVerified: false
      },
      status: 'pending',
      rating: 0,
      totalJobs: 0,
      onboardedBy: new ObjectId(user.id), // Set who onboarded this vendor
      history: [{
        action: 'registered',
        date: new Date(),
        performedBy: new ObjectId(user.id),
        notes: `Vendor registered by ${user.name || 'admin'}`
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create vendor
    const vendorResult = await vendorsCollection.insertOne(vendorData);

    // Fetch created vendor with user data
    const newVendor = await vendorsCollection.aggregate([
      { $match: { _id: vendorResult.insertedId } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData',
          pipeline: [
            { $project: { password: 0 } }
          ]
        }
      },
      { $unwind: '$userData' }
    ]).toArray();

    return NextResponse.json({
      success: true,
      message: 'Vendor created successfully',
      data: newVendor[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating vendor:', error);

    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        { 
          success: false, 
          error: `${field} already exists` 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create vendor',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 