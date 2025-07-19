import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import { ObjectId } from 'mongodb';

// GET /api/vendors/dashboard - Get comprehensive vendor dashboard data
export async function GET(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;

    // Get database collections
    const vendorsCollection = await database.getVendorsCollection();
    const leadsCollection = await database.getLeadsCollection();
    const subscriptionHistoryCollection = await database.getSubscriptionHistoryCollection();
    const usersCollection = await database.getUsersCollection();

    // Get vendor and user info
    const [vendor, user] = await Promise.all([
      vendorsCollection.findOne({ _id: new ObjectId(vendorId) }),
      usersCollection.findOne({ _id: new ObjectId(userId) })
    ]);

    if (!vendor || !user) {
      return NextResponse.json({
        success: false,
        error: 'Vendor or user not found'
      }, { status: 404 });
    }

    // Get current date ranges for analytics
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(thisMonthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    // Get active subscription
    const activeSubscription = await subscriptionHistoryCollection.findOne({
      user: new ObjectId(userId),
      status: 'active',
      isActive: true
    });

    // Get subscription data or default structure
    const subscriptionData = activeSubscription ? {
      id: activeSubscription._id.toString(),
      planName: activeSubscription.planSnapshot.planName,
      status: activeSubscription.status,
      isActive: true,
      startDate: activeSubscription.startDate,
      endDate: activeSubscription.endDate,
      daysRemaining: Math.max(0, Math.ceil((activeSubscription.endDate - now) / (1000 * 60 * 60 * 24))),
      isExpiringSoon: Math.ceil((activeSubscription.endDate - now) / (1000 * 60 * 60 * 24)) <= 7,
      usage: {
        leadsConsumed: activeSubscription.usage.leadsConsumed,
        leadsRemaining: activeSubscription.usage.leadsRemaining,
        totalLeads: activeSubscription.planSnapshot.totalLeads,
        usagePercentage: Math.round((activeSubscription.usage.leadsConsumed / activeSubscription.planSnapshot.totalLeads) * 100),
        monthlyUsage: activeSubscription.monthlyUsage || []
      },
      features: activeSubscription.planSnapshot.features || [],
      performance: activeSubscription.performance || {}
    } : null;

    // Get comprehensive lead statistics
    const [
      // Available leads count
      availableLeadsCount,
      
      // Taken leads statistics
      totalTakenLeads,
      todayTakenLeads,
      weekTakenLeads,
      monthTakenLeads,
      yesterdayTakenLeads,
      lastWeekTakenLeads,
      lastMonthTakenLeads,
      
      // Lead status breakdown
      leadStatusStats,
      
      // Revenue and conversion data
      revenueStats,
      
      // Recent leads
      recentTakenLeads,
      recentAvailableLeads,
      
      // Overdue and action required leads
      overdueLeads,
      actionRequiredLeads
    ] = await Promise.all([
      // Available leads count (if subscription active)
      activeSubscription ? leadsCollection.countDocuments({
        'availableToVendors.vendor': new ObjectId(vendorId),
        status: { $in: ['available', 'assigned'] },
        takenBy: { $exists: false }
      }) : 0,
      
      // Total taken leads
      leadsCollection.countDocuments({ takenBy: new ObjectId(vendorId) }),
      
      // Today's taken leads
      leadsCollection.countDocuments({
        takenBy: new ObjectId(vendorId),
        takenAt: { $gte: todayStart }
      }),
      
      // This week's taken leads
      leadsCollection.countDocuments({
        takenBy: new ObjectId(vendorId),
        takenAt: { $gte: thisWeekStart }
      }),
      
      // This month's taken leads
      leadsCollection.countDocuments({
        takenBy: new ObjectId(vendorId),
        takenAt: { $gte: thisMonthStart }
      }),
      
      // Yesterday's taken leads
      leadsCollection.countDocuments({
        takenBy: new ObjectId(vendorId),
        takenAt: { $gte: yesterdayStart, $lt: todayStart }
      }),
      
      // Last week's taken leads
      leadsCollection.countDocuments({
        takenBy: new ObjectId(vendorId),
        takenAt: { $gte: lastWeekStart, $lt: thisWeekStart }
      }),
      
      // Last month's taken leads
      leadsCollection.countDocuments({
        takenBy: new ObjectId(vendorId),
        takenAt: { $gte: lastMonthStart, $lt: thisMonthStart }
      }),
      
      // Lead status breakdown
      leadsCollection.aggregate([
        { $match: { takenBy: new ObjectId(vendorId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: {
              $sum: {
                $cond: [
                  { $ne: ['$conversionValue', null] },
                  '$conversionValue',
                  { $cond: [{ $ne: ['$price', null] }, '$price', 0] }
                ]
              }
            }
          }
        }
      ]).toArray(),
      
      // Revenue and conversion statistics
      leadsCollection.aggregate([
        { $match: { takenBy: new ObjectId(vendorId) } },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $cond: [{ $ne: ['$conversionValue', null] }, '$conversionValue', 0]
              }
            },
            totalEstimatedValue: {
              $sum: {
                $cond: [{ $ne: ['$price', null] }, '$price', 0]
              }
            },
            completedLeads: {
              $sum: {
                $cond: [{ $in: ['$status', ['completed', 'converted']] }, 1, 0]
              }
            },
            totalLeads: { $sum: 1 }
          }
        }
      ]).toArray(),
      
      // Recent taken leads (last 10)
      leadsCollection.find(
        { takenBy: new ObjectId(vendorId) },
        {
          projection: {
            customerName: 1,
            service: 1,
            status: 1,
            takenAt: 1,
            price: 1,
            conversionValue: 1,
            address: 1,
            preferredDate: 1,
            scheduledDate: 1
          }
        }
      ).sort({ takenAt: -1 }).limit(10).toArray(),
      
      // Recent available leads (last 5) - if subscription active
      activeSubscription ? leadsCollection.find(
        {
          'availableToVendors.vendor': new ObjectId(vendorId),
          status: { $in: ['available', 'assigned'] },
          takenBy: { $exists: false }
        },
        {
          projection: {
            customerName: 1,
            service: 1,
            price: 1,
            address: 1,
            createdAt: 1,
            preferredDate: 1,
            urgency: 1
          }
        }
      ).sort({ createdAt: -1 }).limit(5).toArray() : [],
      
      // Overdue leads (taken > 7 days ago and still in 'taken' or 'contacted' status)
      leadsCollection.find({
        takenBy: new ObjectId(vendorId),
        status: { $in: ['taken', 'contacted'] },
        takenAt: { $lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
      }, {
        projection: {
          customerName: 1,
          service: 1,
          status: 1,
          takenAt: 1,
          address: 1
        }
      }).limit(5).toArray(),
      
      // Action required leads (status 'taken' for > 24 hours)
      leadsCollection.find({
        takenBy: new ObjectId(vendorId),
        status: 'taken',
        takenAt: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      }, {
        projection: {
          customerName: 1,
          service: 1,
          takenAt: 1,
          address: 1
        }
      }).limit(5).toArray()
    ]);

    // Process lead status statistics
    const statusBreakdown = leadStatusStats.reduce((acc, stat) => {
      acc[stat._id] = { count: stat.count, value: stat.totalValue };
      return acc;
    }, {});

    // Add missing statuses with 0 counts
    const allStatuses = ['taken', 'contacted', 'interested', 'not_interested', 'scheduled', 'in_progress', 'completed', 'converted', 'cancelled'];
    allStatuses.forEach(status => {
      if (!statusBreakdown[status]) {
        statusBreakdown[status] = { count: 0, value: 0 };
      }
    });

    // Calculate performance metrics
    const revenueData = revenueStats[0] || { totalRevenue: 0, totalEstimatedValue: 0, completedLeads: 0, totalLeads: 0 };
    const conversionRate = revenueData.totalLeads > 0 ? Math.round((revenueData.completedLeads / revenueData.totalLeads) * 100) : 0;
    const averageJobValue = revenueData.completedLeads > 0 ? Math.round(revenueData.totalRevenue / revenueData.completedLeads) : 0;

    // Calculate growth metrics
    const todayGrowth = yesterdayTakenLeads > 0 ? Math.round(((todayTakenLeads - yesterdayTakenLeads) / yesterdayTakenLeads) * 100) : 0;
    const weekGrowth = lastWeekTakenLeads > 0 ? Math.round(((weekTakenLeads - lastWeekTakenLeads) / lastWeekTakenLeads) * 100) : 0;
    const monthGrowth = lastMonthTakenLeads > 0 ? Math.round(((monthTakenLeads - lastMonthTakenLeads) / lastMonthTakenLeads) * 100) : 0;

    // Calculate account completion
    const requiredFields = [
      vendor.businessName,
      vendor.services?.length > 0,
      vendor.address,
      vendor.phone,
      vendor.description,
      vendor.documents?.identity?.docImageUrl || vendor.documents?.business?.docImageUrl
    ];
    const completedFields = requiredFields.filter(Boolean).length;
    const accountCompletionPercentage = Math.round((completedFields / requiredFields.length) * 100);

    // Determine notifications and alerts
    const notifications = [];
    const alerts = [];

    // Subscription alerts
    if (!activeSubscription) {
      alerts.push({
        type: 'warning',
        title: 'No Active Subscription',
        message: 'Purchase a subscription to start receiving leads',
        action: 'subscribe',
        priority: 'high'
      });
    } else if (subscriptionData.daysRemaining <= 7) {
      alerts.push({
        type: 'warning',
        title: 'Subscription Expiring Soon',
        message: `Your subscription expires in ${subscriptionData.daysRemaining} days`,
        action: 'renew',
        priority: 'high'
      });
    } else if (subscriptionData.usage.leadsRemaining <= 5) {
      alerts.push({
        type: 'info',
        title: 'Running Low on Leads',
        message: `Only ${subscriptionData.usage.leadsRemaining} leads remaining`,
        action: 'upgrade',
        priority: 'medium'
      });
    }

    // Verification alerts
    if (!vendor.verified?.isVerified) {
      alerts.push({
        type: 'info',
        title: 'Account Verification Pending',
        message: 'Complete document verification to build customer trust',
        action: 'verify',
        priority: 'medium'
      });
    }

    // Action required notifications
    if (overdueLeads.length > 0) {
      notifications.push({
        type: 'urgent',
        title: 'Overdue Leads',
        message: `${overdueLeads.length} leads need immediate attention`,
        action: 'view_overdue',
        count: overdueLeads.length
      });
    }

    if (actionRequiredLeads.length > 0) {
      notifications.push({
        type: 'action',
        title: 'Action Required',
        message: `${actionRequiredLeads.length} leads waiting for response`,
        action: 'view_action_required',
        count: actionRequiredLeads.length
      });
    }

    // New leads notification
    if (recentAvailableLeads.length > 0) {
      notifications.push({
        type: 'info',
        title: 'New Leads Available',
        message: `${recentAvailableLeads.length} new leads match your services`,
        action: 'view_available',
        count: recentAvailableLeads.length
      });
    }

    // Quick actions based on current state
    const quickActions = [];

    if (activeSubscription && recentAvailableLeads.length > 0) {
      quickActions.push({
        title: 'Browse Available Leads',
        description: `${availableLeadsCount} leads available`,
        action: 'browse_leads',
        icon: 'search',
        color: 'primary',
        badge: availableLeadsCount
      });
    }

    if (actionRequiredLeads.length > 0) {
      quickActions.push({
        title: 'Action Required',
        description: `${actionRequiredLeads.length} leads need response`,
        action: 'action_required',
        icon: 'alert-circle',
        color: 'warning',
        badge: actionRequiredLeads.length
      });
    }

    quickActions.push({
      title: 'My Leads',
      description: `${totalTakenLeads} total leads`,
      action: 'my_leads',
      icon: 'list',
      color: 'secondary'
    });

    if (!activeSubscription) {
      quickActions.push({
        title: 'Get Subscription',
        description: 'Start receiving leads',
        action: 'subscribe',
        icon: 'credit-card',
        color: 'success'
      });
    }

    // Format response
    const dashboardData = {
      // User and vendor profile
      profile: {
        id: vendor._id.toString(),
        userId: user._id.toString(),
        businessName: vendor.businessName,
        name: user.name,
        email: user.email,
        phone: vendor.phone,
        services: vendor.services || [],
        rating: vendor.rating || 0,
        totalJobs: vendor.totalJobs || 0,
        status: vendor.status,
        isVerified: vendor.verified?.isVerified || false,
        accountCompletion: accountCompletionPercentage,
        joinedDate: vendor.createdAt,
        daysSinceJoining: Math.floor((now - new Date(vendor.createdAt)) / (1000 * 60 * 60 * 24))
      },

      // Subscription information
      subscription: subscriptionData,

      // Lead statistics
      leads: {
        available: {
          count: availableLeadsCount,
          hasAccess: !!activeSubscription
        },
        taken: {
          total: totalTakenLeads,
          today: todayTakenLeads,
          week: weekTakenLeads,
          month: monthTakenLeads,
          growth: {
            today: todayGrowth,
            week: weekGrowth,
            month: monthGrowth
          }
        },
        status: statusBreakdown,
        overdue: overdueLeads.length,
        actionRequired: actionRequiredLeads.length
      },

      // Business performance
      performance: {
        revenue: {
          total: revenueData.totalRevenue,
          estimated: revenueData.totalEstimatedValue,
          average: averageJobValue
        },
        conversion: {
          rate: conversionRate,
          completed: revenueData.completedLeads,
          total: revenueData.totalLeads
        },
        rating: vendor.rating || 0,
        totalJobs: vendor.totalJobs || 0
      },

      // Recent activity
      recent: {
        takenLeads: recentTakenLeads.map(lead => ({
          id: lead._id.toString(),
          customerName: lead.customerName,
          service: lead.service,
          status: lead.status,
          takenAt: lead.takenAt,
          value: lead.conversionValue || lead.price || 0,
          address: lead.address,
          nextDate: lead.scheduledDate || lead.preferredDate
        })),
        availableLeads: recentAvailableLeads.map(lead => ({
          id: lead._id.toString(),
          customerName: lead.customerName,
          service: lead.service,
          price: lead.price,
          address: lead.address,
          createdAt: lead.createdAt,
          urgency: lead.urgency || 'normal'
        }))
      },

      // Notifications and alerts
      notifications,
      alerts,

      // Quick actions
      quickActions,

      // Today's summary
      todaySummary: {
        leadsReceived: todayTakenLeads,
        revenue: 0, // Would need to calculate today's revenue
        completedJobs: statusBreakdown.completed?.count || 0,
        scheduledJobs: statusBreakdown.scheduled?.count || 0
      }
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Vendor dashboard error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard data'
    }, { status: 500 });
  }
} 