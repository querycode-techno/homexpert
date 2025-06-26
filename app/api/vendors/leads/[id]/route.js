import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import { ObjectId } from 'mongodb';

// GET /api/vendors/leads/[id] - Get specific lead details
export async function GET(request, { params }) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;
    const leadId = params.id;

    if (!leadId) {
      return NextResponse.json({
        success: false,
        error: 'Lead ID is required'
      }, { status: 400 });
    }

    // Get database collections
    const leadsCollection = await database.getLeadsCollection();

    // Get lead details (only if taken by this vendor)
    const lead = await leadsCollection.findOne({
      _id: new ObjectId(leadId),
      takenBy: new ObjectId(vendorId)
    });

    if (!lead) {
      return NextResponse.json({
        success: false,
        error: 'Lead not found or not accessible'
      }, { status: 404 });
    }

    // Calculate timing metrics
    const now = new Date();
    const daysSinceTaken = lead.takenAt ? Math.floor((now - lead.takenAt) / (1000 * 60 * 60 * 24)) : 0;
    const hoursSinceTaken = lead.takenAt ? Math.floor((now - lead.takenAt) / (1000 * 60 * 60)) : 0;
    const isOverdue = daysSinceTaken > 7 && ['taken', 'contacted'].includes(lead.status);

    // Format detailed lead information
    const detailedLead = {
      id: lead._id.toString(),
      
      // Customer information
      customer: {
        name: lead.customerName,
        phone: lead.customerPhone,
        email: lead.customerEmail
      },
      
      // Service details
      service: {
        category: lead.service,
        selectedService: lead.selectedService,
        selectedSubService: lead.selectedSubService,
        description: lead.description,
        additionalNotes: lead.additionalNotes
      },
      
      // Location
      location: {
        address: lead.address
      },
      
      // Pricing information
      pricing: {
        estimatedPrice: lead.price,
        getQuote: lead.getQuote,
        conversionValue: lead.conversionValue,
        actualServiceCost: lead.actualServiceCost,
        finalAmount: lead.conversionValue || lead.actualServiceCost || lead.price
      },
      
      // Scheduling
      scheduling: {
        preferredDate: lead.preferredDate,
        preferredTime: lead.preferredTime,
        scheduledDate: lead.scheduledDate,
        scheduledTime: lead.scheduledTime,
        hasSchedule: !!(lead.scheduledDate && lead.scheduledTime)
      },
      
      // Status and timeline
      status: {
        current: lead.status,
        createdAt: lead.createdAt,
        takenAt: lead.takenAt,
        contactedAt: lead.contactedAt,
        interestedAt: lead.interestedAt,
        notInterestedAt: lead.notInterestedAt,
        scheduledAt: lead.scheduledAt,
        completedAt: lead.completedAt,
        convertedAt: lead.convertedAt,
        cancelledAt: lead.cancelledAt,
        
        // Timing metrics
        daysSinceTaken,
        hoursSinceTaken,
        isOverdue,
        needsUrgentAction: isOverdue || (lead.status === 'taken' && daysSinceTaken >= 1),
        
        // Status flow
        canContact: lead.status === 'taken',
        canSchedule: ['contacted', 'interested'].includes(lead.status),
        canComplete: ['scheduled', 'in_progress'].includes(lead.status),
        canCancel: !['completed', 'converted', 'cancelled'].includes(lead.status),
        isCompleted: ['completed', 'converted'].includes(lead.status),
        isClosed: ['completed', 'converted', 'cancelled', 'not_interested'].includes(lead.status)
      },
      
      // Communication history
      communication: {
        notes: lead.notes || [],
        followUps: lead.followUps || [],
        totalNotes: (lead.notes || []).length,
        totalFollowUps: (lead.followUps || []).length,
        lastNote: (lead.notes || []).length > 0 ? lead.notes[lead.notes.length - 1] : null,
        lastFollowUp: (lead.followUps || []).length > 0 ? lead.followUps[lead.followUps.length - 1] : null,
        lastCommunication: getLastCommunication(lead.notes, lead.followUps)
      },
      
      // Progress tracking
      progress: {
        history: lead.leadProgressHistory || [],
        milestones: getMilestones(lead),
        completion: getCompletionPercentage(lead.status),
        nextSteps: getDetailedNextSteps(lead.status, daysSinceTaken, lead)
      },
      
      // Business metrics
      business: {
        estimatedValue: lead.price || lead.conversionValue || 0,
        actualValue: lead.conversionValue || lead.actualServiceCost || 0,
        profitMargin: calculateProfitMargin(lead),
        canRefund: !['completed', 'converted', 'cancelled'].includes(lead.status),
        refundRequest: lead.refundRequest || { isRequested: false }
      },
      
      // Assignment information
      assignment: {
        assignedAt: lead.availableToVendors?.assignedAt,
        assignedBy: lead.availableToVendors?.assignedBy,
        takenAt: lead.takenAt,
        vendorCount: lead.availableToVendors?.vendor?.length || 0,
        wasExclusive: (lead.availableToVendors?.vendor?.length || 0) === 1
      }
    };

    return NextResponse.json({
      success: true,
      data: detailedLead
    });

  } catch (error) {
    console.error('Get lead details error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch lead details'
    }, { status: 500 });
  }
}

