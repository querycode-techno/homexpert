import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import { ObjectId } from 'mongodb';

// POST /api/vendors/documents/upload - Upload vendor documents
export async function POST(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId } = authResult.user;
    const formData = await request.formData();
    
    const documentType = formData.get('documentType');
    const file = formData.get('file');
    const documentNumber = formData.get('documentNumber');
    const docType = formData.get('docType'); // identity type or business type

    // Validate input
    if (!documentType || !file) {
      return NextResponse.json({
        success: false,
        error: 'Document type and file are required'
      }, { status: 400 });
    }

    // Validate document type
    const allowedTypes = ['identity', 'business'];
    if (!allowedTypes.includes(documentType)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid document type. Must be either identity or business'
      }, { status: 400 });
    }

    // Validate doc type enum
    if (documentType === 'identity') {
      const allowedIdentityTypes = ['driving_license', 'aadhar_card', 'voter_card'];
      if (docType && !allowedIdentityTypes.includes(docType)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid identity document type'
        }, { status: 400 });
      }
    } else if (documentType === 'business') {
      const allowedBusinessTypes = ['gst', 'msme', 'other'];
      if (docType && !allowedBusinessTypes.includes(docType)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid business document type'
        }, { status: 400 });
      }
    }

    // Validate file type and size
    const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    if (!allowedFileTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Only JPEG, PNG, and WebP images are allowed'
      }, { status: 400 });
    }

    if (file.size > maxFileSize) {
      return NextResponse.json({
        success: false,
        error: 'File size must be less than 5MB'
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

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomString}.${fileExtension}`;

    // For this implementation, we'll simulate file upload
    // In production, you would upload to cloud storage (AWS S3, CloudFront, etc.)
    const uploadPath = `/vendor-documents/${filename}`;
    
    // Simulate file upload (In production, implement actual file upload)
    // const uploadedUrl = await uploadToCloudStorage(file, uploadPath);
    const uploadedUrl = `/vendor-documents/${filename}`;

    // Update vendor document
    const updateField = `documents.${documentType}`;
    const documentUpdate = {
      type: docType || vendor.documents?.[documentType]?.type || "",
      number: documentNumber || vendor.documents?.[documentType]?.number || "",
      docImageUrl: uploadedUrl,
      uploadedAt: new Date()
    };

    await vendorsCollection.updateOne(
      { _id: new ObjectId(vendorId) },
      {
        $set: {
          [updateField]: documentUpdate,
          updatedAt: new Date()
        },
        $push: {
          history: {
            action: 'document_uploaded',
            date: new Date(),
            notes: `${documentType} document uploaded`
          }
        }
      }
    );

    // Get updated document status
    const updatedVendor = await vendorsCollection.findOne(
      { _id: new ObjectId(vendorId) },
      { projection: { documents: 1, verified: 1, status: 1 } }
    );

    // Calculate document completion status
    const documents = updatedVendor.documents;
    const documentStatus = {
      identity: {
        uploaded: !!documents?.identity?.docImageUrl,
        type: documents?.identity?.type || null
      },
      business: {
        uploaded: !!documents?.business?.docImageUrl,
        type: documents?.business?.type || null
      }
    };

    const totalDocuments = 2;
    const uploadedDocuments = Object.values(documentStatus).filter(doc => 
      doc.uploaded
    ).length;
    const completionPercentage = Math.round((uploadedDocuments / totalDocuments) * 100);

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        documentType,
        documentUrl: uploadedUrl,
        uploadedAt: new Date(),
        documentStatus,
        completionPercentage,
        nextStep: completionPercentage === 100 
          ? 'All documents uploaded. Verification in progress.' 
          : 'Continue uploading remaining documents.'
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to upload document'
    }, { status: 500 });
  }
} 