import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import SupportTicket from '@/lib/models/supportTicket';
import connectDB from '@/lib/connnectDB';
import { ObjectId } from 'mongodb';

// GET /api/vendors/support - Get vendor's support tickets
export async function GET(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');

    await connectDB();

    // Build query
    const query = { 
      vendorId: new ObjectId(vendorId)
    };

    if (status && status !== 'all') {
      query.status = status;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Get total count
    const total = await SupportTicket.countDocuments(query);

    // Get tickets with pagination
    const tickets = await SupportTicket.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ lastActivity: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get statistics
    const stats = await SupportTicket.aggregate([
      { $match: { vendorId: new ObjectId(vendorId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = {
      open: 0,
      in_progress: 0,
      waiting_for_vendor: 0,
      waiting_for_admin: 0,
      resolved: 0,
      closed: 0
    };

    stats.forEach(stat => {
      statusStats[stat._id] = stat.count;
    });

    return NextResponse.json({
      success: true,
      data: {
        tickets,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        },
        stats: statusStats,
        filters: {
          status,
          category,
          priority
        }
      }
    });

  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/vendors/support - Create new support ticket
export async function POST(request) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;
    const body = await request.json();

    const {
      title,
      description,
      category,
      priority = 'medium',
      relatedLead,
      relatedSubscription,
      tags = [],
      metadata = {}
    } = body;

    // Validation
    if (!title || !description || !category) {
      return NextResponse.json({
        success: false,
        error: 'Title, description, and category are required'
      }, { status: 400 });
    }

    // Validate category
    const validCategories = [
      'technical_issue', 'billing_support', 'account_access',
      'lead_management', 'subscription_issue', 'profile_verification',
      'payment_issue', 'feature_request', 'general_inquiry', 'urgent_support'
    ];

    if (!validCategories.includes(category)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid category'
      }, { status: 400 });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid priority'
      }, { status: 400 });
    }

    await connectDB();

    // Get database collections for user role lookup
    const usersCollection = await database.getUsersCollection();
    const rolesCollection = await database.getRolesCollection();

    // Get user role
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const role = await rolesCollection.findOne({ _id: user.role });
    const userRole = role ? role.name : 'vendor';

    // Create ticket data
    const ticketData = {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      createdBy: new ObjectId(userId),
      createdByType: userRole,
      vendorId: new ObjectId(vendorId),
      tags: tags.filter(tag => tag && tag.trim()),
      metadata: {
        ...metadata,
        source: 'mobile_app',
        userAgent: request.headers.get('user-agent') || '',
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
      }
    };

    // Add related data if provided
    if (relatedLead) {
      ticketData.relatedLead = new ObjectId(relatedLead);
    }
    if (relatedSubscription) {
      ticketData.relatedSubscription = new ObjectId(relatedSubscription);
    }

    // Create the ticket
    const ticket = new SupportTicket(ticketData);
    
    // Add initial message from description
    ticket.addMessage({
      content: description.trim(),
      sender: new ObjectId(userId),
      senderType: userRole,
      messageType: 'text'
    });

    await ticket.save();

    // Populate the created ticket
    await ticket.populate('createdBy', 'name email');

    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully',
      data: {
        ticket: {
          _id: ticket._id,
          ticketId: ticket.ticketId,
          title: ticket.title,
          description: ticket.description,
          category: ticket.category,
          priority: ticket.priority,
          status: ticket.status,
          createdAt: ticket.createdAt,
          lastActivity: ticket.lastActivity,
          messageCount: ticket.messageCount,
          unreadCount: ticket.unreadCount,
          isOverdue: ticket.isOverdue,
          sla: ticket.sla,
          createdBy: ticket.createdBy
        }
      }
    });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 