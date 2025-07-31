import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import { ObjectId } from 'mongodb';

// GET /api/vendors/subscriptions - Get available subscription plans
export async function GET(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;

    // Get database collections
    const subscriptionPlansCollection = await database.getSubscriptionPlansCollection();
    const subscriptionHistoryCollection = await database.getSubscriptionHistoryCollection();

    // Get vendor's current subscription (active, pending, or submitted)
    const currentSubscription = await subscriptionHistoryCollection.findOne({
      user: new ObjectId(userId),
      status: { $in: ['active', 'pending'] } // Include pending subscriptions
    }, {
      sort: { createdAt: -1 } // Get the most recent one
    });

          // Get all active subscription plans (regular + custom assigned to this vendor)
      const plans = await subscriptionPlansCollection.find({
        $or: [
          { isCustom: false, isActive: true }, // Regular plans
          { isCustom: true, isActive: true, assignedToVendors: new ObjectId(userId) } // Custom plans for this vendor
        ]
      }).sort({ price: 1 }).toArray();

    // Format plans with additional information
    const formattedPlans = plans.map(plan => {
      const discountPercentage = plan.discountedPrice && plan.discountedPrice < plan.price 
        ? Math.round(((plan.price - plan.discountedPrice) / plan.price) * 100) 
        : 0;

      const effectivePrice = plan.discountedPrice || plan.price;
      const pricePerLead = Math.round(effectivePrice / plan.totalLeads);

      return {
        id: plan._id.toString(),
        planName: plan.planName,
        description: plan.description,
        duration: plan.duration,
        durationInDays: plan.durationInDays,
        totalLeads: plan.totalLeads,
        leadsPerMonth: plan.leadsPerMonth,
        price: plan.price,
        discountedPrice: plan.discountedPrice,
        effectivePrice,
        currency: plan.currency,
        discountPercentage,
        pricePerLead,
        isDiscounted: !!plan.discountedPrice,
        features: plan.features || [],
        limitations: plan.limitations || {},
        isCurrentPlan: currentSubscription?.subscriptionPlan?.toString() === plan._id.toString(),
        canUpgradeTo: currentSubscription ? effectivePrice > (currentSubscription.planSnapshot?.discountedPrice || currentSubscription.planSnapshot?.price || 0) : true
      };
    });

    // Group plans by duration for better UX
    const plansByDuration = {
      '1-month': formattedPlans.filter(p => p.duration === '1-month'),
      '3-month': formattedPlans.filter(p => p.duration === '3-month'),
      '6-month': formattedPlans.filter(p => p.duration === '6-month'),
      '12-month': formattedPlans.filter(p => p.duration === '12-month')
    };

    return NextResponse.json({
      success: true,
      data: {
        currentSubscription: currentSubscription ? {
          id: currentSubscription._id.toString(),
          planName: currentSubscription.planSnapshot.planName,
          status: currentSubscription.status,
          startDate: currentSubscription.startDate,
          endDate: currentSubscription.endDate,
          daysRemaining: Math.max(0, Math.ceil((currentSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24))),
          usage: currentSubscription.usage,
          payment: {
            method: currentSubscription.payment.paymentMethod,
            status: currentSubscription.payment.paymentStatus,
            amount: currentSubscription.payment.amount,
            transactionId: currentSubscription.payment.transactionId
          },
          isActive: currentSubscription.isActive
        } : null,
        plans: formattedPlans,
        plansByDuration,
        recommendations: {
          mostPopular: formattedPlans.find(p => p.duration === '3-month'),
          bestValue: formattedPlans.reduce((best, current) => 
            current.pricePerLead < (best?.pricePerLead || Infinity) ? current : best, null),
          longestDuration: formattedPlans.find(p => p.duration === '12-month')
        }
      }
    });

  } catch (error) {
    console.error('Get subscription plans error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch subscription plans'
    }, { status: 500 });
  }
}

