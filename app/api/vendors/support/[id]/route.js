import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import SupportTicket from '@/lib/models/supportTicket';
import connectDB from '@/lib/connnectDB';
import { ObjectId } from 'mongodb';

// GET /api/vendors/support/[id] - Get specific support ticket with messages
export async function GET(request, { params }) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;
    const { id } = params;

    // Validate ticket ID format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid ticket ID'
      }, { status: 400 });
    }

    await connectDB();

    // Get ticket with full details
    const ticket = await SupportTicket.findOne({
      _id: new ObjectId(id),
      vendorId: new ObjectId(vendorId) // Ensure vendor can only access their tickets
    })
    .populate('createdBy', 'name email profileImage')
    .populate('assignedTo', 'name email profileImage')
    .populate('messages.sender', 'name email profileImage')
    .populate('relatedLead', 'customerName service selectedService')
    .populate('relatedSubscription', 'planSnapshot.planName')
    .lean();

    if (!ticket) {
      return NextResponse.json({
        success: false,
        error: 'Ticket not found'
      }, { status: 404 });
    }

    // Mark messages as read for this vendor
    await SupportTicket.findByIdAndUpdate(
      new ObjectId(id),
      {
        $set: {
          'unreadCount.vendor': 0,
          lastActivity: new Date()
        },
        $push: {
          'messages.$[].readBy': {
            user: new ObjectId(userId),
            readAt: new Date()
          }
        }
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        ticket
      }
    });

  } catch (error) {
    console.error('Error fetching support ticket:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/vendors/support/[id] - Add message to ticket
export async function POST(request, { params }) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;
    const { id } = params;
    const body = await request.json();

    const {
      content,
      messageType = 'text',
      attachments = []
    } = body;

    // Validation
    if (!content || content.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Message content is required'
      }, { status: 400 });
    }

    if (content.trim().length > 5000) {
      return NextResponse.json({
        success: false,
        error: 'Message content too long (max 5000 characters)'
      }, { status: 400 });
    }

    // Validate ticket ID format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid ticket ID'
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

    // Find the ticket
    const ticket = await SupportTicket.findOne({
      _id: new ObjectId(id),
      vendorId: new ObjectId(vendorId)
    });

    if (!ticket) {
      return NextResponse.json({
        success: false,
        error: 'Ticket not found'
      }, { status: 404 });
    }

    // Check if ticket is closed
    if (ticket.status === 'closed') {
      return NextResponse.json({
        success: false,
        error: 'Cannot add messages to a closed ticket'
      }, { status: 400 });
    }

    // Prepare message data
    const messageData = {
      content: content.trim(),
      sender: new ObjectId(userId),
      senderType: userRole,
      messageType,
      attachments: attachments.filter(att => att.url && att.filename)
    };

    // Add message to ticket
    const newMessage = ticket.addMessage(messageData);

    // Update ticket status if it was waiting for vendor
    if (ticket.status === 'waiting_for_vendor') {
      ticket.status = 'waiting_for_admin';
    }

    // Save the ticket
    await ticket.save();

    // Populate the sender for response
    await ticket.populate('messages.sender', 'name email profileImage');

    // Find the newly added message
    const addedMessage = ticket.messages.find(msg => msg.messageId === newMessage.messageId);

    return NextResponse.json({
      success: true,
      message: 'Message added successfully',
      data: {
        message: addedMessage,
        ticket: {
          _id: ticket._id,
          ticketId: ticket.ticketId,
          status: ticket.status,
          lastActivity: ticket.lastActivity,
          unreadCount: ticket.unreadCount,
          messageCount: ticket.messageCount
        }
      }
    });

  } catch (error) {
    console.error('Error adding message to ticket:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/vendors/support/[id] - Update ticket (limited actions for vendors)
export async function PUT(request, { params }) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;
    const { id } = params;
    const body = await request.json();

    const {
      action,
      satisfactionRating,
      satisfactionFeedback
    } = body;

    // Validate ticket ID format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid ticket ID'
      }, { status: 400 });
    }

    await connectDB();

    // Find the ticket
    const ticket = await SupportTicket.findOne({
      _id: new ObjectId(id),
      vendorId: new ObjectId(vendorId)
    });

    if (!ticket) {
      return NextResponse.json({
        success: false,
        error: 'Ticket not found'
      }, { status: 404 });
    }

    let updateData = {};
    let message = '';

    switch (action) {
      case 'mark_resolved':
        if (ticket.status !== 'resolved') {
          return NextResponse.json({
            success: false,
            error: 'Only resolved tickets can be marked as resolved by vendors'
          }, { status: 400 });
        }
        break;

      case 'rate_satisfaction':
        if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
          return NextResponse.json({
            success: false,
            error: 'Can only rate resolved or closed tickets'
          }, { status: 400 });
        }

        if (!satisfactionRating || satisfactionRating < 1 || satisfactionRating > 5) {
          return NextResponse.json({
            success: false,
            error: 'Satisfaction rating must be between 1 and 5'
          }, { status: 400 });
        }

        updateData = {
          'satisfaction.rating': satisfactionRating,
          'satisfaction.feedback': satisfactionFeedback || '',
          'satisfaction.ratedAt': new Date(),
          'satisfaction.ratedBy': new ObjectId(userId)
        };
        message = 'Satisfaction rating submitted successfully';
        break;

      case 'reopen':
        if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
          return NextResponse.json({
            success: false,
            error: 'Can only reopen resolved or closed tickets'
          }, { status: 400 });
        }

        updateData = {
          status: 'open',
          lastActivity: new Date()
        };

        // Add system message
        ticket.addMessage({
          content: 'Ticket reopened by vendor',
          sender: new ObjectId(userId),
          senderType: 'system',
          messageType: 'system_notification'
        });

        message = 'Ticket reopened successfully';
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

    // Update the ticket
    if (Object.keys(updateData).length > 0) {
      Object.assign(ticket, updateData);
    }

    await ticket.save();

    return NextResponse.json({
      success: true,
      message,
      data: {
        ticket: {
          _id: ticket._id,
          ticketId: ticket.ticketId,
          status: ticket.status,
          satisfaction: ticket.satisfaction,
          lastActivity: ticket.lastActivity
        }
      }
    });

  } catch (error) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 