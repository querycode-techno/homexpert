import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import { ObjectId } from 'mongodb';

// GET /api/vendors/dashboard - Get vendor dashboard data
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

    // Get vendor basic info
    const vendor = await vendorsCollection.findOne(
      { _id: new ObjectId(vendorId) },
      {
        projection: {
          businessName: 1,
          services: 1,
          status: 1,
          verified: 1,
          rating: 1,
          totalJobs: 1,
          createdAt: 1
        }
      }
    );

    if (!vendor) {
      return NextResponse.json({
        success: false,
        error: 'Vendor not found'
      }, { status: 404 });
    }

    // Get current date ranges for analytics
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get leads statistics
    const [
      totalLeads,
      todayLeads,
      weekLeads,
      monthLeads,
      acceptedLeads,
      rejectedLeads,
      pendingLeads
    ] = await Promise.all([
      // Total leads
      leadsCollection.countDocuments({ assignedVendor: new ObjectId(vendorId) }),
      
      // Today's leads
      leadsCollection.countDocuments({
        assignedVendor: new ObjectId(vendorId),
        createdAt: { $gte: todayStart }
      }),
      
      // This week's leads
      leadsCollection.countDocuments({
        assignedVendor: new ObjectId(vendorId),
        createdAt: { $gte: thisWeekStart }
      }),
      
      // This month's leads
      leadsCollection.countDocuments({
        assignedVendor: new ObjectId(vendorId),
        createdAt: { $gte: thisMonthStart }
      }),
      
      // Accepted leads
      leadsCollection.countDocuments({
        assignedVendor: new ObjectId(vendorId),
        status: 'accepted'
      }),
      
      // Rejected leads
      leadsCollection.countDocuments({
        assignedVendor: new ObjectId(vendorId),
        status: 'rejected'
      }),
      
      // Pending leads
      leadsCollection.countDocuments({
        assignedVendor: new ObjectId(vendorId),
        status: 'pending'
      })
    ]);

    // Get recent leads
    const recentLeads = await leadsCollection
      .find(
        { assignedVendor: new ObjectId(vendorId) },
        {
          projection: {
            customerName: 1,
            serviceType: 1,
            status: 1,
            customerPhone: 1,
            location: 1,
            createdAt: 1,
            urgency: 1
          }
        }
      )
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Calculate account completion percentage
    const requiredFields = [
      vendor.businessName,
      vendor.services?.length > 0,
      // Add document checks here if needed
    ];
    const completedFields = requiredFields.filter(Boolean).length;
    const accountCompletionPercentage = Math.round((completedFields / requiredFields.length) * 100);

    // Calculate acceptance rate
    const acceptanceRate = totalLeads > 0 ? Math.round((acceptedLeads / totalLeads) * 100) : 0;

    // Account days since joining
    const daysSinceJoining = Math.floor((now - new Date(vendor.createdAt)) / (1000 * 60 * 60 * 24));

    // Determine account status message
    let statusMessage = '';
    let statusType = 'info';

    if (vendor.status === 'pending' && !vendor.verified.isVerified) {
      statusMessage = 'Your account is pending verification. Complete your profile to get verified faster.';
      statusType = 'warning';
    } else if (vendor.status === 'active' && vendor.verified.isVerified) {
      statusMessage = 'Your account is verified and active. You can receive leads!';
      statusType = 'success';
    } else if (vendor.status === 'suspended') {
      statusMessage = 'Your account has been suspended. Please contact support.';
      statusType = 'error';
    }

    // Format response data
    const dashboardData = {
      vendor: {
        id: vendor._id.toString(),
        businessName: vendor.businessName,
        services: vendor.services,
        status: vendor.status,
        verified: vendor.verified.isVerified,
        rating: vendor.rating,
        totalJobs: vendor.totalJobs,
        daysSinceJoining,
        accountCompletionPercentage
      },
      
      statistics: {
        leads: {
          total: totalLeads,
          today: todayLeads,
          thisWeek: weekLeads,
          thisMonth: monthLeads,
          accepted: acceptedLeads,
          rejected: rejectedLeads,
          pending: pendingLeads,
          acceptanceRate
        },
        performance: {
          rating: vendor.rating,
          totalJobs: vendor.totalJobs,
          acceptanceRate
        }
      },
      
      recentActivity: {
        leads: recentLeads.map(lead => ({
          id: lead._id.toString(),
          customerName: lead.customerName,
          serviceType: lead.serviceType,
          status: lead.status,
          location: lead.location,
          urgency: lead.urgency,
          createdAt: lead.createdAt
        }))
      },
      
      accountStatus: {
        message: statusMessage,
        type: statusType,
        isVerified: vendor.verified.isVerified,
        status: vendor.status
      },
      
      quickActions: [
        {
          title: 'View Profile',
          description: 'Update your business profile',
          action: 'view_profile',
          icon: 'user'
        },
        {
          title: 'Verification Status',
          description: 'Check document verification',
          action: 'verification_status',
          icon: 'shield'
        },
        {
          title: 'Active Leads',
          description: `${pendingLeads} pending leads`,
          action: 'view_leads',
          icon: 'bell',
          badge: pendingLeads
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard data'
    }, { status: 500 });
  }
} 