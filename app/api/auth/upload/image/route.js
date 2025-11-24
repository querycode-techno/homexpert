import { NextRequest, NextResponse } from 'next/server';
import { processImageUpload, deleteFileFromPublic } from '@/lib/uploadUtils';
import { requireAdmin } from '@/lib/dal';

// POST /api/upload/image - Upload single image
export async function POST(request) {
  try {
    // Check authentication
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get('file');
    const subfolder = formData.get('subfolder') || 'uploads';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Process the upload
    const result = await processImageUpload(file, subfolder);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Upload failed', details: result.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'File uploaded successfully',
      file: {
        filename: result.filename,
        publicUrl: result.publicUrl,
        originalName: result.originalName,
        size: result.size,
        type: result.type,
        ...(result.cloudinaryPublicId && { cloudinaryPublicId: result.cloudinaryPublicId }),
        ...(result.format && { format: result.format }),
        ...(result.width && { width: result.width }),
        ...(result.height && { height: result.height }),
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/upload/image - Delete uploaded image
export async function DELETE(request) {
  try {
    // Check authentication
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const publicUrl = searchParams.get('url');
    const publicId = searchParams.get('publicId'); // Optional Cloudinary public_id

    if (!publicUrl && !publicId) {
      return NextResponse.json(
        { error: 'No file URL or public ID provided' },
        { status: 400 }
      );
    }

    // Delete the file (use publicId if available, otherwise use publicUrl)
    const deleted = await deleteFileFromPublic(publicUrl || publicId, publicId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'File not found or could not be deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'File deleted successfully',
      deletedUrl: publicUrl
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 