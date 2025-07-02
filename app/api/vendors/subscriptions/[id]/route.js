import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import { ObjectId } from 'mongodb';

// Helper function to handle payment submission for bank transfers
async function handlePaymentSubmission(subscriptionId, userId, paymentDetails) {
  try {
    const { transactionId } = paymentDetails;

    if (!transactionId) {
      return NextResponse.json({
        success: false,
        error: 'Transaction ID is required'
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

    // Check if subscription is valid for payment submission
    if (subscription.status !== 'pending' || subscription.payment.paymentMethod !== 'bank_transfer') {
      return NextResponse.json({
        success: false,
        error: 'Invalid subscription state for payment submission'
      }, { status: 400 });
    }

    // Check if payment details have already been submitted
    if (subscription.payment.paymentStatus === 'submitted' || subscription.payment.transactionId) {
      return NextResponse.json({
        success: false,
        error: 'Payment details have already been submitted for this subscription'
      }, { status: 400 });
    }

    const now = new Date();

    // Update subscription with payment submission details
    const updateResult = await subscriptionHistoryCollection.updateOne(
      { _id: new ObjectId(subscriptionId) },
      {
        $set: {
          'payment.transactionId': transactionId.trim(),
          'payment.paymentStatus': 'submitted',
          updatedAt: now
        },
        $push: {
          history: {
            action: 'purchased',
            date: now,
            reason: `Payment details submitted by vendor. TXN: ${transactionId}`,
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

    return NextResponse.json({
      success: true,
      message: 'Payment details submitted successfully!',
      data: {
        subscriptionId: subscriptionId,
        transactionId: transactionId,
        status: 'submitted',
        nextSteps: [
          'Your payment details have been submitted for verification',
          'Admin will verify the payment within 24 hours',
          'You will receive a notification once verified',
          'Subscription will be activated upon verification'
        ]
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

// GET /api/vendors/subscriptions/[id] - Get specific subscription details
export async function GET(request, { params }) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;
    const subscriptionId = params.id;

    if (!subscriptionId) {
      return NextResponse.json({
        success: false,
        error: 'Subscription ID is required'
      }, { status: 400 });
    }

    // Get database collections
    const subscriptionHistoryCollection = await database.getSubscriptionHistoryCollection();

    // Get subscription details
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

    // Calculate additional metrics
    const now = new Date();
    const daysRemaining = subscription.endDate ? 
      Math.max(0, Math.ceil((subscription.endDate - now) / (1000 * 60 * 60 * 24))) : 0;
    const usagePercentage = subscription.planSnapshot?.totalLeads ? 
      Math.round((subscription.usage.leadsConsumed / subscription.planSnapshot.totalLeads) * 100) : 0;

    // Format detailed subscription data
    const detailedSubscription = {
      id: subscription._id.toString(),
      planName: subscription.planSnapshot.planName,
      description: subscription.planSnapshot.description,
      duration: subscription.planSnapshot.duration,
      status: subscription.status,
      isActive: subscription.isActive,
      
      // Dates and timeline
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      daysRemaining,
      daysActive: Math.ceil((now - subscription.startDate) / (1000 * 60 * 60 * 24)),
      isExpired: daysRemaining === 0 && subscription.endDate < now,
      isExpiringSoon: daysRemaining <= 7 && daysRemaining > 0,
      
      // Plan details
      totalLeads: subscription.planSnapshot.totalLeads,
      leadsPerMonth: subscription.planSnapshot.leadsPerMonth,
      features: subscription.planSnapshot.features || [],
      
      // Usage analytics
      usage: {
        leadsConsumed: subscription.usage.leadsConsumed,
        leadsRemaining: subscription.usage.leadsRemaining,
        usagePercentage,
        lastLeadConsumedAt: subscription.usage.lastLeadConsumedAt,
        monthlyUsage: subscription.usage.monthlyUsage || [],
        averageLeadsPerMonth: subscription.usage.averageLeadsPerMonth || 0,
        totalJobsCompleted: subscription.usage.totalJobsCompleted || 0,
        conversionRate: subscription.usage.conversionRate || 0
      },
      
      // Payment information
      payment: {
        amount: subscription.payment.amount,
        currency: subscription.payment.currency,
        paymentMethod: subscription.payment.paymentMethod,
        paymentStatus: subscription.payment.paymentStatus,
        paymentDate: subscription.payment.paymentDate,
        transactionId: subscription.payment.transactionId,
        refundAmount: subscription.payment.refundAmount || 0
      },
      
      // Performance metrics
      performance: subscription.performance || {
        leadAcceptanceRate: 0,
        jobCompletionRate: 0,
        customerSatisfactionScore: 0,
        averageJobValue: 0,
        totalRevenue: 0
      },
      
      // Lead assignments
      leadAssignments: subscription.leadAssignments || [],
      
      // History and notes
      history: subscription.history || [],
      adminNotes: subscription.adminNotes || [],
      
      // Discounts applied
      discountsApplied: subscription.discountsApplied || [],
      
      // Renewal info
      renewalInfo: subscription.renewalInfo || {},
      
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: detailedSubscription
    });

  } catch (error) {
    console.error('Get subscription details error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch subscription details'
    }, { status: 500 });
  }
}

// PUT /api/vendors/subscriptions/[id] - Upgrade/downgrade subscription OR submit payment details
export async function PUT(request, { params }) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;
    const subscriptionId = params.id;
    const requestBody = await request.json();
    const { 
      newPlanId, 
      upgradeType, 
      // Payment submission fields
      transactionId 
    } = requestBody;

    // Check if this is a payment submission request
    if (transactionId && !newPlanId) {
      return await handlePaymentSubmission(subscriptionId, userId, {
        transactionId
      });
    }

    if (!subscriptionId || !newPlanId) {
      return NextResponse.json({
        success: false,
        error: 'Subscription ID and new plan ID are required'
      }, { status: 400 });
    }

    // Get database collections
    const subscriptionHistoryCollection = await database.getSubscriptionHistoryCollection();
    const subscriptionPlansCollection = await database.getSubscriptionPlansCollection();

    // Get current subscription
    const currentSubscription = await subscriptionHistoryCollection.findOne({
      _id: new ObjectId(subscriptionId),
      user: new ObjectId(userId),
      status: 'active',
      isActive: true
    });

    if (!currentSubscription) {
      return NextResponse.json({
        success: false,
        error: 'Active subscription not found'
      }, { status: 404 });
    }

    // Get new plan details
    const newPlan = await subscriptionPlansCollection.findOne({
      _id: new ObjectId(newPlanId),
      isActive: true
    });

    if (!newPlan) {
      return NextResponse.json({
        success: false,
        error: 'New subscription plan not found or inactive'
      }, { status: 404 });
    }

    // Validate upgrade/downgrade logic
    const currentPrice = currentSubscription.planSnapshot.discountedPrice || currentSubscription.planSnapshot.price;
    const newPrice = newPlan.discountedPrice || newPlan.price;
    const actualType = newPrice > currentPrice ? 'upgrade' : 'downgrade';

    if (upgradeType && upgradeType !== actualType) {
      return NextResponse.json({
        success: false,
        error: `This is actually a ${actualType}, not a ${upgradeType}`
      }, { status: 400 });
    }

    const now = new Date();
    
    // For upgrade: Calculate prorated amount and extend with new plan
    // For downgrade: Apply changes at next renewal
    let priceDifference = newPrice - currentPrice;
    let upgradeStrategy = 'immediate'; // 'immediate' or 'next_cycle'

    // For downgrades, typically wait until next cycle
    if (actualType === 'downgrade') {
      upgradeStrategy = 'next_cycle';
    }

    if (upgradeStrategy === 'immediate') {
      // Immediate upgrade/downgrade
      
      // Calculate remaining days and prorated amount
      const remainingDays = Math.max(0, Math.ceil((currentSubscription.endDate - now) / (1000 * 60 * 60 * 24)));
      const dailyRate = newPrice / newPlan.durationInDays;
      const proratedAmount = dailyRate * remainingDays;

      // Update current subscription to expired
      await subscriptionHistoryCollection.updateOne(
        { _id: currentSubscription._id },
        {
          $set: {
            status: 'cancelled',
            isActive: false,
            updatedAt: now
          },
          $push: {
            history: {
              action: actualType === 'upgrade' ? 'upgraded' : 'downgraded',
              date: now,
              reason: `${actualType} to ${newPlan.planName}`,
              performedBy: new ObjectId(userId)
            }
          }
        }
      );

      // Create new subscription
      const newEndDate = new Date(now.getTime() + (newPlan.durationInDays * 24 * 60 * 60 * 1000));
      const remainingLeads = Math.max(0, currentSubscription.usage.leadsRemaining);
      
      const newSubscriptionData = {
        user: new ObjectId(userId),
        subscriptionPlan: new ObjectId(newPlanId),
        planSnapshot: {
          planName: newPlan.planName,
          description: newPlan.description,
          duration: newPlan.duration,
          durationInDays: newPlan.durationInDays,
          totalLeads: newPlan.totalLeads,
          leadsPerMonth: newPlan.leadsPerMonth,
          price: newPlan.price,
          discountedPrice: newPlan.discountedPrice,
          features: newPlan.features || []
        },
        startDate: now,
        endDate: newEndDate,
        status: 'active',
        isActive: true,
        usage: {
          leadsConsumed: 0,
          leadsRemaining: newPlan.totalLeads + (actualType === 'upgrade' ? remainingLeads : 0),
          lastLeadConsumedAt: null,
          monthlyUsage: [],
          averageLeadsPerMonth: 0,
          totalJobsCompleted: 0,
          conversionRate: 0
        },
        payment: {
          amount: proratedAmount,
          currency: newPlan.currency || 'INR',
          paymentMethod: 'online',
          paymentStatus: 'completed',
          paymentDate: now,
          transactionId: `${actualType.toUpperCase()}_${Date.now()}`
        },
        history: [{
          action: actualType === 'upgrade' ? 'upgraded' : 'downgraded',
          date: now,
          reason: `${actualType} from ${currentSubscription.planSnapshot.planName} to ${newPlan.planName}`,
          performedBy: new ObjectId(userId)
        }],
        previousSubscription: currentSubscription._id,
        upgradeDowngradeHistory: [{
          fromPlan: currentSubscription.subscriptionPlan,
          toPlan: new ObjectId(newPlanId),
          date: now,
          type: actualType,
          priceDifference,
          leadsDifference: newPlan.totalLeads - currentSubscription.planSnapshot.totalLeads,
          reason: `User requested ${actualType}`
        }],
        performance: {
          leadAcceptanceRate: 0,
          jobCompletionRate: 0,
          customerSatisfactionScore: 0,
          averageJobValue: 0,
          totalRevenue: 0
        },
        createdAt: now,
        updatedAt: now
      };

      const result = await subscriptionHistoryCollection.insertOne(newSubscriptionData);

      // Update previous subscription to point to new one
      await subscriptionHistoryCollection.updateOne(
        { _id: currentSubscription._id },
        {
          $set: {
            nextSubscription: result.insertedId,
            updatedAt: now
          }
        }
      );

      // Get the created subscription
      const newSubscription = await subscriptionHistoryCollection.findOne({ _id: result.insertedId });

      return NextResponse.json({
        success: true,
        message: `${actualType.charAt(0).toUpperCase() + actualType.slice(1)} completed successfully!`,
        data: {
          subscription: {
            id: newSubscription._id.toString(),
            planName: newSubscription.planSnapshot.planName,
            status: newSubscription.status,
            startDate: newSubscription.startDate,
            endDate: newSubscription.endDate,
            totalLeads: newSubscription.planSnapshot.totalLeads,
            leadsRemaining: newSubscription.usage.leadsRemaining,
            daysRemaining: Math.ceil((newSubscription.endDate - now) / (1000 * 60 * 60 * 24)),
            upgradeType: actualType,
            priceDifference: Math.abs(priceDifference),
            bonusLeads: actualType === 'upgrade' ? remainingLeads : 0
          }
        }
      });

    } else {
      // Schedule for next cycle
      await subscriptionHistoryCollection.updateOne(
        { _id: currentSubscription._id },
        {
          $set: {
            'renewalInfo.nextRenewalPlan': new ObjectId(newPlanId),
            'renewalInfo.renewalDate': currentSubscription.endDate,
            updatedAt: now
          },
          $push: {
            history: {
              action: 'scheduled_change',
              date: now,
              reason: `Scheduled ${actualType} to ${newPlan.planName} at next renewal`,
              performedBy: new ObjectId(userId)
            }
          }
        }
      );

      return NextResponse.json({
        success: true,
        message: `${actualType.charAt(0).toUpperCase() + actualType.slice(1)} scheduled for next renewal!`,
        data: {
          currentSubscription: {
            id: currentSubscription._id.toString(),
            planName: currentSubscription.planSnapshot.planName,
            endDate: currentSubscription.endDate
          },
          scheduledChange: {
            newPlanName: newPlan.planName,
            effectiveDate: currentSubscription.endDate,
            changeType: actualType,
            priceDifference: Math.abs(priceDifference)
          }
        }
      });
    }

  } catch (error) {
    console.error('Subscription upgrade/downgrade error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process subscription change'
    }, { status: 500 });
  }
}

// DELETE /api/vendors/subscriptions/[id] - Cancel subscription
export async function DELETE(request, { params }) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;
    const subscriptionId = params.id;

    if (!subscriptionId) {
      return NextResponse.json({
        success: false,
        error: 'Subscription ID is required'
      }, { status: 400 });
    }

    // Get database collections
    const subscriptionHistoryCollection = await database.getSubscriptionHistoryCollection();

    // Get current subscription
    const subscription = await subscriptionHistoryCollection.findOne({
      _id: new ObjectId(subscriptionId),
      user: new ObjectId(userId),
      status: 'active',
      isActive: true
    });

    if (!subscription) {
      return NextResponse.json({
        success: false,
        error: 'Active subscription not found'
      }, { status: 404 });
    }

    const now = new Date();

    // Cancel the subscription
    await subscriptionHistoryCollection.updateOne(
      { _id: subscription._id },
      {
        $set: {
          status: 'cancelled',
          isActive: false,
          updatedAt: now
        },
        $push: {
          history: {
            action: 'cancelled',
            date: now,
            reason: 'Cancelled by user',
            performedBy: new ObjectId(userId)
          }
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: {
        subscriptionId: subscription._id.toString(),
        cancelledAt: now,
        refundEligible: false, // Implement refund logic as needed
        accessUntil: subscription.endDate // User keeps access until original end date
      }
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to cancel subscription'
    }, { status: 500 });
  }
} 