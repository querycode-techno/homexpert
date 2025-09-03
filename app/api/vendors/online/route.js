import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import { ObjectId } from 'mongodb';

// POST /api/vendors/online - Update vendor online status
export async function POST(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId } = authResult.user;
    const { online} = await request.json();

    // Validate input
    if (typeof online !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'Online status must be a boolean value (true or false)'
      }, { status: 400 });
    }

    // Get database collections
    const vendorsCollection = await database.getVendorsCollection();

    // Check if vendor exists
    const vendor = await vendorsCollection.findOne({ _id: new ObjectId(vendorId) });
    if (!vendor) {
      return NextResponse.json({
        success: false,
        error: 'Vendor not found'
      }, { status: 404 });
    }

    // Update online status and lastOnline timestamp
    const updateData = {
      online: online,
      lastOnline: new Date(),
      updatedAt: new Date()
    };

    const result = await vendorsCollection.updateOne(
      { _id: new ObjectId(vendorId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Vendor not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Vendor status updated to ${online ? 'online' : 'offline'}`,
      data: {
        vendorId: vendorId,
        online: online,
        lastOnline: updateData.lastOnline
      }
    });

  } catch (error) {
    console.error('Update online status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update online status'
    }, { status: 500 });
  }
}

// GET /api/vendors/online - Get vendor online status
export async function GET(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId } = authResult.user;

    // Get database collections
    const vendorsCollection = await database.getVendorsCollection();

    // Get vendor online status
    const vendor = await vendorsCollection.findOne(
      { _id: new ObjectId(vendorId) },
      { projection: { online: 1, lastOnline: 1, businessName: 1 } }
    );

    if (!vendor) {
      return NextResponse.json({
        success: false,
        error: 'Vendor not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        vendorId: vendorId,
        businessName: vendor.businessName,
        online: vendor.online || false,
        lastOnline: vendor.lastOnline
      }
    });

  } catch (error) {
    console.error('Get online status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get online status'
    }, { status: 500 });
  }
}
