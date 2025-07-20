import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/dal';
import SupportTicket from '@/lib/models/supportTicket';
import Vendor from '@/lib/models/vendor';
import User from '@/lib/models/user';
import Lead from '@/lib/models/lead';
import Subscription from '@/lib/models/subscription';
import Notification from '@/lib/models/notification';
import NotificationRecipient from '@/lib/models/notificationRecipient';
import admin from '@/lib/firebase/admin';
import connectDB from '@/lib/connnectDB';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

// Function to send support ticket notification
async function sendSupportNotification(recipientUser, notificationData, adminUserId) {
  try {
    console.log(`Sending support notification to user: ${recipientUser.name}`);

    // Create the notification document
    const notification = new Notification({
      title: notificationData.title,
      message: notificationData.message,
      messageType: notificationData.messageType || 'Info',
      createdBy: adminUserId,
      target: notificationData.target || 'vendor',
    });
    await notification.save();

    // Create notification recipient record
    const recipientDoc = new NotificationRecipient({
      notificationId: notification._id,
      userId: recipientUser._id,
      userType: notificationData.target || 'vendor',
      deliveryStatus: recipientUser.fcmToken ? 'pending' : 'failed',
      deliveryAttempts: 0,
    });
    await recipientDoc.save();

    // Send FCM notification if user has a token
    if (recipientUser.fcmToken && recipientUser.fcmToken.trim() !== '') {
      try {
        const fcmMessage = {
          notification: {
            title: notificationData.title,
            body: notificationData.message,
          },
          data: {
            type: notificationData.type || 'support_ticket',
            ticketId: notificationData.ticketId || '',
            notificationId: notification._id.toString(),
            ...notificationData.data
          },
          token: recipientUser.fcmToken,
        };

        const sendResult = await admin.messaging().send(fcmMessage);
        console.log(`FCM support notification sent to user ${recipientUser.name}:`, sendResult);

        // Update delivery status to delivered
        await NotificationRecipient.findByIdAndUpdate(recipientDoc._id, {
          deliveryStatus: 'delivered',
          deliveryAttempts: 1,
        });

        return {
          sent: true,
          notificationId: notification._id,
          fcmResult: sendResult
        };

      } catch (fcmError) {
        console.error(`Failed to send FCM to user ${recipientUser.name}:`, fcmError.message);

        // Update delivery status to failed
        await NotificationRecipient.findByIdAndUpdate(recipientDoc._id, {
          deliveryStatus: 'failed',
          deliveryAttempts: 1,
        });

        // Remove invalid FCM token if it's a token error
        if (fcmError.code === 'messaging/invalid-registration-token' || 
            fcmError.code === 'messaging/registration-token-not-registered') {
          await User.findByIdAndUpdate(recipientUser._id, { fcmToken: null });
          console.log(`Removed invalid FCM token for user: ${recipientUser.name}`);
        }

        return {
          sent: false,
          notificationId: notification._id,
          error: fcmError.message
        };
      }
    } else {
      console.log(`No FCM token for user ${recipientUser.name}, notification saved to database only`);
      return {
        sent: false,
        notificationId: notification._id,
        reason: 'No FCM token'
      };
    }

  } catch (error) {
    console.error('Error sending support notification:', error);
    return {
      sent: false,
      error: error.message
    };
  }
}

