import { NextResponse } from 'next/server';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import connectDB from '@/lib/connnectDB';
import AppUpdate from '@/lib/models/appUpdate';

// GET /api/vendors/app-update - Get latest app update for vendor
export async function GET(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const currentVersionCode = parseInt(searchParams.get('currentVersionCode')) || 0;

    // Build query for active updates
    // Note: Only one version is active at a time (previous versions are auto-deactivated when a new one is created)
    const query = {
      isActive: true,
      versionCode: { $gt: currentVersionCode } // Only show updates newer than current version
    };

    // Get the latest active update (highest version code)
    // Since only one version is active at a time, this will always return the latest active version
    const latestUpdate = await AppUpdate.findOne(query)
      .sort({ versionCode: -1 })
      .lean();

    if (!latestUpdate) {
      return NextResponse.json({
        success: true,
        data: {
          updateAvailable: false,
          message: 'You are using the latest version'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        updateAvailable: true,
        update: {
          id: latestUpdate._id.toString(),
          version: latestUpdate.version,
          versionCode: latestUpdate.versionCode,
          releaseDate: latestUpdate.releaseDate
        }
      }
    });

  } catch (error) {
    console.error('Error fetching app update:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch app update'
    }, { status: 500 });
  }
}

