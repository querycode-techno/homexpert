import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import { ObjectId } from 'mongodb';

// POST /api/vendors/fcm-token - Update vendor's FCM token
export async function POST(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;
    const { fcmToken, deviceInfo } = await request.json();

    // Validate input
    if (!fcmToken) {
      return NextResponse.json({
        success: false,
        error: 'FCM token is required'
      }, { status: 400 });
    }

    // Validate FCM token format (basic validation)
    if (typeof fcmToken !== 'string' || fcmToken.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Invalid FCM token format'
      }, { status: 400 });
    }

    // Get database collections
    const usersCollection = await database.getUsersCollection();

    // Check if user exists
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Update FCM token in user collection
    const updateResult = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          fcmToken: fcmToken,
          fcmTokenUpdatedAt: new Date(),
          ...(deviceInfo && { deviceInfo: deviceInfo })
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update FCM token'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'FCM token updated successfully',
      data: {
        fcmToken: fcmToken,
        updatedAt: new Date(),
        deviceInfo: deviceInfo || null
      }
    });

  } catch (error) {
    console.error('Update FCM token error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update FCM token'
    }, { status: 500 });
  }
}

// DELETE /api/vendors/fcm-token - Remove vendor's FCM token
export async function DELETE(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;

    // Get database collections
    const usersCollection = await database.getUsersCollection();

    // Check if user exists
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Remove FCM token from user collection
    const updateResult = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $unset: {
          fcmToken: "",
          fcmTokenUpdatedAt: "",
          deviceInfo: ""
        },
        $set: {
          fcmTokenRemovedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to remove FCM token'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'FCM token removed successfully',
      data: {
        removedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Remove FCM token error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to remove FCM token'
    }, { status: 500 });
  }
}

// GET /api/vendors/fcm-token - Get current FCM token status
export async function GET(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { userId } = authResult.user;

    // Get database collections
    const usersCollection = await database.getUsersCollection();

    // Get user's FCM token info
    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          fcmToken: 1,
          fcmTokenUpdatedAt: 1,
          fcmTokenRemovedAt: 1,
          deviceInfo: 1
        }
      }
    );

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const hasToken = !!user.fcmToken;

    return NextResponse.json({
      success: true,
      data: {
        hasToken: hasToken,
        tokenExists: hasToken,
        fcmToken: hasToken ? user.fcmToken : null,
        updatedAt: user.fcmTokenUpdatedAt || null,
        removedAt: user.fcmTokenRemovedAt || null,
        deviceInfo: user.deviceInfo || null,
        notificationsEnabled: hasToken
      }
    });

  } catch (error) {
    console.error('Get FCM token error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get FCM token status'
    }, { status: 500 });
  }
} 