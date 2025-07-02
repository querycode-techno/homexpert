import { NextResponse } from 'next/server';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';

// GET /api/vendors/bank-details - Get bank transfer details
export async function GET(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    // Static bank details (in production, these would come from environment variables or database)
    const bankDetails = {
      accountName: 'HOME EXPERT SERVICES PVT LTD',
      accountNumber: '912010012345678',
      ifscCode: 'UTIB0001234',
      bankName: 'Axis Bank',
      branchName: 'Mumbai Main Branch',
      accountType: 'Current Account',
      
      // UPI Details
      upiId: 'homeexpert@axisbank',
      upiQrCode: '/api/vendors/bank-details/qr-code', // Endpoint to serve QR code image
      
      // Additional details
      notes: [
        'Transfer the exact subscription amount',
        'Include your vendor ID in transaction remarks',
        'After payment, submit the transaction ID/UTR number',
        'Subscription will be activated after admin verification'
      ],
      
      // Contact information
      supportContact: {
        phone: '+91 98765 43210',
        email: 'payments@homeexpert.com',
        whatsapp: '+91 98765 43210'
      },
      
      // Verification process
      verificationProcess: [
        'Make payment to the bank account',
        'Note down the transaction ID/UTR number',
        'Submit payment details in the app',
        'Admin will verify payment within 24 hours',
        'Subscription will be activated upon verification'
      ],
      
      // Warning
      warning: 'Only transfer to the above bank account. Do not transfer to any other account even if someone claims to be from Home Expert.'
    };

    return NextResponse.json({
      success: true,
      data: bankDetails
    });

  } catch (error) {
    console.error('Error fetching bank details:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch bank details'
    }, { status: 500 });
  }
} 