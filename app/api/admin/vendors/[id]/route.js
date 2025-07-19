import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { requireAdmin } from '@/lib/dal';
import { ObjectId } from 'mongodb';

// GET /api/admin/vendors/[id] - Get vendor by ID
export async function GET(request, { params }) {
  try {
    await requireAdmin();

    const { id } = params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid vendor ID' 
        },
        { status: 400 }
      );
    }

    const vendorsCollection = await database.getVendorsCollection();

    // Get vendor with user data
    const vendor = await vendorsCollection.aggregate([
      { $match: { _id: new ObjectId(id) } },
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
      }
    ]).toArray();

    if (!vendor.length) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Vendor not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: vendor[0]
    });

  } catch (error) {
    console.error('Error fetching vendor:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch vendor',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/vendors/[id] - Update vendor
export async function PUT(request, { params }) {
  try {
    const session = await requireAdmin();
    const adminUserId = session.user.id;
    const adminRole = session.role;

    const { id } = params;
    const body = await request.json();

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid vendor ID' 
        },
        { status: 400 }
      );
    }

    const vendorsCollection = await database.getVendorsCollection();
    const usersCollection = await database.getUsersCollection();

    // Check if vendor exists
    const existingVendor = await vendorsCollection.findOne({ _id: new ObjectId(id) });
    if (!existingVendor) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Vendor not found' 
        },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {};
    const userUpdateData = {};

    // Handle user data updates
    if (body.userData) {
      const { name, email, phone, profileImage, address } = body.userData;
      
      if (name) userUpdateData.name = name.trim();
      if (email) {
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
        
        // Check email uniqueness
        const existingEmail = await usersCollection.findOne({ 
          email: email.toLowerCase(),
          _id: { $ne: existingVendor.user }
        });
        if (existingEmail) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Email already exists' 
            },
            { status: 409 }
          );
        }
        
        userUpdateData.email = email.toLowerCase().trim();
      }
      
      if (phone) {
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
        
        // Check phone uniqueness
        const existingPhone = await usersCollection.findOne({ 
          phone,
          _id: { $ne: existingVendor.user }
        });
        if (existingPhone) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Phone number already exists' 
            },
            { status: 409 }
          );
        }
        
        userUpdateData.phone = phone.trim();
      }
      
      if (profileImage !== undefined) userUpdateData.profileImage = profileImage;
      if (address) userUpdateData.address = address;
    }

    // Handle vendor data updates
    if (body.businessName) updateData.businessName = body.businessName.trim();
    if (body.services) {
      if (!Array.isArray(body.services) || body.services.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Services must be a non-empty array' 
          },
          { status: 400 }
        );
      }
      updateData.services = body.services.map(s => s.trim());
    }
    
    if (body.address) updateData.address = body.address;
    if (body.documents) updateData.documents = body.documents;
    if (body.status) updateData.status = body.status;
    if (body.rating !== undefined) updateData.rating = body.rating;
    if (body.totalJobs !== undefined) updateData.totalJobs = body.totalJobs;

    // Handle onboardedBy field (admin only)
    if (body.onboardedBy !== undefined && adminRole.name === 'admin') {
      if (body.onboardedBy === '' || body.onboardedBy === null) {
        updateData.onboardedBy = null; // Self-registered vendor
      } else if (ObjectId.isValid(body.onboardedBy)) {
        updateData.onboardedBy = new ObjectId(body.onboardedBy);
      }
    }

    // Handle verification updates
    if (body.verified) {
      const verificationUpdate = { ...existingVendor.verified, ...body.verified };
      
      // If marking as verified, update verification details
      if (body.verified.isVerified && !existingVendor.verified.isVerified) {
        verificationUpdate.verifiedAt = new Date();
        verificationUpdate.verifiedBy = new ObjectId(adminUserId);
        
        // Auto-update status to active when verified
        updateData.status = 'active';
        
        // Add to history
        if (!updateData.history) updateData.history = existingVendor.history || [];
        updateData.history.push({
          action: 'verified',
          date: new Date(),
          performedBy: new ObjectId(adminUserId),
          notes: body.verified.verificationNotes || 'Vendor verified by admin'
        });
      }
      // If unmarking as verified, update status back to pending
      else if (body.verified.isVerified === false && existingVendor.verified.isVerified) {
        verificationUpdate.verifiedAt = null;
        verificationUpdate.verifiedBy = null;
        
        // Auto-update status to pending when unverified
        updateData.status = 'pending';
        
        // Add to history
        if (!updateData.history) updateData.history = existingVendor.history || [];
        updateData.history.push({
          action: 'rejected',
          date: new Date(),
          performedBy: new ObjectId(adminUserId),
          notes: body.verified.verificationNotes || 'Vendor verification revoked by admin'
        });
      }
      
      updateData.verified = verificationUpdate;
    }

    // Add to history if status changed (but not if it was changed by verification)
    if (body.status && body.status !== existingVendor.status && !body.verified) {
      if (!updateData.history) updateData.history = existingVendor.history || [];
      updateData.history.push({
        action: body.status === 'active' ? 'activated' : 
                body.status === 'suspended' ? 'suspended' : 
                body.status === 'inactive' ? 'deactivated' : 'status_changed',
        date: new Date(),
        performedBy: new ObjectId(adminUserId),
        reason: body.reason || '',
        notes: body.notes || `Status changed to ${body.status}`
      });
    }

    // Update timestamps
    if (Object.keys(userUpdateData).length > 0) {
      userUpdateData.updatedAt = new Date();
    }
    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date();
    }

    // Perform updates
    if (Object.keys(userUpdateData).length > 0) {
      await usersCollection.updateOne(
        { _id: existingVendor.user },
        { $set: userUpdateData }
      );
    }

    if (Object.keys(updateData).length > 0) {
      await vendorsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
    }

    // Fetch updated vendor with user data
    const updatedVendor = await vendorsCollection.aggregate([
      { $match: { _id: new ObjectId(id) } },
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
      }
    ]).toArray();

    return NextResponse.json({
      success: true,
      message: 'Vendor updated successfully',
      data: updatedVendor[0]
    });

  } catch (error) {
    console.error('Error updating vendor:', error);

    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update vendor',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/vendors/[id] - Delete vendor
export async function DELETE(request, { params }) {
  try {
    await requireAdmin();

    const { id } = params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid vendor ID' 
        },
        { status: 400 }
      );
    }

    const vendorsCollection = await database.getVendorsCollection();
    const usersCollection = await database.getUsersCollection();

    // Check if vendor exists
    const existingVendor = await vendorsCollection.findOne({ _id: new ObjectId(id) });
    if (!existingVendor) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Vendor not found' 
        },
        { status: 404 }
      );
    }

    // Check if vendor has active dependencies (leads, bookings, etc.)
    // This is a business logic check - you might want to prevent deletion
    // if vendor has active bookings or leads
    
    // Delete vendor first
    await vendorsCollection.deleteOne({ _id: new ObjectId(id) });
    
    // Delete associated user
    await usersCollection.deleteOne({ _id: existingVendor.user });

    return NextResponse.json({
      success: true,
      message: 'Vendor deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting vendor:', error);

    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete vendor',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 