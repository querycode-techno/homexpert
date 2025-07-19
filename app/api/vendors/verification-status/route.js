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
      identity: {
        status: vendor.documents?.identity?.docImageUrl ? 'pending' : 'missing',
        hasDocument: !!vendor.documents?.identity?.docImageUrl,
        type: vendor.documents?.identity?.type || null,
        number: vendor.documents?.identity?.number || null
      },
      business: {
        status: vendor.documents?.business?.docImageUrl ? 'pending' : 'missing',
        hasDocument: !!vendor.documents?.business?.docImageUrl,
        type: vendor.documents?.business?.type || null,
        number: vendor.documents?.business?.number || null
      }
    };

    // Calculate overall completion percentage
    const totalDocuments = 2; // identity + business
    const providedDocuments = Object.values(documentVerification).filter(doc => 
      doc.hasDocument
    ).length;

    const completionPercentage = Math.round((providedDocuments / totalDocuments) * 100);
    
    // Single verification status (from vendor.verified.isVerified)
    const verificationPercentage = vendor.verified.isVerified ? 100 : 0;

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
              type: 'identity',
              name: 'Identity Document',
              required: true,
              description: 'Upload one of: Driving License, Aadhar Card, or Voter Card',
              allowedTypes: ['driving_license', 'aadhar_card', 'voter_card']
            },
            {
              type: 'business',
              name: 'Business Document',
              required: true,
              description: 'Upload one of: GST Certificate, MSME Certificate, or Other business document',
              allowedTypes: ['gst', 'msme', 'other']
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