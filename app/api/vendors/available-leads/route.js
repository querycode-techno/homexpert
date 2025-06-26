import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import { ObjectId } from 'mongodb';

// GET /api/vendors/available-leads - Get leads available to vendor
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
    const limit = parseInt(searchParams.get('limit')) || 20;
    const service = searchParams.get('service');
    const location = searchParams.get('location');
    const maxPrice = searchParams.get('maxPrice');
    const urgency = searchParams.get('urgency');
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // createdAt, price, distance
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const skip = (page - 1) * limit;

    // Get database collections
    const leadsCollection = await database.getLeadsCollection();
    const subscriptionHistoryCollection = await database.getSubscriptionHistoryCollection();
    const vendorsCollection = await database.getVendorsCollection();

    // Check vendor's active subscription
    const activeSubscription = await subscriptionHistoryCollection.findOne({
      user: new ObjectId(userId),
      status: 'active',
      isActive: true
    });

    if (!activeSubscription) {
      return NextResponse.json({
        success: false,
        error: 'No active subscription found. Please purchase a subscription to view leads.',
        requiresSubscription: true
      }, { status: 403 });
    }

    // Check if vendor has remaining leads
    if (activeSubscription.usage.leadsRemaining <= 0) {
      return NextResponse.json({
        success: false,
        error: 'No leads remaining in your subscription. Please upgrade your plan.',
        needsUpgrade: true,
        subscription: {
          id: activeSubscription._id.toString(),
          planName: activeSubscription.planSnapshot.planName,
          leadsConsumed: activeSubscription.usage.leadsConsumed,
          totalLeads: activeSubscription.planSnapshot.totalLeads
        }
      }, { status: 403 });
    }

    // Get vendor details for service matching
    const vendor = await vendorsCollection.findOne({ _id: new ObjectId(vendorId) });
    
    if (!vendor) {
      return NextResponse.json({
        success: false,
        error: 'Vendor profile not found'
      }, { status: 404 });
    }

    // Build query for available leads
    const query = {
      'availableToVendors.vendor': new ObjectId(vendorId),
      status: { $in: ['available', 'assigned'] },
      takenBy: { $exists: false }
    };

    // Add service filter (match vendor's services if not specified)
    if (service) {
      query.service = new RegExp(service, 'i');
    } else {
      // Filter by vendor's services
      query.service = { $in: vendor.services.map(s => new RegExp(s, 'i')) };
    }

    // Add location filter
    if (location) {
      query.address = new RegExp(location, 'i');
    }

    // Add price filter
    if (maxPrice) {
      query.price = { $lte: parseInt(maxPrice) };
    }

    // Add urgency filter
    if (urgency) {
      query.urgency = urgency;
    }

    // Get total count for pagination
    const totalCount = await leadsCollection.countDocuments(query);

    // Build sort options
    const sortOptions = {};
    switch (sortBy) {
      case 'price':
        sortOptions.price = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'distance':
        // For now, sort by address alphabetically (implement geolocation later)
        sortOptions.address = sortOrder === 'asc' ? 1 : -1;
        break;
      default:
        sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;
    }

    // Get leads with pagination
    const leads = await leadsCollection
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Format leads data
    const formattedLeads = leads.map(lead => {
      const now = new Date();
      const hoursAgo = Math.floor((now - lead.createdAt) / (1000 * 60 * 60));
      const isUrgent = lead.urgency === 'urgent' || hoursAgo >= 24;

      return {
        id: lead._id.toString(),
        customerName: lead.customerName,
        customerPhone: lead.customerPhone,
        customerEmail: lead.customerEmail,
        
        // Service details
        service: lead.service,
        selectedService: lead.selectedService,
        selectedSubService: lead.selectedSubService,
        description: lead.description,
        
        // Location
        address: lead.address,
        
        // Pricing
        price: lead.price,
        getQuote: lead.getQuote,
        
        // Scheduling
        preferredDate: lead.preferredDate,
        preferredTime: lead.preferredTime,
        
        // Status and timing
        status: lead.status,
        createdAt: lead.createdAt,
        hoursAgo,
        isUrgent,
        urgency: lead.urgency || 'normal',
        
        // Assignment info
        assignedAt: lead.availableToVendors?.assignedAt,
        vendorCount: lead.availableToVendors?.vendor?.length || 0,
        isExclusive: (lead.availableToVendors?.vendor?.length || 0) === 1,
        
        // Additional details
        additionalNotes: lead.additionalNotes,
        
        // Lead value indicators
        estimatedValue: lead.price || 0,
        hasExactPrice: !!lead.price && !lead.getQuote,
        requiresQuote: lead.getQuote,
        
        // Competition level
        competitionLevel: lead.availableToVendors?.vendor?.length > 3 ? 'high' : 
                         lead.availableToVendors?.vendor?.length > 1 ? 'medium' : 'low'
      };
    });

    // Get vendor's lead statistics
    const leadStats = await leadsCollection.aggregate([
      {
        $match: {
          'availableToVendors.vendor': new ObjectId(vendorId)
        }
      },
      {
        $group: {
          _id: null,
          totalAvailable: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $in: ['$status', ['available', 'assigned']] },
                    { $eq: ['$takenBy', null] }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalTaken: {
            $sum: {
              $cond: [{ $eq: ['$takenBy', new ObjectId(vendorId)] }, 1, 0]
            }
          },
          totalValue: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$price', null] }, { $eq: ['$takenBy', new ObjectId(vendorId)] }] },
                '$price',
                0
              ]
            }
          }
        }
      }
    ]);

    const stats = leadStats[0] || { totalAvailable: 0, totalTaken: 0, totalValue: 0 };

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
        leads: formattedLeads,
        subscription: {
          id: activeSubscription._id.toString(),
          planName: activeSubscription.planSnapshot.planName,
          leadsRemaining: activeSubscription.usage.leadsRemaining,
          totalLeads: activeSubscription.planSnapshot.totalLeads,
          usagePercentage: Math.round((activeSubscription.usage.leadsConsumed / activeSubscription.planSnapshot.totalLeads) * 100),
          daysRemaining: Math.max(0, Math.ceil((activeSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24)))
        },
        statistics: {
          available: stats.totalAvailable,
          taken: stats.totalTaken,
          totalValue: stats.totalValue,
          conversionRate: stats.totalAvailable > 0 ? Math.round((stats.totalTaken / (stats.totalAvailable + stats.totalTaken)) * 100) : 0
        },
        filters: {
          services: vendor.services,
          appliedFilters: {
            service: service || null,
            location: location || null,
            maxPrice: maxPrice || null,
            urgency: urgency || null
          }
        },
        pagination
      }
    });

  } catch (error) {
    console.error('Get available leads error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch available leads'
    }, { status: 500 });
  }
} 