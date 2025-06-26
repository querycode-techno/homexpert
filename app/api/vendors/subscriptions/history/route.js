import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import { ObjectId } from 'mongodb';

// GET /api/vendors/subscriptions/history - Get vendor subscription history
export async function GET(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status'); // active, expired, cancelled, etc.
    const skip = (page - 1) * limit;

    // Get database collections
    const subscriptionHistoryCollection = await database.getSubscriptionHistoryCollection();

    // Build query
    const query = { user: new ObjectId(userId) };
    if (status) {
      query.status = status;
    }

    // Get total count for pagination
    const totalCount = await subscriptionHistoryCollection.countDocuments(query);

    // Get subscriptions with pagination
    const subscriptions = await subscriptionHistoryCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Format subscription data
    const formattedSubscriptions = subscriptions.map(sub => {
      const now = new Date();
      const daysRemaining = sub.endDate ? Math.max(0, Math.ceil((sub.endDate - now) / (1000 * 60 * 60 * 24))) : 0;
      const usagePercentage = sub.planSnapshot?.totalLeads ? 
        Math.round((sub.usage.leadsConsumed / sub.planSnapshot.totalLeads) * 100) : 0;

      return {
        id: sub._id.toString(),
        planName: sub.planSnapshot.planName,
        description: sub.planSnapshot.description,
        duration: sub.planSnapshot.duration,
        status: sub.status,
        isActive: sub.isActive,
        
        // Dates
        startDate: sub.startDate,
        endDate: sub.endDate,
        daysRemaining,
        isExpired: daysRemaining === 0 && sub.endDate < now,
        isExpiringSoon: daysRemaining <= 7 && daysRemaining > 0,
        
        // Plan details
        totalLeads: sub.planSnapshot.totalLeads,
        leadsPerMonth: sub.planSnapshot.leadsPerMonth,
        
        // Usage tracking
        usage: {
          leadsConsumed: sub.usage.leadsConsumed,
          leadsRemaining: sub.usage.leadsRemaining,
          usagePercentage,
          lastLeadConsumedAt: sub.usage.lastLeadConsumedAt,
          totalJobsCompleted: sub.usage.totalJobsCompleted || 0,
          conversionRate: sub.usage.conversionRate || 0
        },
        
        // Payment info
        payment: {
          amount: sub.payment.amount,
          currency: sub.payment.currency,
          paymentMethod: sub.payment.paymentMethod,
          paymentStatus: sub.payment.paymentStatus,
          paymentDate: sub.payment.paymentDate,
          transactionId: sub.payment.transactionId,
          refundAmount: sub.payment.refundAmount || 0
        },
        
        // Performance metrics
        performance: sub.performance || {
          leadAcceptanceRate: 0,
          jobCompletionRate: 0,
          customerSatisfactionScore: 0,
          averageJobValue: 0,
          totalRevenue: 0
        },
        
        // History
        recentHistory: sub.history?.slice(-3) || [],
        
        // Features
        features: sub.planSnapshot.features || [],
        
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt
      };
    });

    // Get current active subscription for dashboard
    const activeSubscription = formattedSubscriptions.find(sub => sub.isActive && sub.status === 'active');

    // Calculate summary statistics
    const totalSpent = subscriptions.reduce((sum, sub) => 
      sum + (sub.payment.amount - (sub.payment.refundAmount || 0)), 0);
    
    const totalLeadsConsumed = subscriptions.reduce((sum, sub) => 
      sum + sub.usage.leadsConsumed, 0);
    
    const averageUsageRate = subscriptions.length > 0 ? 
      subscriptions.reduce((sum, sub) => {
        const usage = sub.planSnapshot?.totalLeads ? 
          (sub.usage.leadsConsumed / sub.planSnapshot.totalLeads) * 100 : 0;
        return sum + usage;
      }, 0) / subscriptions.length : 0;

    // Pagination info
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1
    };

    return NextResponse.json({
      success: true,
      data: {
        subscriptions: formattedSubscriptions,
        activeSubscription,
        summary: {
          totalSubscriptions: totalCount,
          totalSpent,
          totalLeadsConsumed,
          averageUsageRate: Math.round(averageUsageRate),
          activeSubscription: !!activeSubscription
        },
        pagination
      }
    });

  } catch (error) {
    console.error('Get subscription history error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch subscription history'
    }, { status: 500 });
  }
} 