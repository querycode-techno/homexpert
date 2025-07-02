import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/dal';
import { database } from '@/lib/db';
import SupportTicket from '@/lib/models/supportTicket';
import connectDB from '@/lib/connnectDB';
import { ObjectId } from 'mongodb';

// GET /api/admin/support/[id] - Get specific support ticket with full details
export async function GET(request, { params }) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = params;

    // Validate ticket ID format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid ticket ID'
      }, { status: 400 });
    }

    // Get ticket with full details and populated references
    const ticket = await SupportTicket.findById(new ObjectId(id))
      .populate('createdBy', 'name email profileImage type')
      .populate('assignedTo', 'name email profileImage type')
      .populate('vendorId', 'businessName services address verified status')
      .populate('messages.sender', 'name email profileImage type')
      .populate('relatedLead', 'customerName customerPhone service selectedService address status')
      .populate('relatedSubscription', 'planSnapshot status startDate endDate')
      .populate('escalation.escalatedBy', 'name email')
      .populate('satisfaction.ratedBy', 'name email')
      .lean();

    if (!ticket) {
      return NextResponse.json({
        success: false,
        error: 'Support ticket not found'
      }, { status: 404 });
    }

    // Get additional context - vendor's other tickets
    const vendorOtherTickets = await SupportTicket.find({
      vendorId: ticket.vendorId,
      _id: { $ne: new ObjectId(id) }
    })
    .select('ticketId title status priority createdAt')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

    // Get related tickets if any
    const relatedTickets = ticket.relatedTickets.length > 0 
      ? await SupportTicket.find({
          _id: { $in: ticket.relatedTickets }
        })
        .select('ticketId title status priority createdAt')
        .lean()
      : [];

    return NextResponse.json({
      success: true,
      data: {
        ticket,
        context: {
          vendorOtherTickets,
          relatedTickets
        }
      }
    });

  } catch (error) {
    console.error('Error fetching admin support ticket:', error);

    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch support ticket',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/support/[id] - Add message to ticket (admin)
export async function POST(request, { params }) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = params;
    const body = await request.json();

    const {
      content,
      messageType = 'text',
      attachments = [],
      isInternal = false
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

    // Get admin user info
    const adminData = await requireAdmin();
    const adminUserId = adminData.user._id;
    const adminRole = adminData.role;

    // Find the ticket
    const ticket = await SupportTicket.findById(new ObjectId(id));

    if (!ticket) {
      return NextResponse.json({
        success: false,
        error: 'Support ticket not found'
      }, { status: 404 });
    }

    // Check if ticket is closed (admins can add messages to closed tickets)
    // if (ticket.status === 'closed') {
    //   return NextResponse.json({
    //     success: false,
    //     error: 'Cannot add messages to a closed ticket'
    //   }, { status: 400 });
    // }

    // Prepare message data
    const messageData = {
      content: content.trim(),
      sender: new ObjectId(adminUserId),
      senderType: adminRole.name,
      messageType,
      attachments: attachments.filter(att => att.url && att.filename),
      isInternal
    };

    // Add message to ticket
    const newMessage = ticket.addMessage(messageData);

    // Update ticket status based on message
    if (!isInternal) {
      if (ticket.status === 'open') {
        ticket.status = 'in_progress';
      } else if (ticket.status === 'waiting_for_admin') {
        ticket.status = 'waiting_for_vendor';
      }
    }

    // Save the ticket
    await ticket.save();

    // Populate the sender for response
    await ticket.populate('messages.sender', 'name email profileImage type');

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
    console.error('Error adding admin message to ticket:', error);

    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add message to ticket',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/support/[id] - Update ticket (admin actions)
export async function PUT(request, { params }) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = params;
    const body = await request.json();

    const {
      action,
      assignedTo,
      status,
      priority,
      tags,
      escalationReason,
      escalationLevel,
      resolutionNote,
      closingNote,
      relatedTickets
    } = body;

    // Validate ticket ID format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid ticket ID'
      }, { status: 400 });
    }

    // Get admin user info
    const adminData = await requireAdmin();
    const adminUserId = adminData.user._id;
    const adminRole = adminData.role;

    // Find the ticket
    const ticket = await SupportTicket.findById(new ObjectId(id));

    if (!ticket) {
      return NextResponse.json({
        success: false,
        error: 'Support ticket not found'
      }, { status: 404 });
    }

    let message = '';

    switch (action) {
      case 'assign':
        if (!assignedTo || !ObjectId.isValid(assignedTo)) {
          return NextResponse.json({
            success: false,
            error: 'Valid assigned user ID is required'
          }, { status: 400 });
        }

        // Get assignee role
        const usersCollection = await database.getUsersCollection();
        const rolesCollection = await database.getRolesCollection();
        
        const assigneeUser = await usersCollection.findOne({ _id: new ObjectId(assignedTo) });
        if (!assigneeUser) {
          return NextResponse.json({
            success: false,
            error: 'Assigned user not found'
          }, { status: 404 });
        }

        const assigneeRole = await rolesCollection.findOne({ _id: assigneeUser.role });
        
        ticket.assignedTo = new ObjectId(assignedTo);
        ticket.assignedToType = assigneeRole ? assigneeRole.name : 'admin';
        ticket.lastActivity = new Date();

        // Add system message
        ticket.addMessage({
          content: `Ticket assigned to ${assigneeUser.name}`,
          sender: new ObjectId(adminUserId),
          senderType: 'system',
          messageType: 'system_notification'
        });

        message = 'Ticket assigned successfully';
        break;

      case 'update_status':
        if (!status) {
          return NextResponse.json({
            success: false,
            error: 'Status is required'
          }, { status: 400 });
        }

        const oldStatus = ticket.status;
        ticket.status = status;
        ticket.lastActivity = new Date();

        // Add system message
        ticket.addMessage({
          content: `Status changed from ${oldStatus} to ${status}`,
          sender: new ObjectId(adminUserId),
          senderType: 'system',
          messageType: 'system_notification'
        });

        message = `Ticket status updated to ${status}`;
        break;

      case 'update_priority':
        if (!priority) {
          return NextResponse.json({
            success: false,
            error: 'Priority is required'
          }, { status: 400 });
        }

        const oldPriority = ticket.priority;
        ticket.priority = priority;
        ticket.lastActivity = new Date();

        // Add system message
        ticket.addMessage({
          content: `Priority changed from ${oldPriority} to ${priority}`,
          sender: new ObjectId(adminUserId),
          senderType: 'system',
          messageType: 'system_notification'
        });

        message = `Ticket priority updated to ${priority}`;
        break;

      case 'escalate':
        if (!escalationReason) {
          return NextResponse.json({
            success: false,
            error: 'Escalation reason is required'
          }, { status: 400 });
        }

        ticket.escalate(
          new ObjectId(adminUserId),
          escalationReason,
          escalationLevel || 'level_2'
        );

        message = 'Ticket escalated successfully';
        break;

      case 'resolve':
        ticket.resolve(
          new ObjectId(adminUserId),
          resolutionNote,
          adminRole.name
        );

        message = 'Ticket resolved successfully';
        break;

      case 'close':
        ticket.close(
          new ObjectId(adminUserId),
          closingNote,
          adminRole.name
        );

        message = 'Ticket closed successfully';
        break;

      case 'reopen':
        if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
          return NextResponse.json({
            success: false,
            error: 'Can only reopen resolved or closed tickets'
          }, { status: 400 });
        }

        ticket.status = 'open';
        ticket.lastActivity = new Date();

        // Add system message
        ticket.addMessage({
          content: 'Ticket reopened by admin',
          sender: new ObjectId(adminUserId),
          senderType: 'system',
          messageType: 'system_notification'
        });

        message = 'Ticket reopened successfully';
        break;

      case 'update_tags':
        if (!tags || !Array.isArray(tags)) {
          return NextResponse.json({
            success: false,
            error: 'Tags array is required'
          }, { status: 400 });
        }

        ticket.tags = tags.filter(tag => tag && tag.trim());
        ticket.lastActivity = new Date();
        message = 'Tags updated successfully';
        break;

      case 'link_tickets':
        if (!relatedTickets || !Array.isArray(relatedTickets)) {
          return NextResponse.json({
            success: false,
            error: 'Related tickets array is required'
          }, { status: 400 });
        }

        const validRelatedIds = relatedTickets.filter(tId => ObjectId.isValid(tId));
        ticket.relatedTickets = validRelatedIds.map(tId => new ObjectId(tId));
        ticket.lastActivity = new Date();

        // Add system message
        ticket.addMessage({
          content: `Linked to ${validRelatedIds.length} related ticket(s)`,
          sender: new ObjectId(adminUserId),
          senderType: 'system',
          messageType: 'system_notification'
        });

        message = 'Related tickets linked successfully';
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

    // Save the ticket
    await ticket.save();

    return NextResponse.json({
      success: true,
      message,
      data: {
        ticket: {
          _id: ticket._id,
          ticketId: ticket.ticketId,
          status: ticket.status,
          priority: ticket.priority,
          assignedTo: ticket.assignedTo,
          assignedToType: ticket.assignedToType,
          escalation: ticket.escalation,
          tags: ticket.tags,
          relatedTickets: ticket.relatedTickets,
          lastActivity: ticket.lastActivity,
          sla: ticket.sla
        }
      }
    });

  } catch (error) {
    console.error('Error updating admin support ticket:', error);

    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update support ticket',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/support/[id] - Delete support ticket (admin only)
export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = params;

    // Validate ticket ID format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid ticket ID'
      }, { status: 400 });
    }

    // Find and delete the ticket
    const deletedTicket = await SupportTicket.findByIdAndDelete(new ObjectId(id));

    if (!deletedTicket) {
      return NextResponse.json({
        success: false,
        error: 'Support ticket not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Support ticket deleted successfully',
      data: {
        deletedTicketId: deletedTicket._id,
        ticketId: deletedTicket.ticketId
      }
    });

  } catch (error) {
    console.error('Error deleting admin support ticket:', error);

    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete support ticket',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 