// GET /api/admin/support - Get all support tickets for admin
export async function GET(request) {
  try {
    const { user, role } = await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(request.url);

    // Query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'lastActivity';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query = {};

    // Role-based filtering: Only admins see all tickets, others see only assigned tickets
    if (role.name !== 'admin') {
      query.assignedTo = new ObjectId(user.id);
    }

    if (status && status !== 'all') {
      query.status = status;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    if (assignedTo && assignedTo !== 'all') {
      query.assignedTo = new ObjectId(assignedTo);
    }

    // Search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { ticketId: searchRegex },
        { 'messages.content': searchRegex }
      ];
    }

    // Count total documents
    const total = await SupportTicket.countDocuments(query);

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get tickets with pagination and population
    const tickets = await SupportTicket.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate({
        path: 'vendorId',
        select: 'businessName services address status',
        populate: {
          path: 'user',
          select: 'name email phone'
        },
        options: { 
          lean: true,
          strictPopulate: false // Allow null values if vendor doesn't exist
        }
      })
      .populate('relatedLead', 'customerName service')
      .populate('relatedSubscription', 'planSnapshot.planName')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Debug log to check vendor population
    if (tickets.length > 0) {
      console.log('First ticket vendor data:', {
        vendorId: tickets[0]?.vendorId,
        hasVendor: !!tickets[0]?.vendorId,
        vendorType: typeof tickets[0]?.vendorId
      });
    }

    // Get summary statistics with role-based filtering
    const statsMatchQuery = {};
    if (role.name !== 'admin') {
      statsMatchQuery.assignedTo = new ObjectId(user.id);
    }

    const stats = await SupportTicket.aggregate([
      { $match: statsMatchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$sla.responseTime' }
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

    // Get priority breakdown with role-based filtering
    const priorityStats = await SupportTicket.aggregate([
      { $match: statsMatchQuery },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityBreakdown = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    };

    priorityStats.forEach(stat => {
      priorityBreakdown[stat._id] = stat.count;
    });

    // Get overdue tickets count
    const overdueCount = await SupportTicket.countDocuments({
      status: { $nin: ['resolved', 'closed'] },
      $expr: {
        $gt: [
          { $subtract: [new Date(), '$createdAt'] },
          { $multiply: ['$sla.responseTime', 60000] } // Convert minutes to milliseconds
        ]
      }
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
        stats: {
          statusBreakdown: statusStats,
          priorityBreakdown,
          totalTickets: total,
          overdueTickets: overdueCount
        },
        filters: {
          status,
          category,
          priority,
          assignedTo,
          search,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Error fetching admin support tickets:', error);

    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch support tickets',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/support - Create support ticket on behalf of vendor (admin only)
export async function POST(request) {
  try {
    await requireAdmin();
    await connectDB();

    const body = await request.json();
    console.log('Received request body:', JSON.stringify(body, null, 2)); // Debug log
    
    const {
      title,
      description,
      category,
      priority = 'medium',
      vendorId,
      assignedTo,
      tags = [],
      relatedLead,
      relatedSubscription
    } = body;
    
    console.log('Extracted category:', category); // Debug log

    // Validation
    if (!title || !description || !category || !vendorId) {
      return NextResponse.json({
        success: false,
        error: 'Title, description, category, and vendor ID are required'
      }, { status: 400 });
    }

    // Validate ObjectIds
    if (!ObjectId.isValid(vendorId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid vendor ID'
      }, { status: 400 });
    }

    if (assignedTo && !ObjectId.isValid(assignedTo)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid assigned user ID'
      }, { status: 400 });
    }

    // Get admin user info
    const adminData = await requireAdmin();
    const adminUserId = adminData.user._id;
    const adminRole = adminData.role;
    
    // Extract role name - handle both string and object formats
    const roleName = typeof adminRole === 'object' ? adminRole.name : adminRole;

    // Generate ticket ID manually to ensure it's set
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const ticketId = `TKT${timestamp}${random}`;

    // Create ticket data
    const ticketData = {
      ticketId, // Manually set ticketId to ensure it's required
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      createdBy: new ObjectId(adminUserId),
      createdByType: roleName, // Use role name string, not object
      vendorId: new ObjectId(vendorId),
      tags: tags.filter(tag => tag && tag.trim()),
      metadata: {
        source: 'admin_panel',
        userAgent: request.headers.get('user-agent') || '',
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
      }
    };

    // Add assignment if provided
    if (assignedTo) {
      ticketData.assignedTo = new ObjectId(assignedTo);
      // We'll get the assignee's role when we fetch the user
    }

    // Add related data if provided
    if (relatedLead) {
      ticketData.relatedLead = new ObjectId(relatedLead);
    }
    if (relatedSubscription) {
      ticketData.relatedSubscription = new ObjectId(relatedSubscription);
    }

    // Create the ticket
    const ticket = new SupportTicket(ticketData);

    // Add initial message
    ticket.addMessage({
      content: `Ticket created by admin: ${description.trim()}`,
      sender: new ObjectId(adminUserId),
      senderType: roleName, // Use role name string, not object
      messageType: 'text'
    });

    await ticket.save();
    console.log('Ticket saved successfully. ID:', ticket._id, 'TicketID:', ticket.ticketId); // Debug log

    // If assigned, get assignee role
    if (assignedTo) {
      // You would fetch assignee role here and update ticket.assignedToType
      // For now, leaving it null as it will be set when messages are added
    }

    // Populate the created ticket
    await ticket.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'assignedTo', select: 'name email' },
      { path: 'vendorId', select: 'businessName user', populate: { path: 'user', select: 'name email fcmToken' } }
    ]);

    console.log('Populated ticket data:', {
      _id: ticket._id,
      ticketId: ticket.ticketId,
      title: ticket.title,
      createdBy: ticket.createdBy,
      vendorId: ticket.vendorId
    }); // Debug log

    // Send notification to vendor about new ticket
    let notificationResult = null;
    if (ticket.vendorId && ticket.vendorId.user) {
      try {
        const notificationData = {
          title: 'New Support Ticket Created',
          message: `A new support ticket "${ticket.title}" has been created for your account. Ticket ID: ${ticket.ticketId}`,
          messageType: 'Info',
          type: 'support_ticket_created',
          target: 'vendor',
          ticketId: ticket.ticketId,
          data: {
            category: ticket.category,
            priority: ticket.priority
          }
        };

        // Convert adminUserId to mongoose ObjectId
        const mongooseAdminId = new mongoose.Types.ObjectId(adminUserId);
        
        notificationResult = await sendSupportNotification(
          ticket.vendorId.user,
          notificationData,
          mongooseAdminId
        );
      } catch (notificationError) {
        console.error('Failed to send ticket creation notification:', notificationError);
        // Don't fail ticket creation if notification fails
      }
    }

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
          createdBy: ticket.createdBy,
          createdByType: ticket.createdByType,
          vendorId: ticket.vendorId,
          assignedTo: ticket.assignedTo,
          tags: ticket.tags,
          createdAt: ticket.createdAt,
          lastActivity: ticket.lastActivity
        },
        notification: notificationResult ? {
          sent: notificationResult.sent,
          notificationId: notificationResult.notificationId,
          error: notificationResult.error || null,
          reason: notificationResult.reason || null
        } : null
      }
    });

  } catch (error) {
    console.error('Error creating admin support ticket:', error);

    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create support ticket',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/support - Bulk update support tickets
export async function PUT(request) {
  try {
    await requireAdmin();
    await connectDB();

    const body = await request.json();
    const {
      ticketIds,
      action,
      assignedTo,
      status,
      priority,
      tags
    } = body;

    // Validation
    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Ticket IDs array is required'
      }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Action is required'
      }, { status: 400 });
    }

    // Validate ObjectIds
    const validTicketIds = ticketIds.filter(id => ObjectId.isValid(id));
    if (validTicketIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid ticket IDs provided'
      }, { status: 400 });
    }

    const adminData = await requireAdmin();
    const adminUserId = adminData.user._id;
    const adminRole = adminData.role;

    let updateData = {};
    let resultMessage = '';

    switch (action) {
      case 'assign':
        if (!assignedTo || !ObjectId.isValid(assignedTo)) {
          return NextResponse.json({
            success: false,
            error: 'Valid assigned user ID is required for assignment'
          }, { status: 400 });
        }
        updateData = {
          assignedTo: new ObjectId(assignedTo),
          lastActivity: new Date()
        };
        resultMessage = `${validTicketIds.length} ticket(s) assigned successfully`;
        break;

      case 'update_status':
        if (!status) {
          return NextResponse.json({
            success: false,
            error: 'Status is required for status update'
          }, { status: 400 });
        }
        updateData = {
          status,
          lastActivity: new Date()
        };
        resultMessage = `${validTicketIds.length} ticket(s) status updated to ${status}`;
        break;

      case 'update_priority':
        if (!priority) {
          return NextResponse.json({
            success: false,
            error: 'Priority is required for priority update'
          }, { status: 400 });
        }
        updateData = {
          priority,
          lastActivity: new Date()
        };
        resultMessage = `${validTicketIds.length} ticket(s) priority updated to ${priority}`;
        break;

      case 'add_tags':
        if (!tags || !Array.isArray(tags)) {
          return NextResponse.json({
            success: false,
            error: 'Tags array is required for tag addition'
          }, { status: 400 });
        }
        updateData = {
          $addToSet: { tags: { $each: tags.filter(tag => tag && tag.trim()) } },
          lastActivity: new Date()
        };
        resultMessage = `Tags added to ${validTicketIds.length} ticket(s)`;
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

    // Perform bulk update
    const result = await SupportTicket.updateMany(
      { _id: { $in: validTicketIds.map(id => new ObjectId(id)) } },
      updateData
    );

    return NextResponse.json({
      success: true,
      message: resultMessage,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      }
    });

  } catch (error) {
    console.error('Error bulk updating support tickets:', error);

    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update support tickets',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 