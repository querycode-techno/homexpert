import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import { ObjectId } from 'mongodb';

// GET /api/vendors/leads - Get vendor's taken leads
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
    const status = searchParams.get('status');
    const service = searchParams.get('service');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'takenAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const skip = (page - 1) * limit;

    // Get database collections
    const leadsCollection = await database.getLeadsCollection();

    // Build query for vendor's taken leads
    const query = {
      takenBy: new ObjectId(vendorId)
    };

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add service filter
    if (service) {
      query.service = new RegExp(service, 'i');
    }

    // Add date range filter
    if (dateFrom || dateTo) {
      query.takenAt = {};
      if (dateFrom) {
        query.takenAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.takenAt.$lte = new Date(dateTo);
      }
    }

    // Get total count for pagination
    const totalCount = await leadsCollection.countDocuments(query);

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get leads with pagination
    const leads = await leadsCollection
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Format leads data with detailed information
    const formattedLeads = leads.map(lead => {
      const now = new Date();
      const daysSinceTaken = lead.takenAt ? Math.floor((now - lead.takenAt) / (1000 * 60 * 60 * 24)) : 0;
      const isOverdue = daysSinceTaken > 7 && ['taken', 'contacted'].includes(lead.status);

      return {
        id: lead._id.toString(),
        
        // Customer information
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
        conversionValue: lead.conversionValue,
        actualServiceCost: lead.actualServiceCost,
        
        // Scheduling
        preferredDate: lead.preferredDate,
        preferredTime: lead.preferredTime,
        scheduledDate: lead.scheduledDate,
        scheduledTime: lead.scheduledTime,
        
        // Status and timing
        status: lead.status,
        createdAt: lead.createdAt,
        takenAt: lead.takenAt,
        daysSinceTaken,
        isOverdue,
        
        // Status timestamps
        contactedAt: lead.contactedAt,
        interestedAt: lead.interestedAt,
        notInterestedAt: lead.notInterestedAt,
        scheduledAt: lead.scheduledAt,
        completedAt: lead.completedAt,
        convertedAt: lead.convertedAt,
        cancelledAt: lead.cancelledAt,
        
        // Notes and follow-ups
        notes: lead.notes || [],
        followUps: lead.followUps || [],
        latestNote: lead.notes?.length > 0 ? lead.notes[lead.notes.length - 1] : null,
        latestFollowUp: lead.followUps?.length > 0 ? lead.followUps[lead.followUps.length - 1] : null,
        
        // Progress tracking
        leadProgressHistory: lead.leadProgressHistory || [],
        
        // Additional details
        additionalNotes: lead.additionalNotes,
        
        // Business metrics
        estimatedValue: lead.price || lead.conversionValue || 0,
        isCompleted: ['completed', 'converted'].includes(lead.status),
        canRefund: !['completed', 'converted', 'cancelled'].includes(lead.status),
        
        // Refund request info
        refundRequest: lead.refundRequest || { isRequested: false },
        
        // Action indicators
        needsAction: ['taken'].includes(lead.status) && daysSinceTaken >= 1,
        urgentAction: isOverdue,
        
        // Next steps based on status
        nextSteps: getNextSteps(lead.status, daysSinceTaken)
      };
    });

    // Get vendor's lead statistics
    const leadStats = await leadsCollection.aggregate([
      {
        $match: {
          takenBy: new ObjectId(vendorId)
        }
      },
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
    ]);

    // Calculate summary statistics
    const summary = {
      total: totalCount,
      byStatus: leadStats.reduce((acc, stat) => {
        acc[stat._id] = { count: stat.count, value: stat.totalValue };
        return acc;
      }, {}),
      totalValue: leadStats.reduce((sum, stat) => sum + stat.totalValue, 0),
      conversionRate: totalCount > 0 ? 
        Math.round(((summary.byStatus?.completed?.count || 0) + (summary.byStatus?.converted?.count || 0)) / totalCount * 100) : 0
    };

    // Add missing status counts
    const allStatuses = ['taken', 'contacted', 'interested', 'not_interested', 'scheduled', 'in_progress', 'completed', 'converted', 'cancelled'];
    allStatuses.forEach(status => {
      if (!summary.byStatus[status]) {
        summary.byStatus[status] = { count: 0, value: 0 };
      }
    });

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
        summary,
        pagination,
        filters: {
          appliedFilters: {
            status: status || null,
            service: service || null,
            dateFrom: dateFrom || null,
            dateTo: dateTo || null
          }
        }
      }
    });

  } catch (error) {
    console.error('Get vendor leads error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch vendor leads'
    }, { status: 500 });
  }
}

