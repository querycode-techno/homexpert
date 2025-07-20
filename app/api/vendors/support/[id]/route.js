import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import SupportTicket from '@/lib/models/supportTicket';
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
async function sendSupportNotification(recipientUser, notificationData, senderUserId) {
  try {
    console.log(`Sending support notification to user: ${recipientUser.name}`);

    // Create the notification document
    const notification = new Notification({
      title: notificationData.title,
      message: notificationData.message,
      messageType: notificationData.messageType || 'Info',
      createdBy: senderUserId,
      target: notificationData.target || 'admin',
    });
    await notification.save();

    // Create notification recipient record
    const recipientDoc = new NotificationRecipient({
      notificationId: notification._id,
      userId: recipientUser._id,
      userType: notificationData.target || 'admin',
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

    // Populate the sender for response and get assigned user info
    await ticket.populate([
      { path: 'messages.sender', select: 'name email profileImage' },
      { path: 'assignedTo', select: 'name email fcmToken' }
    ]);

    // Find the newly added message
    const addedMessage = ticket.messages.find(msg => msg.messageId === newMessage.messageId);

    // Send notification to assigned user about vendor reply
    let notificationResult = null;
    if (ticket.assignedTo) {
      try {
        const notificationData = {
          title: 'New Reply from Vendor',
          message: `Vendor has replied to support ticket "${ticket.title}". Ticket ID: ${ticket.ticketId}`,
          messageType: 'Info',
          type: 'support_ticket_vendor_reply',
          target: 'helpline',
          ticketId: ticket.ticketId,
          data: {
            messageContent: content.trim().substring(0, 100) + (content.trim().length > 100 ? '...' : ''),
            senderName: user.name || 'Vendor'
          }
        };

        // Convert userId to mongoose ObjectId
        const mongooseUserId = new mongoose.Types.ObjectId(userId);
        
        notificationResult = await sendSupportNotification(
          ticket.assignedTo,
          notificationData,
          mongooseUserId
        );
      } catch (notificationError) {
        console.error('Failed to send vendor reply notification:', notificationError);
        // Don't fail message sending if notification fails
      }
    }

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