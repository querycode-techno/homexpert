import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import { ObjectId } from 'mongodb';

// POST /api/vendors/payment-submission - Submit bank transfer payment details
export async function POST(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;
    const { 
      subscriptionId, 
      transactionId, 
      utrNumber, 
      paymentDate, 
      paidAmount, 
      paymentMethod, 
      bankName, 
      notes 
    } = await request.json();

    // Validation
    if (!subscriptionId || !transactionId || !paidAmount) {
      return NextResponse.json({
        success: false,
        error: 'Subscription ID, transaction ID, and paid amount are required'
      }, { status: 400 });
    }

    if (!ObjectId.isValid(subscriptionId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid subscription ID format'
      }, { status: 400 });
    }

    const subscriptionHistoryCollection = await database.getSubscriptionHistoryCollection();

    // Get the subscription
    const subscription = await subscriptionHistoryCollection.findOne({
      _id: new ObjectId(subscriptionId),
      user: new ObjectId(userId)
    });

    if (!subscription) {
      return NextResponse.json({
        success: false,
        error: 'Subscription not found'
      }, { status: 404 });
    }

    // Check if subscription is in pending state and payment method is bank_transfer
    if (subscription.status !== 'pending' || subscription.payment.paymentMethod !== 'bank_transfer') {
      return NextResponse.json({
        success: false,
        error: 'Invalid subscription state for payment submission'
      }, { status: 400 });
    }

    // Check if payment details have already been submitted
    if (subscription.payment.paymentStatus !== 'pending' || subscription.payment.transactionId) {
      return NextResponse.json({
        success: false,
        error: 'Payment details have already been submitted for this subscription'
      }, { status: 400 });
    }

    const now = new Date();
    const submissionData = {
      transactionId: transactionId.trim(),
      utrNumber: utrNumber ? utrNumber.trim() : null,
      paidAmount: parseFloat(paidAmount),
      paymentDate: paymentDate ? new Date(paymentDate) : now,
      submittedAt: now,
      submittedByVendor: true,
      vendorNotes: notes || '',
      paymentProof: {
        bankName: bankName || '',
        paymentMethod: paymentMethod || 'bank_transfer'
      }
    };

    // Update subscription with payment submission details
    const updateResult = await subscriptionHistoryCollection.updateOne(
      { _id: new ObjectId(subscriptionId) },
      {
        $set: {
          'payment.transactionId': submissionData.transactionId,
          'payment.utrNumber': submissionData.utrNumber,
          'payment.paidAmount': submissionData.paidAmount,
          'payment.paymentDate': submissionData.paymentDate,
          'payment.submittedAt': submissionData.submittedAt,
          'payment.submittedByVendor': submissionData.submittedByVendor,
          'payment.vendorNotes': submissionData.vendorNotes,
          'payment.paymentProof': submissionData.paymentProof,
          'payment.paymentStatus': 'submitted', // New status indicating details submitted but not verified
          updatedAt: now
        },
        $push: {
          history: {
            action: 'payment_submitted',
            date: now,
            reason: `Payment details submitted by vendor. TXN: ${submissionData.transactionId}`,
            performedBy: new ObjectId(userId)
          }
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update subscription'
      }, { status: 500 });
    }

    // Get updated subscription
    const updatedSubscription = await subscriptionHistoryCollection.findOne({
      _id: new ObjectId(subscriptionId)
    });

    return NextResponse.json({
      success: true,
      message: 'Payment details submitted successfully!',
      data: {
        subscriptionId: subscriptionId,
        transactionId: submissionData.transactionId,
        status: 'submitted',
        nextSteps: [
          'Your payment details have been submitted for verification',
          'Admin will verify the payment within 24 hours',
          'You will receive a notification once verified',
          'Subscription will be activated upon verification'
        ],
        estimatedVerificationTime: '24 hours',
        supportContact: {
          phone: '+91 98765 43210',
          email: 'payments@homeexpert.com',
          whatsapp: '+91 98765 43210'
        }
      }
    });

  } catch (error) {
    console.error('Error submitting payment details:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to submit payment details'
    }, { status: 500 });
  }
}

// GET /api/vendors/payment-submission - Get pending payment submissions for vendor
export async function GET(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;

    const subscriptionHistoryCollection = await database.getSubscriptionHistoryCollection();

    // Get vendor's subscriptions with pending payments
    const pendingSubmissions = await subscriptionHistoryCollection
      .find({
        user: new ObjectId(userId),
        'payment.paymentMethod': 'bank_transfer',
        'payment.paymentStatus': { $in: ['pending', 'submitted'] }
      })
      .sort({ createdAt: -1 })
      .toArray();

    const formattedSubmissions = pendingSubmissions.map(sub => {
      const now = new Date();
      const daysRemaining = sub.endDate ? 
        Math.max(0, Math.ceil((sub.endDate - now) / (1000 * 60 * 60 * 24))) : 0;

      return {
        id: sub._id.toString(),
        planName: sub.planSnapshot.planName,
        amount: sub.payment.amount,
        currency: sub.payment.currency,
        status: sub.payment.paymentStatus,
        transactionId: sub.payment.transactionId || null,
        submittedAt: sub.payment.submittedAt || null,
        createdAt: sub.createdAt,
        daysRemaining,
        canSubmit: sub.payment.paymentStatus === 'pending' && !sub.payment.transactionId,
        isAwaitingVerification: sub.payment.paymentStatus === 'submitted'
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        pendingSubmissions: formattedSubmissions,
        total: formattedSubmissions.length,
        canSubmitCount: formattedSubmissions.filter(s => s.canSubmit).length,
        awaitingVerificationCount: formattedSubmissions.filter(s => s.isAwaitingVerification).length
      }
    });

  } catch (error) {
    console.error('Error fetching payment submissions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch payment submissions'
    }, { status: 500 });
  }
} 