// POST /api/vendors/subscriptions - Purchase subscription
export async function POST(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;
    const { planId, paymentMethod = 'online', discountCode, transactionId } = await request.json();

    if (!planId) {
      return NextResponse.json({
        success: false,
        error: 'Subscription plan ID is required'
      }, { status: 400 });
    }

    // Get database collections
    const subscriptionPlansCollection = await database.getSubscriptionPlansCollection();
    const subscriptionHistoryCollection = await database.getSubscriptionHistoryCollection();
    const usersCollection = await database.getUsersCollection();

    // Get the selected plan
    const plan = await subscriptionPlansCollection.findOne({
      _id: new ObjectId(planId),
      isActive: true
    });

    if (!plan) {
      return NextResponse.json({
        success: false,
        error: 'Subscription plan not found or inactive'
      }, { status: 404 });
    }

    // Check if user already has an active or pending subscription
    const existingSubscription = await subscriptionHistoryCollection.findOne({
      user: new ObjectId(userId),
      status: { $in: ['active', 'pending'] }
    });

    if (existingSubscription) {
      const errorMessage = existingSubscription.status === 'active' 
        ? 'You already have an active subscription. Please upgrade or wait for it to expire.'
        : 'You already have a pending subscription. Please wait for verification or contact support.';
      
      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 400 });
    }

    // Calculate effective price (with discount if applicable)
    let effectivePrice = plan.discountedPrice || plan.price;
    const discountsApplied = [];

    // Apply discount code if provided (simplified - you can implement discount logic)
    if (discountCode) {
      // Implement discount code logic here
      // For now, just log it
      console.log('Discount code applied:', discountCode);
    }

    // Create subscription history record
    const now = new Date();
    const endDate = new Date(now.getTime() + (plan.durationInDays * 24 * 60 * 60 * 1000));

    // Determine payment status based on method and transaction details
    let paymentStatus = 'pending';
    let historyReason = `Subscription purchased: ${plan.planName}`;

    if (paymentMethod === 'bank_transfer' && transactionId) {
      paymentStatus = 'submitted';
      historyReason = `Subscription purchased with bank transfer. TXN: ${transactionId}`;
    }

    const subscriptionData = {
      user: new ObjectId(userId),
      subscriptionPlan: new ObjectId(planId),
      planSnapshot: {
        planName: plan.planName,
        description: plan.description,
        duration: plan.duration,
        durationInDays: plan.durationInDays,
        totalLeads: plan.totalLeads,
        leadsPerMonth: plan.leadsPerMonth,
        price: plan.price,
        discountedPrice: plan.discountedPrice,
        features: plan.features || []
      },
      startDate: now,
      endDate: endDate,
      status: 'pending', // Will be 'active' after payment confirmation
      isActive: false,
      usage: {
        leadsConsumed: 0,
        leadsRemaining: plan.totalLeads,
        lastLeadConsumedAt: null,
        monthlyUsage: [],
        averageLeadsPerMonth: 0,
        totalJobsCompleted: 0,
        conversionRate: 0
      },
      payment: {
        amount: effectivePrice,
        currency: plan.currency || 'INR',
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        paymentDate: now,
        transactionId: transactionId || null
      },
      history: [{
        action: 'purchased',
        date: now,
        reason: historyReason,
        performedBy: new ObjectId(userId)
      }],
      discountsApplied: discountsApplied,
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

    const result = await subscriptionHistoryCollection.insertOne(subscriptionData);

    // Auto-activate for online payments, keep pending for bank transfers
    if (paymentMethod === 'online') {
      await subscriptionHistoryCollection.updateOne(
        { _id: result.insertedId },
        {
          $set: {
            status: 'active',
            isActive: true,
            'payment.paymentStatus': 'completed',
            'payment.paymentDate': now,
            'payment.transactionId': transactionId || `TXN${Date.now()}`,
            updatedAt: now
          },
          $push: {
            history: {
              action: 'activated',
              date: now,
              reason: 'Online payment completed successfully'
            }
          }
        }
      );
    }
    // For bank_transfer, subscription remains pending until admin verification

    // Get the created subscription with full details
    const createdSubscription = await subscriptionHistoryCollection.findOne({
      _id: result.insertedId
    });

    // Determine response message based on payment status
    let responseMessage = 'Subscription purchased successfully!';
    let statusMessage = '';
    let nextSteps = [];

    if (paymentMethod === 'online') {
      statusMessage = 'Your subscription is now active! You can start receiving leads.';
      nextSteps = [
        'Start browsing available leads'
      ];
    } else if (paymentMethod === 'bank_transfer') {
      if (transactionId) {
        statusMessage = 'Payment details submitted successfully! Admin will verify within 24 hours.';
        nextSteps = [
          'Your payment details have been submitted for verification',
          'Admin will verify the payment within 24 hours',
          'You will receive a notification once verified',
          'Subscription will be activated upon verification'
        ];
      } else {
        statusMessage = 'Subscription created! Please make payment and submit transaction details.';
        nextSteps = [
          'Make payment to the provided bank account',
          'Note down the transaction ID/UTR number',
          'Submit payment details by updating your subscription',
          'Admin will verify payment within 24 hours'
        ];
      }
    }

    return NextResponse.json({
      success: true,
      message: responseMessage,
      data: {
        subscription: {
          id: createdSubscription._id.toString(),
          planName: createdSubscription.planSnapshot.planName,
          status: createdSubscription.status,
          startDate: createdSubscription.startDate,
          endDate: createdSubscription.endDate,
          totalLeads: createdSubscription.planSnapshot.totalLeads,
          leadsRemaining: createdSubscription.usage.leadsRemaining,
          daysRemaining: Math.ceil((createdSubscription.endDate - now) / (1000 * 60 * 60 * 24)),
          payment: {
            amount: createdSubscription.payment.amount,
            currency: createdSubscription.payment.currency,
            method: createdSubscription.payment.paymentMethod,
            status: createdSubscription.payment.paymentStatus,
            transactionId: createdSubscription.payment.transactionId
          }
        },
        message: statusMessage,
        nextSteps: nextSteps
      }
    });

  } catch (error) {
    console.error('Purchase subscription error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to purchase subscription'
    }, { status: 500 });
  }
} 