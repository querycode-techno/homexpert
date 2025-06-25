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

    // Validate input
    if (!documentType || !file) {
      return NextResponse.json({
        success: false,
        error: 'Document type and file are required'
      }, { status: 400 });
    }

    // Validate document type
    const allowedTypes = ['aadharCard', 'panCard', 'businessLicense'];
    if (!allowedTypes.includes(documentType)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid document type'
      }, { status: 400 });
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
      number: documentNumber || vendor.documents?.[documentType]?.number || "",
      imageUrl: uploadedUrl,
      verified: false, // Reset verification status on new upload
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
            notes: `${documentType} uploaded`
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
      aadharCard: {
        uploaded: !!documents?.aadharCard?.imageUrl,
        verified: documents?.aadharCard?.verified || false
      },
      panCard: {
        uploaded: !!documents?.panCard?.imageUrl,
        verified: documents?.panCard?.verified || false
      },
      businessLicense: {
        uploaded: !!documents?.businessLicense?.imageUrl,
        verified: documents?.businessLicense?.verified || false
      },
      bankDetails: {
        provided: !!(documents?.bankDetails?.accountNumber && 
                    documents?.bankDetails?.ifscCode && 
                    documents?.bankDetails?.accountHolderName),
        verified: documents?.bankDetails?.verified || false
      }
    };

    const totalDocuments = 4;
    const uploadedDocuments = Object.values(documentStatus).filter(doc => 
      doc.uploaded || doc.provided
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

// PUT /api/vendors/documents/upload - Update bank details
export async function PUT(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId } = authResult.user;
    const { bankDetails } = await request.json();

    // Validate input
    if (!bankDetails?.accountNumber || !bankDetails?.ifscCode || !bankDetails?.accountHolderName) {
      return NextResponse.json({
        success: false,
        error: 'Account number, IFSC code, and account holder name are required'
      }, { status: 400 });
    }

    // Validate IFSC code format (basic validation)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(bankDetails.ifscCode)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid IFSC code format'
      }, { status: 400 });
    }

    // Validate account number (basic validation)
    if (bankDetails.accountNumber.length < 9 || bankDetails.accountNumber.length > 18) {
      return NextResponse.json({
        success: false,
        error: 'Account number must be between 9 and 18 digits'
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

    // Update bank details
    const bankDetailsUpdate = {
      accountNumber: bankDetails.accountNumber.trim(),
      ifscCode: bankDetails.ifscCode.trim().toUpperCase(),
      accountHolderName: bankDetails.accountHolderName.trim(),
      verified: false, // Reset verification status on update
      updatedAt: new Date()
    };

    await vendorsCollection.updateOne(
      { _id: new ObjectId(vendorId) },
      {
        $set: {
          'documents.bankDetails': bankDetailsUpdate,
          updatedAt: new Date()
        },
        $push: {
          history: {
            action: 'bank_details_updated',
            date: new Date(),
            notes: 'Bank details updated'
          }
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Bank details updated successfully',
      data: {
        bankDetails: {
          accountNumber: bankDetails.accountNumber,
          ifscCode: bankDetails.ifscCode,
          accountHolderName: bankDetails.accountHolderName,
          verified: false
        },
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Bank details update error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update bank details'
    }, { status: 500 });
  }
} 