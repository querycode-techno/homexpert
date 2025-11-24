import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/dal';
import connectDB from '@/lib/connnectDB';
import AppUpdate from '@/lib/models/appUpdate';
import { ObjectId } from 'mongodb';

// GET /api/admin/settings/app-updates - Get all app updates
export async function GET(request) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    // Build query
    const query = {};
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;

    // Get updates with pagination
    const updates = await AppUpdate.find(query)
      .sort({ versionCode: -1, releaseDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean();

    // Get total count
    const total = await AppUpdate.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: updates.map(update => ({
        id: update._id.toString(),
        version: update.version,
        versionCode: update.versionCode,
        isActive: update.isActive,
        releaseDate: update.releaseDate,
        createdBy: update.createdBy ? {
          id: update.createdBy._id.toString(),
          name: update.createdBy.name,
          email: update.createdBy.email
        } : null,
        updatedBy: update.updatedBy ? {
          id: update.updatedBy._id.toString(),
          name: update.updatedBy.name,
          email: update.updatedBy.email
        } : null,
        createdAt: update.createdAt,
        updatedAt: update.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching app updates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch app updates' },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings/app-updates - Create new app update
export async function POST(request) {
  try {
    const session = await requireAdmin();
    const adminUserId = session.user.id;

    await connectDB();

    const body = await request.json();
    const {
      version,
      versionCode,
      isActive,
      releaseDate
    } = body;

    // Validate required fields
    if (!version || !versionCode) {
      return NextResponse.json(
        { success: false, error: 'Version and versionCode are required' },
        { status: 400 }
      );
    }

    // Validate versionCode is a number
    if (isNaN(versionCode) || versionCode <= 0) {
      return NextResponse.json(
        { success: false, error: 'Version code must be a positive number' },
        { status: 400 }
      );
    }

    // Check if version or versionCode already exists
    const existing = await AppUpdate.findOne({
      $or: [
        { version: version },
        { versionCode: versionCode }
      ]
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Version or version code already exists' },
        { status: 409 }
      );
    }

    // Deactivate all previous active versions when creating a new version
    // This ensures only the latest version is active
    if (isActive !== false) {
      await AppUpdate.updateMany(
        { isActive: true },
        { $set: { isActive: false } }
      );
    }

    // Create new app update
    const appUpdate = new AppUpdate({
      version,
      versionCode,
      isActive: isActive !== undefined ? isActive : true,
      releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
      createdBy: new ObjectId(adminUserId)
    });

    await appUpdate.save();

    return NextResponse.json({
      success: true,
      message: 'App update created successfully',
      data: {
        id: appUpdate._id.toString(),
        version: appUpdate.version,
        versionCode: appUpdate.versionCode,
        isActive: appUpdate.isActive,
        releaseDate: appUpdate.releaseDate
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating app update:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Version or version code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create app update' },
      { status: 500 }
    );
  }
}