// PUT /api/vendors/leads/[id] - Update lead status and information
export async function PUT(request, { params }) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;
    const leadId = params.id;
    const { 
      status, 
      scheduledDate, 
      scheduledTime, 
      conversionValue, 
      actualServiceCost, 
      reason, 
      customerFeedback,
      note 
    } = await request.json();

    if (!leadId) {
      return NextResponse.json({
        success: false,
        error: 'Lead ID is required'
      }, { status: 400 });
    }

    // Get database collections
    const leadsCollection = await database.getLeadsCollection();
    const subscriptionHistoryCollection = await database.getSubscriptionHistoryCollection();

    // Get current lead
    const currentLead = await leadsCollection.findOne({
      _id: new ObjectId(leadId),
      takenBy: new ObjectId(vendorId)
    });

    if (!currentLead) {
      return NextResponse.json({
        success: false,
        error: 'Lead not found or not accessible'
      }, { status: 404 });
    }

    const now = new Date();
    const updateData = {
      modifiedBy: new ObjectId(userId),
      updatedAt: now
    };

    // Handle status updates
    if (status && status !== currentLead.status) {
      updateData.status = status;
      
      // Set appropriate timestamps based on status
      switch (status) {
        case 'contacted':
          updateData.contactedAt = now;
          break;
        case 'interested':
          updateData.interestedAt = now;
          break;
        case 'not_interested':
          updateData.notInterestedAt = now;
          break;
        case 'scheduled':
          updateData.scheduledAt = now;
          if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate);
          if (scheduledTime) updateData.scheduledTime = scheduledTime;
          break;
        case 'completed':
          updateData.completedAt = now;
          if (actualServiceCost) updateData.actualServiceCost = actualServiceCost;
          break;
        case 'converted':
          updateData.convertedAt = now;
          if (conversionValue) updateData.conversionValue = conversionValue;
          break;
        case 'cancelled':
          updateData.cancelledAt = now;
          break;
      }
    }

    // Handle scheduling updates
    if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate);
    if (scheduledTime) updateData.scheduledTime = scheduledTime;

    // Handle pricing updates
    if (conversionValue !== undefined) updateData.conversionValue = conversionValue;
    if (actualServiceCost !== undefined) updateData.actualServiceCost = actualServiceCost;

    // Prepare progress history entry
    const progressEntry = {
      fromStatus: currentLead.status,
      toStatus: status || currentLead.status,
      performedBy: new ObjectId(vendorId),
      reason: reason || `Status updated to ${status || currentLead.status}`,
      date: now
    };

    // Prepare update query
    const updateQuery = {
      $set: updateData,
      $push: {
        leadProgressHistory: progressEntry
      }
    };

    // Add note if provided
    if (note) {
      updateQuery.$push.notes = {
        note: note,
        createdBy: new ObjectId(vendorId),
        date: now
      };
    }

    // Update the lead
    await leadsCollection.updateOne(
      { _id: new ObjectId(leadId) },
      updateQuery
    );

    // Update subscription lead assignment status if lead is completed/converted
    if (['completed', 'converted'].includes(status)) {
      await subscriptionHistoryCollection.updateOne(
        {
          user: new ObjectId(userId),
          'leadAssignments.leadId': new ObjectId(leadId)
        },
        {
          $set: {
            'leadAssignments.$.status': 'completed',
            'leadAssignments.$.completedAt': now,
            'leadAssignments.$.revenue': conversionValue || actualServiceCost || 0
          }
        }
      );

      // Update subscription performance metrics
      await updateSubscriptionPerformance(userId, subscriptionHistoryCollection);
    }

    // Get updated lead
    const updatedLead = await leadsCollection.findOne({ _id: new ObjectId(leadId) });

    return NextResponse.json({
      success: true,
      message: `Lead ${status ? 'status updated' : 'updated'} successfully`,
      data: {
        lead: {
          id: updatedLead._id.toString(),
          status: updatedLead.status,
          customerName: updatedLead.customerName,
          service: updatedLead.service,
          scheduledDate: updatedLead.scheduledDate,
          scheduledTime: updatedLead.scheduledTime,
          conversionValue: updatedLead.conversionValue,
          actualServiceCost: updatedLead.actualServiceCost,
          updatedAt: updatedLead.updatedAt
        },
        nextSteps: getDetailedNextSteps(updatedLead.status, 0, updatedLead)
      }
    });

  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update lead'
    }, { status: 500 });
  }
}