// POST /api/vendors/leads - Take a lead
export async function POST(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;
    const { leadId } = await request.json();

    if (!leadId) {
      return NextResponse.json({
        success: false,
        error: 'Lead ID is required'
      }, { status: 400 });
    }

    // Get database collections
    const leadsCollection = await database.getLeadsCollection();
    const subscriptionHistoryCollection = await database.getSubscriptionHistoryCollection();

    // Check vendor's active subscription
    const activeSubscription = await subscriptionHistoryCollection.findOne({
      user: new ObjectId(userId),
      status: 'active',
      isActive: true
    });

    if (!activeSubscription) {
      return NextResponse.json({
        success: false,
        error: 'No active subscription found. Please purchase a subscription to take leads.',
        requiresSubscription: true
      }, { status: 403 });
    }

    // Check if vendor has remaining leads
    if (activeSubscription.usage.leadsRemaining <= 0) {
      return NextResponse.json({
        success: false,
        error: 'No leads remaining in your subscription. Please upgrade your plan.',
        needsUpgrade: true
      }, { status: 403 });
    }

    // Get the lead
    const lead = await leadsCollection.findOne({
      _id: new ObjectId(leadId),
      'availableToVendors.vendor': new ObjectId(vendorId),
      status: { $in: ['available', 'assigned'] },
      takenBy: { $exists: false }
    });

    if (!lead) {
      return NextResponse.json({
        success: false,
        error: 'Lead not found, not available to you, or already taken',
        alreadyTaken: true
      }, { status: 404 });
    }

    const now = new Date();

    // Take the lead
    const updateResult = await leadsCollection.updateOne(
      { 
        _id: new ObjectId(leadId),
        takenBy: { $exists: false } // Double-check it hasn't been taken
      },
      {
        $set: {
          takenBy: new ObjectId(vendorId),
          takenAt: now,
          status: 'taken',
          modifiedBy: new ObjectId(userId)
        },
        $push: {
          leadProgressHistory: {
            fromStatus: lead.status,
            toStatus: 'taken',
            performedBy: new ObjectId(vendorId),
            reason: 'Lead taken by vendor',
            date: now
          }
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Lead was just taken by another vendor or is no longer available',
        alreadyTaken: true
      }, { status: 409 });
    }

    // Update subscription usage
    await subscriptionHistoryCollection.updateOne(
      { _id: activeSubscription._id },
      {
        $inc: {
          'usage.leadsConsumed': 1,
          'usage.leadsRemaining': -1
        },
        $set: {
          'usage.lastLeadConsumedAt': now,
          updatedAt: now
        },
        $push: {
          leadAssignments: {
            leadId: new ObjectId(leadId),
            assignedAt: now,
            status: 'assigned'
          }
        }
      }
    );

    // Update monthly usage
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyUsageUpdate = await subscriptionHistoryCollection.updateOne(
      { 
        _id: activeSubscription._id,
        'usage.monthlyUsage.month': currentMonth
      },
      {
        $inc: {
          'usage.monthlyUsage.$.leadsUsed': 1
        },
        $set: {
          'usage.monthlyUsage.$.usagePercentage': Math.round(((activeSubscription.usage.monthlyUsage.find(m => m.month === currentMonth)?.leadsUsed || 0) + 1) / activeSubscription.planSnapshot.leadsPerMonth * 100)
        }
      }
    );

    // If no monthly usage entry exists, create one
    if (monthlyUsageUpdate.matchedCount === 0) {
      await subscriptionHistoryCollection.updateOne(
        { _id: activeSubscription._id },
        {
          $push: {
            'usage.monthlyUsage': {
              month: currentMonth,
              year: now.getFullYear(),
              monthNumber: now.getMonth() + 1,
              leadsUsed: 1,
              leadsAllocated: activeSubscription.planSnapshot.leadsPerMonth,
              usagePercentage: Math.round((1 / activeSubscription.planSnapshot.leadsPerMonth) * 100)
            }
          }
        }
      );
    }

    // Get updated lead details
    const updatedLead = await leadsCollection.findOne({ _id: new ObjectId(leadId) });

    return NextResponse.json({
      success: true,
      message: 'Lead taken successfully!',
      data: {
        lead: {
          id: updatedLead._id.toString(),
          customerName: updatedLead.customerName,
          service: updatedLead.service,
          address: updatedLead.address,
          price: updatedLead.price,
          status: updatedLead.status,
          takenAt: updatedLead.takenAt,
          description: updatedLead.description
        },
        subscription: {
          leadsRemaining: activeSubscription.usage.leadsRemaining - 1,
          totalLeads: activeSubscription.planSnapshot.totalLeads,
          usagePercentage: Math.round(((activeSubscription.usage.leadsConsumed + 1) / activeSubscription.planSnapshot.totalLeads) * 100)
        },
        nextSteps: [
          'Contact the customer immediately',
          'Understand their requirements',
          'Provide a quote if needed',
          'Schedule a visit if required'
        ]
      }
    });

  } catch (error) {
    console.error('Take lead error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to take lead'
    }, { status: 500 });
  }
}

// Helper function to determine next steps based on status
function getNextSteps(status, daysSinceTaken) {
  const steps = {
    taken: daysSinceTaken === 0 ? 
      ['Contact the customer immediately', 'Understand requirements', 'Provide initial quote'] :
      ['Contact the customer urgently', 'Follow up on requirements', 'Schedule visit'],
    contacted: ['Follow up with customer', 'Clarify requirements', 'Send detailed quote'],
    interested: ['Schedule service visit', 'Prepare service materials', 'Confirm appointment'],
    not_interested: ['Document reason', 'Close lead', 'Focus on other opportunities'],
    scheduled: ['Prepare for service', 'Confirm appointment', 'Gather required materials'],
    in_progress: ['Complete the service', 'Update progress', 'Ensure quality'],
    completed: ['Request payment', 'Get customer feedback', 'Ask for review'],
    converted: ['Complete documentation', 'Process payment', 'Follow up for future needs'],
    cancelled: ['Document cancellation reason', 'Learn from feedback', 'Close lead']
  };

  return steps[status] || ['Update lead status', 'Take appropriate action'];
} 