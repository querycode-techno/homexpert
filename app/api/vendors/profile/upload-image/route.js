import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import { ObjectId } from 'mongodb';
import { processImageUpload, deleteFileFromPublic } from '@/lib/uploadUtils';

// POST /api/vendors/profile/upload-image - Upload vendor profile image
export async function POST(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { userId } = authResult.user;
    const formData = await request.formData();
    const file = formData.get('file');

    // Validate file
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    // Validate file type
    const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedFileTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Only JPEG, PNG, and WebP images are allowed'
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      return NextResponse.json({
        success: false,
        error: 'File size must be less than 5MB'
      }, { status: 400 });
    }

    // Get database collections
    const usersCollection = await database.getUsersCollection();

    // Check if user exists and get current profile image
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Delete old profile image if it exists
    if (user.profileImage) {
      try {
        await deleteFileFromPublic(user.profileImage);
      } catch (error) {
        // Log but don't fail if old image deletion fails
        console.error('Error deleting old profile image:', error);
      }
    }

    // Process the upload using uploadUtils (supports Cloudinary and local storage)
    const uploadResult = await processImageUpload(file, 'vendor-profiles');

    if (!uploadResult.success) {
      return NextResponse.json({
        success: false,
        error: uploadResult.errors?.join(', ') || 'Failed to upload image'
      }, { status: 400 });
    }

    const uploadedUrl = uploadResult.publicUrl;

    // Update user profile image
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          profileImage: uploadedUrl,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        profileImage: uploadedUrl,
        ...(uploadResult.cloudinaryPublicId && { cloudinaryPublicId: uploadResult.cloudinaryPublicId }),
        ...(uploadResult.format && { format: uploadResult.format }),
        ...(uploadResult.width && { width: uploadResult.width }),
        ...(uploadResult.height && { height: uploadResult.height })
      }
    });

  } catch (error) {
    console.error('Upload profile image error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to upload profile image'
    }, { status: 500 });
  }
}

// DELETE /api/vendors/profile/upload-image - Delete vendor profile image
export async function DELETE(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { userId } = authResult.user;

    // Get database collections
    const usersCollection = await database.getUsersCollection();

    // Get user with current profile image
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    if (!user.profileImage) {
      return NextResponse.json({
        success: false,
        error: 'No profile image to delete'
      }, { status: 400 });
    }

    const oldImageUrl = user.profileImage;

    // Delete the image file
    try {
      await deleteFileFromPublic(oldImageUrl);
    } catch (error) {
      console.error('Error deleting profile image file:', error);
      // Continue to remove from database even if file deletion fails
    }

    // Remove profile image from user
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          profileImage: '',
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Profile image deleted successfully'
    });

  } catch (error) {
    console.error('Delete profile image error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete profile image'
    }, { status: 500 });
  }
}

