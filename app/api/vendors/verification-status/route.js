import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import { ObjectId } from 'mongodb';

// GET /api/vendors/verification-status - Get vendor verification status
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

    // Get vendor verification data
    const vendor = await vendorsCollection.findOne(
      { _id: new ObjectId(vendorId) },
      {
        projection: {
          verified: 1,
          status: 1,
          documents: 1,
          businessName: 1,
          history: 1
        }
      }
    );

    if (!vendor) {
      return NextResponse.json({
        success: false,
        error: 'Vendor not found'
      }, { status: 404 });
    }

    // Calculate document verification status
    const documentVerification = {
      aadharCard: {
        status: vendor.documents?.aadharCard?.verified ? 'verified' : 
                vendor.documents?.aadharCard?.imageUrl ? 'pending' : 'missing',
        hasDocument: !!vendor.documents?.aadharCard?.imageUrl,
        verified: vendor.documents?.aadharCard?.verified || false
      },
      panCard: {
        status: vendor.documents?.panCard?.verified ? 'verified' : 
                vendor.documents?.panCard?.imageUrl ? 'pending' : 'missing',
        hasDocument: !!vendor.documents?.panCard?.imageUrl,
        verified: vendor.documents?.panCard?.verified || false
      },
      businessLicense: {
        status: vendor.documents?.businessLicense?.verified ? 'verified' : 
                vendor.documents?.businessLicense?.imageUrl ? 'pending' : 'missing',
        hasDocument: !!vendor.documents?.businessLicense?.imageUrl,
        verified: vendor.documents?.businessLicense?.verified || false
      },
      bankDetails: {
        status: vendor.documents?.bankDetails?.verified ? 'verified' : 
                vendor.documents?.bankDetails?.accountNumber ? 'pending' : 'missing',
        hasDetails: !!(vendor.documents?.bankDetails?.accountNumber && 
                      vendor.documents?.bankDetails?.ifscCode && 
                      vendor.documents?.bankDetails?.accountHolderName),
        verified: vendor.documents?.bankDetails?.verified || false
      }
    };

    // Calculate overall completion percentage
    const totalDocuments = 4;
    const verifiedDocuments = Object.values(documentVerification).filter(doc => doc.verified).length;
    const providedDocuments = Object.values(documentVerification).filter(doc => 
      doc.hasDocument || doc.hasDetails
    ).length;

    const completionPercentage = Math.round((providedDocuments / totalDocuments) * 100);
    const verificationPercentage = Math.round((verifiedDocuments / totalDocuments) * 100);

    // Get latest verification history
    const verificationHistory = vendor.history
      ?.filter(h => ['verified', 'rejected', 'registered'].includes(h.action))
      ?.sort((a, b) => new Date(b.date) - new Date(a.date))
      ?.slice(0, 5) || [];

    // Determine next steps
    const nextSteps = [];
    if (!vendor.verified.isVerified) {
      if (completionPercentage < 100) {
        nextSteps.push('Complete all document submissions');
      }
      if (vendor.status === 'pending') {
        nextSteps.push('Wait for admin verification (24-48 hours)');
      }
      if (vendor.status === 'rejected') {
        nextSteps.push('Contact support for re-verification');
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        overall: {
          isVerified: vendor.verified.isVerified,
          status: vendor.status,
          verificationNotes: vendor.verified.verificationNotes,
          verifiedAt: vendor.verified.verifiedAt,
          completionPercentage,
          verificationPercentage
        },
        documents: documentVerification,
        history: verificationHistory,
        nextSteps,
        requirements: {
          documents: [
            {
              type: 'aadharCard',
              name: 'Aadhar Card',
              required: true,
              description: 'Upload clear photo of your Aadhar card'
            },
            {
              type: 'panCard',
              name: 'PAN Card',
              required: true,
              description: 'Upload clear photo of your PAN card'
            },
            {
              type: 'businessLicense',
              name: 'Business License',
              required: true,
              description: 'Upload your business registration certificate'
            },
            {
              type: 'bankDetails',
              name: 'Bank Account Details',
              required: true,
              description: 'Provide valid bank account information'
            }
          ]
        }
      }
    });

  } catch (error) {
    console.error('Get verification status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch verification status'
    }, { status: 500 });
  }
}

// POST /api/vendors/verification-status - Request re-verification
export async function POST(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId } = authResult.user;
    const { reason } = await request.json();

    // Get database collections
    const vendorsCollection = await database.getVendorsCollection();

    // Check current status
    const vendor = await vendorsCollection.findOne({ _id: new ObjectId(vendorId) });

    if (!vendor) {
      return NextResponse.json({
        success: false,
        error: 'Vendor not found'
      }, { status: 404 });
    }

    if (vendor.verified.isVerified) {
      return NextResponse.json({
        success: false,
        error: 'Vendor is already verified'
      }, { status: 400 });
    }

    if (vendor.status === 'pending') {
      return NextResponse.json({
        success: false,
        error: 'Verification is already in progress'
      }, { status: 400 });
    }

    // Update status to pending and add history entry
    await vendorsCollection.updateOne(
      { _id: new ObjectId(vendorId) },
      {
        $set: {
          status: 'pending',
          'verified.verificationNotes': 'Re-verification requested by vendor',
          updatedAt: new Date()
        },
        $push: {
          history: {
            action: 'verification_requested',
            date: new Date(),
            notes: reason || 'Re-verification requested by vendor'
          }
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Re-verification request submitted successfully. We will review your documents within 24-48 hours.',
      data: {
        status: 'pending',
        submittedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Request verification error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to submit verification request'
    }, { status: 500 });
  }
} 