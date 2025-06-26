import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import { ObjectId } from 'mongodb';

// GET /api/vendors/leads/[id]/follow-ups - Get lead follow-ups
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const status = searchParams.get('status'); // pending, completed, overdue
    const skip = (page - 1) * limit;

    // Get database collections
    const leadsCollection = await database.getLeadsCollection();

    // Get lead and verify access
    const lead = await leadsCollection.findOne({
      _id: new ObjectId(leadId),
      takenBy: new ObjectId(vendorId)
    }, {
      projection: { followUps: 1, customerName: 1, service: 1, status: 1 }
    });

    if (!lead) {
      return NextResponse.json({
        success: false,
        error: 'Lead not found or not accessible'
      }, { status: 404 });
    }

    // Get follow-ups
    let followUps = lead.followUps || [];
    
    // Calculate status for each follow-up
    const now = new Date();
    followUps = followUps.map(followUp => {
      const scheduledDate = new Date(followUp.date);
      const isOverdue = scheduledDate < now && !followUp.completed;
      const isPending = scheduledDate >= now && !followUp.completed;
      
      return {
        ...followUp,
        status: followUp.completed ? 'completed' : isOverdue ? 'overdue' : 'pending',
        isOverdue,
        isPending,
        timeAgo: getTimeAgo(followUp.date),
        daysFromNow: Math.ceil((scheduledDate - now) / (1000 * 60 * 60 * 24))
      };
    });

    // Filter by status if provided
    if (status) {
      followUps = followUps.filter(f => f.status === status);
    }

    const totalFollowUps = followUps.length;
    
    // Sort follow-ups by date (upcoming first, then recent) and paginate
    const sortedFollowUps = followUps.sort((a, b) => {
      // Pending first, then overdue, then completed
      if (a.status !== b.status) {
        const statusOrder = { pending: 0, overdue: 1, completed: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      // Within same status, sort by date
      return new Date(a.date) - new Date(b.date);
    });

    const paginatedFollowUps = sortedFollowUps.slice(skip, skip + limit);

    // Format follow-ups data
    const formattedFollowUps = paginatedFollowUps.map(followUp => ({
      id: followUp._id?.toString() || followUp.date.getTime().toString(),
      followUp: followUp.followUp,
      date: followUp.date,
      createdBy: followUp.createdBy?.toString(),
      completed: followUp.completed || false,
      completedAt: followUp.completedAt,
      status: followUp.status,
      isOverdue: followUp.isOverdue,
      isPending: followUp.isPending,
      timeAgo: followUp.timeAgo,
      daysFromNow: followUp.daysFromNow,
      priority: followUp.priority || 'normal'
    }));

    // Calculate summary statistics
    const summary = {
      total: (lead.followUps || []).length,
      pending: followUps.filter(f => f.status === 'pending').length,
      overdue: followUps.filter(f => f.status === 'overdue').length,
      completed: followUps.filter(f => f.status === 'completed').length
    };

    // Pagination info
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalFollowUps / limit),
      totalCount: totalFollowUps,
      hasNextPage: page < Math.ceil(totalFollowUps / limit),
      hasPrevPage: page > 1
    };

    return NextResponse.json({
      success: true,
      data: {
        leadInfo: {
          id: lead._id.toString(),
          customerName: lead.customerName,
          service: lead.service,
          status: lead.status
        },
        followUps: formattedFollowUps,
        summary,
        pagination
      }
    });

  } catch (error) {
    console.error('Get lead follow-ups error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch lead follow-ups'
    }, { status: 500 });
  }
}