// Helper functions
function getLastCommunication(notes = [], followUps = []) {
  const allCommunication = [
    ...notes.map(n => ({ ...n, type: 'note' })),
    ...followUps.map(f => ({ ...f, type: 'followUp' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return allCommunication[0] || null;
}

function getMilestones(lead) {
  const milestones = [
    { status: 'taken', label: 'Lead Taken', completed: !!lead.takenAt, date: lead.takenAt },
    { status: 'contacted', label: 'Customer Contacted', completed: !!lead.contactedAt, date: lead.contactedAt },
    { status: 'interested', label: 'Customer Interested', completed: !!lead.interestedAt, date: lead.interestedAt },
    { status: 'scheduled', label: 'Service Scheduled', completed: !!lead.scheduledAt, date: lead.scheduledAt },
    { status: 'completed', label: 'Service Completed', completed: !!lead.completedAt, date: lead.completedAt }
  ];

  return milestones;
}

function getCompletionPercentage(status) {
  const statusFlow = ['taken', 'contacted', 'interested', 'scheduled', 'in_progress', 'completed'];
  const currentIndex = statusFlow.indexOf(status);
  return currentIndex >= 0 ? Math.round(((currentIndex + 1) / statusFlow.length) * 100) : 0;
}

function getDetailedNextSteps(status, daysSinceTaken, lead) {
  const baseSteps = {
    taken: [
      'Call the customer immediately',
      'Introduce yourself and your services',
      'Understand their exact requirements',
      'Ask about their timeline and urgency',
      'Provide an initial estimate if possible'
    ],
    contacted: [
      'Follow up on the conversation',
      'Send detailed service information',
      'Clarify any questions they had',
      'Provide written quote if needed',
      'Schedule a site visit if required'
    ],
    interested: [
      'Schedule the service appointment',
      'Confirm date and time availability',
      'Send appointment confirmation',
      'Prepare materials and tools needed',
      'Plan the service execution'
    ],
    scheduled: [
      'Confirm appointment 1 day before',
      'Prepare all necessary materials',
      'Plan your route and timing',
      'Ensure you have customer contact info',
      'Be ready to start on time'
    ],
    in_progress: [
      'Focus on quality service delivery',
      'Keep customer informed of progress',
      'Address any issues immediately',
      'Maintain professional standards',
      'Prepare final documentation'
    ],
    completed: [
      'Request payment if not received',
      'Get customer feedback and rating',
      'Ask for testimonial or review',
      'Provide warranty information',
      'Thank customer for their business'
    ]
  };

  let steps = baseSteps[status] || ['Update lead status appropriately'];

  // Add urgency-based modifications
  if (status === 'taken' && daysSinceTaken >= 1) {
    steps.unshift('URGENT: Contact customer immediately - lead is overdue');
  }

  return steps;
}

function calculateProfitMargin(lead) {
  const revenue = lead.conversionValue || lead.actualServiceCost || lead.price || 0;
  const cost = lead.actualServiceCost || 0;
  
  if (revenue <= 0) return 0;
  return Math.round(((revenue - cost) / revenue) * 100);
}

async function updateSubscriptionPerformance(userId, subscriptionHistoryCollection) {
  // Get active subscription
  const subscription = await subscriptionHistoryCollection.findOne({
    user: new ObjectId(userId),
    status: 'active',
    isActive: true
  });

  if (!subscription) return;

  // Calculate performance metrics
  const totalAssignments = subscription.leadAssignments?.length || 0;
  const completedJobs = subscription.leadAssignments?.filter(l => l.status === 'completed').length || 0;
  const totalRevenue = subscription.leadAssignments?.reduce((sum, l) => sum + (l.revenue || 0), 0) || 0;

  const performance = {
    jobCompletionRate: totalAssignments > 0 ? Math.round((completedJobs / totalAssignments) * 100) : 0,
    totalRevenue,
    averageJobValue: completedJobs > 0 ? Math.round(totalRevenue / completedJobs) : 0
  };

  // Update subscription performance
  await subscriptionHistoryCollection.updateOne(
    { _id: subscription._id },
    {
      $set: {
        'performance.jobCompletionRate': performance.jobCompletionRate,
        'performance.totalRevenue': performance.totalRevenue,
        'performance.averageJobValue': performance.averageJobValue,
        updatedAt: new Date()
      }
    }
  );
} 