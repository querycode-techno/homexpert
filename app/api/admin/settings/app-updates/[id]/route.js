import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/dal';
import connectDB from '@/lib/connnectDB';
import AppUpdate from '@/lib/models/appUpdate';
import { ObjectId } from 'mongodb';

// GET /api/admin/settings/app-updates/[id] - Get single app update
export async function GET(request, { params }) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid app update ID' },
        { status: 400 }
      );
    }

    const appUpdate = await AppUpdate.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean();

    if (!appUpdate) {
      return NextResponse.json(
        { success: false, error: 'App update not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: appUpdate._id.toString(),
        version: appUpdate.version,
        versionCode: appUpdate.versionCode,
        isActive: appUpdate.isActive,
        releaseDate: appUpdate.releaseDate,
        createdBy: appUpdate.createdBy ? {
          id: appUpdate.createdBy._id.toString(),
          name: appUpdate.createdBy.name,
          email: appUpdate.createdBy.email
        } : null,
        updatedBy: appUpdate.updatedBy ? {
          id: appUpdate.updatedBy._id.toString(),
          name: appUpdate.updatedBy.name,
          email: appUpdate.updatedBy.email
        } : null,
        createdAt: appUpdate.createdAt,
        updatedAt: appUpdate.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching app update:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch app update' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings/app-updates/[id] - Update app update
export async function PUT(request, { params }) {
  try {
    const session = await requireAdmin();
    const adminUserId = session.user.id;

    await connectDB();

    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid app update ID' },
        { status: 400 }
      );
    }

    const appUpdate = await AppUpdate.findById(id);

    if (!appUpdate) {
      return NextResponse.json(
        { success: false, error: 'App update not found' },
        { status: 404 }
      );
    }

    // Check if version or versionCode conflicts with existing updates
    if (body.version || body.versionCode) {
      const existing = await AppUpdate.findOne({
        _id: { $ne: new ObjectId(id) },
        $or: [
          body.version ? { version: body.version } : {},
          body.versionCode ? { versionCode: body.versionCode } : {}
        ]
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Version or version code already exists' },
          { status: 409 }
        );
      }
    }

    // Update fields
    if (body.version !== undefined) appUpdate.version = body.version;
    if (body.versionCode !== undefined) appUpdate.versionCode = body.versionCode;
    if (body.isActive !== undefined) appUpdate.isActive = body.isActive;
    if (body.releaseDate !== undefined) appUpdate.releaseDate = new Date(body.releaseDate);
    
    appUpdate.updatedBy = new ObjectId(adminUserId);

    await appUpdate.save();

    return NextResponse.json({
      success: true,
      message: 'App update updated successfully',
      data: {
        id: appUpdate._id.toString(),
        version: appUpdate.version,
        versionCode: appUpdate.versionCode,
        isActive: appUpdate.isActive,
        releaseDate: appUpdate.releaseDate
      }
    });

  } catch (error) {
    console.error('Error updating app update:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Version or version code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update app update' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/settings/app-updates/[id] - Delete app update
export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid app update ID' },
        { status: 400 }
      );
    }

    const appUpdate = await AppUpdate.findByIdAndDelete(id);

    if (!appUpdate) {
      return NextResponse.json(
        { success: false, error: 'App update not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'App update deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting app update:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete app update' },
      { status: 500 }
    );
  }
}