// POST /api/vendors/leads/[id]/follow-ups - Add follow-up to lead
export async function POST(request, { params }) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;
    const leadId = params.id;
    const { 
      followUp, 
      date, 
      priority = 'normal',
      type = 'general' 
    } = await request.json();

    if (!leadId) {
      return NextResponse.json({
        success: false,
        error: 'Lead ID is required'
      }, { status: 400 });
    }

    if (!followUp || followUp.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Follow-up content is required'
      }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({
        success: false,
        error: 'Follow-up date is required'
      }, { status: 400 });
    }

    const followUpDate = new Date(date);
    if (isNaN(followUpDate.getTime())) {
      return NextResponse.json({
        success: false,
        error: 'Invalid follow-up date'
      }, { status: 400 });
    }

    if (followUp.trim().length > 500) {
      return NextResponse.json({
        success: false,
        error: 'Follow-up content cannot exceed 500 characters'
      }, { status: 400 });
    }

    // Get database collections
    const leadsCollection = await database.getLeadsCollection();

    // Verify lead access
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

    const now = new Date();

    // Create follow-up object
    const followUpData = {
      _id: new ObjectId(),
      followUp: followUp.trim(),
      date: followUpDate,
      priority: priority,
      type: type,
      createdBy: new ObjectId(vendorId),
      createdAt: now,
      completed: false
    };

    // Add follow-up to lead
    const result = await leadsCollection.updateOne(
      { _id: new ObjectId(leadId) },
      {
        $push: { followUps: followUpData },
        $set: { 
          modifiedBy: new ObjectId(userId),
          updatedAt: now 
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to add follow-up'
      }, { status: 500 });
    }

    // Calculate status and timing for the new follow-up
    const isOverdue = followUpDate < now;
    const isPending = followUpDate >= now;
    const daysFromNow = Math.ceil((followUpDate - now) / (1000 * 60 * 60 * 24));

    // Return the created follow-up
    return NextResponse.json({
      success: true,
      message: 'Follow-up scheduled successfully',
      data: {
        followUp: {
          id: followUpData._id.toString(),
          followUp: followUpData.followUp,
          date: followUpData.date,
          priority: followUpData.priority,
          type: followUpData.type,
          createdBy: followUpData.createdBy.toString(),
          createdAt: followUpData.createdAt,
          completed: followUpData.completed,
          status: isOverdue ? 'overdue' : 'pending',
          isOverdue,
          isPending,
          daysFromNow,
          timeAgo: daysFromNow === 0 ? 'today' : daysFromNow === 1 ? 'tomorrow' : `in ${Math.abs(daysFromNow)} days`
        },
        leadInfo: {
          id: lead._id.toString(),
          customerName: lead.customerName,
          service: lead.service
        }
      }
    });

  } catch (error) {
    console.error('Add lead follow-up error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add follow-up'
    }, { status: 500 });
  }
}

// PUT /api/vendors/leads/[id]/follow-ups - Update follow-up status
export async function PUT(request, { params }) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;
    const leadId = params.id;
    const { followUpId, completed, completionNote } = await request.json();

    if (!leadId || !followUpId) {
      return NextResponse.json({
        success: false,
        error: 'Lead ID and Follow-up ID are required'
      }, { status: 400 });
    }

    // Get database collections
    const leadsCollection = await database.getLeadsCollection();

    // Verify lead access
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

    const now = new Date();
    const updateFields = {};

    if (completed !== undefined) {
      updateFields['followUps.$.completed'] = completed;
      if (completed) {
        updateFields['followUps.$.completedAt'] = now;
        updateFields['followUps.$.completedBy'] = new ObjectId(vendorId);
        if (completionNote) {
          updateFields['followUps.$.completionNote'] = completionNote;
        }
      } else {
        updateFields['followUps.$.completedAt'] = null;
        updateFields['followUps.$.completedBy'] = null;
        updateFields['followUps.$.completionNote'] = null;
      }
    }

    // Update follow-up
    const result = await leadsCollection.updateOne(
      { 
        _id: new ObjectId(leadId),
        'followUps._id': new ObjectId(followUpId)
      },
      {
        $set: {
          ...updateFields,
          modifiedBy: new ObjectId(userId),
          updatedAt: now
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Follow-up not found or failed to update'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Follow-up ${completed ? 'completed' : 'reopened'} successfully`,
      data: {
        followUpId,
        completed,
        completedAt: completed ? now : null,
        leadInfo: {
          id: lead._id.toString(),
          customerName: lead.customerName,
          service: lead.service
        }
      }
    });

  } catch (error) {
    console.error('Update follow-up error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update follow-up'
    }, { status: 500 });
  }
}

// Helper function to calculate time ago/from now
function getTimeAgo(date) {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((targetDate - now) / 1000);
  const absSeconds = Math.abs(diffInSeconds);

  if (absSeconds < 60) {
    return diffInSeconds > 0 ? 'in a moment' : 'just now';
  }

  const absMinutes = Math.floor(absSeconds / 60);
  if (absMinutes < 60) {
    const label = `${absMinutes} minute${absMinutes > 1 ? 's' : ''}`;
    return diffInSeconds > 0 ? `in ${label}` : `${label} ago`;
  }

  const absHours = Math.floor(absMinutes / 60);
  if (absHours < 24) {
    const label = `${absHours} hour${absHours > 1 ? 's' : ''}`;
    return diffInSeconds > 0 ? `in ${label}` : `${label} ago`;
  }

  const absDays = Math.floor(absHours / 24);
  if (absDays === 1) {
    return diffInSeconds > 0 ? 'tomorrow' : 'yesterday';
  }
  
  if (absDays < 7) {
    const label = `${absDays} day${absDays > 1 ? 's' : ''}`;
    return diffInSeconds > 0 ? `in ${label}` : `${label} ago`;
  }

  const absWeeks = Math.floor(absDays / 7);
  if (absWeeks < 4) {
    const label = `${absWeeks} week${absWeeks > 1 ? 's' : ''}`;
    return diffInSeconds > 0 ? `in ${label}` : `${label} ago`;
  }

  const absMonths = Math.floor(absDays / 30);
  const label = `${absMonths} month${absMonths > 1 ? 's' : ''}`;
  return diffInSeconds > 0 ? `in ${label}` : `${label} ago`;
} 