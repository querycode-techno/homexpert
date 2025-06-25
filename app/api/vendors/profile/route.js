import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// GET /api/vendors/profile - Get vendor profile
export async function GET(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;

    // Get database collections
    const usersCollection = await database.getUsersCollection();
    const vendorsCollection = await database.getVendorsCollection();

    // Get vendor with user data
    const vendor = await vendorsCollection.aggregate([
      { $match: { _id: new ObjectId(vendorId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData',
          pipeline: [
            { $project: { password: 0 } } // Exclude password
          ]
        }
      },
      { $unwind: '$userData' }
    ]).toArray();

    if (!vendor.length) {
      return NextResponse.json({
        success: false,
        error: 'Vendor profile not found'
      }, { status: 404 });
    }

    const vendorData = vendor[0];

    // Return profile data
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: vendorData.userData._id.toString(),
          name: vendorData.userData.name,
          email: vendorData.userData.email,
          phone: vendorData.userData.phone,
          profileImage: vendorData.userData.profileImage,
          address: vendorData.userData.address
        },
        vendor: {
          id: vendorData._id.toString(),
          businessName: vendorData.businessName,
          services: vendorData.services,
          address: vendorData.address,
          documents: vendorData.documents,
          verified: vendorData.verified,
          status: vendorData.status,
          rating: vendorData.rating,
          totalJobs: vendorData.totalJobs,
          createdAt: vendorData.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch profile'
    }, { status: 500 });
  }
}

// PUT /api/vendors/profile - Update vendor profile
export async function PUT(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;
    const updateData = await request.json();

    // Get database collections
    const usersCollection = await database.getUsersCollection();
    const vendorsCollection = await database.getVendorsCollection();

    // Separate user and vendor updates
    const userUpdates = {};
    const vendorUpdates = {};

    // Handle user data updates
    if (updateData.name) {
      userUpdates.name = updateData.name.trim();
    }
    
    if (updateData.email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid email format'
        }, { status: 400 });
      }

      // Check if email already exists for another user
      const existingEmail = await usersCollection.findOne({
        email: updateData.email.toLowerCase(),
        _id: { $ne: new ObjectId(userId) }
      });

      if (existingEmail) {
        return NextResponse.json({
          success: false,
          error: 'Email already exists'
        }, { status: 400 });
      }

      userUpdates.email = updateData.email.toLowerCase().trim();
    }

    if (updateData.phone) {
      // Check if phone already exists for another user
      const existingPhone = await usersCollection.findOne({
        phone: updateData.phone.trim(),
        _id: { $ne: new ObjectId(userId) }
      });

      if (existingPhone) {
        return NextResponse.json({
          success: false,
          error: 'Phone number already exists'
        }, { status: 400 });
      }

      userUpdates.phone = updateData.phone.trim();
    }

    if (updateData.profileImage !== undefined) {
      userUpdates.profileImage = updateData.profileImage;
    }

    if (updateData.address) {
      userUpdates.address = updateData.address;
    }

    // Handle vendor data updates
    if (updateData.businessName) {
      vendorUpdates.businessName = updateData.businessName.trim();
    }

    if (updateData.services && Array.isArray(updateData.services)) {
      vendorUpdates.services = updateData.services.map(s => s.trim());
    }

    if (updateData.vendorAddress) {
      vendorUpdates.address = updateData.vendorAddress;
    }

    if (updateData.documents) {
      vendorUpdates.documents = updateData.documents;
    }

    // Update timestamps
    if (Object.keys(userUpdates).length > 0) {
      userUpdates.updatedAt = new Date();
    }
    if (Object.keys(vendorUpdates).length > 0) {
      vendorUpdates.updatedAt = new Date();
    }

    // Perform updates
    const updatePromises = [];

    if (Object.keys(userUpdates).length > 0) {
      updatePromises.push(
        usersCollection.updateOne(
          { _id: new ObjectId(userId) },
          { $set: userUpdates }
        )
      );
    }

    if (Object.keys(vendorUpdates).length > 0) {
      updatePromises.push(
        vendorsCollection.updateOne(
          { _id: new ObjectId(vendorId) },
          { $set: vendorUpdates }
        )
      );
    }

    await Promise.all(updatePromises);

    // Fetch updated profile data
    const updatedVendor = await vendorsCollection.aggregate([
      { $match: { _id: new ObjectId(vendorId) } },
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

    const vendorData = updatedVendor[0];

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: vendorData.userData._id.toString(),
          name: vendorData.userData.name,
          email: vendorData.userData.email,
          phone: vendorData.userData.phone,
          profileImage: vendorData.userData.profileImage,
          address: vendorData.userData.address
        },
        vendor: {
          id: vendorData._id.toString(),
          businessName: vendorData.businessName,
          services: vendorData.services,
          address: vendorData.address,
          documents: vendorData.documents,
          verified: vendorData.verified,
          status: vendorData.status,
          rating: vendorData.rating,
          totalJobs: vendorData.totalJobs
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update profile'
    }, { status: 500 });
  }
}

// PATCH /api/vendors/profile - Update password
export async function PATCH(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { userId } = authResult.user;
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({
        success: false,
        error: 'Current password and new password are required'
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'New password must be at least 6 characters long'
      }, { status: 400 });
    }

    // Get database collections
    const usersCollection = await database.getUsersCollection();

    // Get user with password
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        error: 'Current password is incorrect'
      }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update password'
    }, { status: 500 });
  }
} 