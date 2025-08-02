import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { requireAdmin } from '@/lib/dal';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import Notification from '@/lib/models/notification';
import NotificationRecipient from '@/lib/models/notificationRecipient';
import User from '@/lib/models/user';
import admin from '@/lib/firebase/admin';

// Connect to MongoDB for Mongoose models
async function connectDB() {
  if (mongoose.connections[0].readyState) {
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Function to send lead adjustment notification to vendor
async function sendLeadAdjustmentNotification(vendorUser, subscriptionData, adjustmentData, adminUserId) {
  try {
    console.log(`Sending lead adjustment notification to vendor: ${vendorUser.name}`);

    const action = adjustmentData.type === 'increase' ? 'increased' : 'decreased';
    const title = `Leads ${action.charAt(0).toUpperCase() + action.slice(1)}`;
    const message = `Your subscription leads have been ${action} by ${adjustmentData.amount}. Reason: ${adjustmentData.reason}`;

    // Create the notification document
    const notification = new Notification({
      title,
      message,
      messageType: adjustmentData.type === 'increase' ? 'Success' : 'Info',
      createdBy: adminUserId,
      target: 'vendor',
    });
    await notification.save();

    // Create notification recipient record
    const recipientDoc = new NotificationRecipient({
      notificationId: notification._id,
      userId: vendorUser._id,
      userType: 'vendor',
      deliveryStatus: vendorUser.fcmToken ? 'pending' : 'failed',
      deliveryAttempts: 0,
    });
    await recipientDoc.save();

    // Send FCM notification if vendor has a token
    if (vendorUser.fcmToken && vendorUser.fcmToken.trim() !== '') {
      try {
        const fcmMessage = {
          notification: {
            title,
            body: message,
          },
          data: {
            type: 'lead_adjustment',
            adjustmentType: adjustmentData.type,
            amount: adjustmentData.amount.toString(),
            reason: adjustmentData.reason,
            notificationId: notification._id.toString(),
          },
          token: vendorUser.fcmToken,
        };

        const sendResult = await admin.messaging().send(fcmMessage);
        console.log(`FCM lead adjustment notification sent to vendor ${vendorUser.name}:`, sendResult);

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
        console.error(`Failed to send FCM to vendor ${vendorUser.name}:`, fcmError.message);

        // Update delivery status to failed
        await NotificationRecipient.findByIdAndUpdate(recipientDoc._id, {
          deliveryStatus: 'failed',
          deliveryAttempts: 1,
        });

        // Remove invalid FCM token if it's a token error
        if (fcmError.code === 'messaging/invalid-registration-token' || 
            fcmError.code === 'messaging/registration-token-not-registered') {
          await User.findByIdAndUpdate(vendorUser._id, { fcmToken: null });
          console.log(`Removed invalid FCM token for vendor: ${vendorUser.name}`);
        }

        return {
          sent: false,
          notificationId: notification._id,
          error: fcmError.message
        };
      }
    }

    return {
      sent: false,
      notificationId: notification._id,
      error: 'No FCM token available'
    };

  } catch (error) {
    console.error('Error sending lead adjustment notification:', error);
    return {
      sent: false,
      error: error.message
    };
  }
}

export async function PATCH(request) {
  try {
    // Require admin authentication
    const adminUser = await requireAdmin();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to MongoDB
    await connectDB();

    const body = await request.json();
    const { subscriptionId, type, amount, reason } = body;

    // Validate required fields
    if (!subscriptionId || !type || !amount || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: subscriptionId, type, amount, reason' },
        { status: 400 }
      );
    }

    // Validate ObjectId
    if (!ObjectId.isValid(subscriptionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription ID' },
        { status: 400 }
      );
    }

    // Validate adjustment type
    if (!['increase', 'decrease'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid adjustment type. Must be "increase" or "decrease"' },
        { status: 400 }
      );
    }

    // Validate amount
    const adjustmentAmount = parseInt(amount);
    if (isNaN(adjustmentAmount) || adjustmentAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Get subscription history collection
    const subscriptionHistoryCollection = await database.getSubscriptionHistoryCollection();

    // Find the subscription
    const subscription = await subscriptionHistoryCollection.findOne({
      _id: new ObjectId(subscriptionId)
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Check if subscription is active
    if (subscription.status !== 'active' || !subscription.isActive) {
      return NextResponse.json(
        { success: false, error: 'Can only adjust leads for active subscriptions' },
        { status: 400 }
      );
    }

    // Calculate new values
    const currentLeadsConsumed = subscription.usage?.leadsConsumed || 0;
    const currentLeadsRemaining = subscription.usage?.leadsRemaining || 0;
    const totalOriginalLeads = subscription.planSnapshot?.totalLeads || 0;

    let newLeadsConsumed, newLeadsRemaining;

    if (type === 'increase') {
      // For increase: reduce consumed leads (add to remaining)
      newLeadsConsumed = Math.max(0, currentLeadsConsumed - adjustmentAmount);
      newLeadsRemaining = currentLeadsRemaining + adjustmentAmount;
    } else {
      // For decrease: increase consumed leads (reduce remaining)
      newLeadsConsumed = currentLeadsConsumed + adjustmentAmount;
      newLeadsRemaining = Math.max(0, currentLeadsRemaining - adjustmentAmount);
    }

    // Validate that we don't exceed original plan limits
    if (newLeadsConsumed + newLeadsRemaining > totalOriginalLeads) {
      return NextResponse.json(
        { success: false, error: `Adjustment would exceed original plan limit of ${totalOriginalLeads} leads` },
        { status: 400 }
      );
    }

    // Update subscription with new lead counts
    const updateResult = await subscriptionHistoryCollection.updateOne(
      { _id: new ObjectId(subscriptionId) },
      {
        $set: {
          'usage.leadsConsumed': newLeadsConsumed,
          'usage.leadsRemaining': newLeadsRemaining,
          'usage.lastLeadConsumedAt': new Date(),
          updatedAt: new Date()
        },
        $push: {
          history: {
            action: type === 'increase' ? 'leads_increased' : 'leads_decreased',
            date: new Date(),
            performedBy: new ObjectId(adminUser._id),
            reason: reason,
            previousStatus: `${currentLeadsConsumed} consumed, ${currentLeadsRemaining} remaining`,
            newStatus: `${newLeadsConsumed} consumed, ${newLeadsRemaining} remaining`,
            metadata: {
              adjustmentType: type,
              adjustmentAmount: adjustmentAmount,
              previousLeadsConsumed: currentLeadsConsumed,
              previousLeadsRemaining: currentLeadsRemaining,
              newLeadsConsumed: newLeadsConsumed,
              newLeadsRemaining: newLeadsRemaining
            }
          },
          adminNotes: {
            note: `Leads ${type} by ${adjustmentAmount}. Reason: ${reason}`,
            addedBy: new ObjectId(adminUser._id),
            addedAt: new Date(),
            isInternal: false
          }
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found or could not be updated' },
        { status: 404 }
      );
    }

    // Get updated subscription for notification
    const updatedSubscription = await subscriptionHistoryCollection.findOne({
      _id: new ObjectId(subscriptionId)
    });

    // Get vendor user for notification
    const usersCollection = await database.getUsersCollection();
    const vendorUser = await usersCollection.findOne({
      _id: new ObjectId(subscription.user)
    });

    // Send notification to vendor
    if (vendorUser) {
      await sendLeadAdjustmentNotification(vendorUser, updatedSubscription, {
        type,
        amount: adjustmentAmount,
        reason
      }, adminUser._id);
    }

    return NextResponse.json({
      success: true,
      message: `Leads ${type} successfully`,
      data: {
        subscriptionId,
        adjustmentType: type,
        adjustmentAmount,
        previousLeadsConsumed: currentLeadsConsumed,
        previousLeadsRemaining: currentLeadsRemaining,
        newLeadsConsumed: newLeadsConsumed,
        newLeadsRemaining: newLeadsRemaining
      }
    });

  } catch (error) {
    console.error('Error adjusting subscription leads:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 