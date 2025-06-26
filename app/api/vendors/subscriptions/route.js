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

    // Get vendor's current active subscription
    const currentSubscription = await subscriptionHistoryCollection.findOne({
      user: new ObjectId(userId),
      status: 'active',
      isActive: true
    });

    // Get all active subscription plans
    const plans = await subscriptionPlansCollection
      .find({ isActive: true })
      .sort({ price: 1 })
      .toArray();

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
          usage: currentSubscription.usage
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
    const { planId, paymentMethod = 'online', discountCode } = await request.json();

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

    // Check if user already has an active subscription
    const existingSubscription = await subscriptionHistoryCollection.findOne({
      user: new ObjectId(userId),
      status: 'active',
      isActive: true
    });

    if (existingSubscription) {
      return NextResponse.json({
        success: false,
        error: 'You already have an active subscription. Please upgrade or wait for it to expire.'
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
        paymentStatus: 'pending',
        paymentDate: null
      },
      history: [{
        action: 'purchased',
        date: now,
        reason: `Subscription purchased: ${plan.planName}`
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

    // For demo purposes, auto-activate the subscription (in production, activate after payment)
    await subscriptionHistoryCollection.updateOne(
      { _id: result.insertedId },
      {
        $set: {
          status: 'active',
          isActive: true,
          'payment.paymentStatus': 'completed',
          'payment.paymentDate': now,
          'payment.transactionId': `TXN${Date.now()}`,
          updatedAt: now
        },
        $push: {
          history: {
            action: 'activated',
            date: now,
            reason: 'Payment completed successfully'
          }
        }
      }
    );

    // Get the created subscription with full details
    const createdSubscription = await subscriptionHistoryCollection.findOne({
      _id: result.insertedId
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription purchased successfully!',
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
            status: createdSubscription.payment.paymentStatus,
            transactionId: createdSubscription.payment.transactionId
          }
        },
        message: 'Your subscription is now active! You can start receiving leads.',
        nextSteps: [
          'Complete your profile verification for better lead matching',
          'Set up your service preferences',
          'Start browsing available leads'
        ]
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