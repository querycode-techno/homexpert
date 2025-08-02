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

// Function to send subscription notification to vendor
async function sendSubscriptionNotification(vendorUser, subscriptionData, adminUserId) {
  try {
    console.log(`Sending subscription notification to vendor: ${vendorUser.name}`);

    // Create notification content
    const title = 'New Subscription Activated';
    const message = `Your ${subscriptionData.planSnapshot.planName} subscription has been activated! You now have access to ${subscriptionData.planSnapshot.totalLeads} leads for ${subscriptionData.planSnapshot.duration}.`;

    // Create the notification document
    const notification = new Notification({
      title,
      message,
      messageType: 'Success',
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
            type: 'subscription_activated',
            planName: subscriptionData.planSnapshot.planName,
            totalLeads: subscriptionData.planSnapshot.totalLeads.toString(),
            duration: subscriptionData.planSnapshot.duration,
            notificationId: notification._id.toString(),
          },
          token: vendorUser.fcmToken,
        };

        const sendResult = await admin.messaging().send(fcmMessage);
        console.log(`FCM subscription notification sent to vendor ${vendorUser.name}:`, sendResult);

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
    } else {
      console.log(`No FCM token for vendor ${vendorUser.name}, notification saved to database only`);
      return {
        sent: false,
        notificationId: notification._id,
        reason: 'No FCM token'
      };
    }

  } catch (error) {
    console.error('Error sending subscription notification:', error);
    return {
      sent: false,
      error: error.message
    };
  }
}

// GET - Fetch subscription history with optional filtering
export async function GET(request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const paymentStatus = searchParams.get('paymentStatus') || '';
    const paymentMethod = searchParams.get('paymentMethod') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const subscriptionHistoryCollection = await database.getSubscriptionHistoryCollection();
    const usersCollection = await database.getUsersCollection();
    const subscriptionPlansCollection = await database.getSubscriptionPlansCollection();

    // Build query
    let query = {};
    
    // Search across multiple fields
    if (search) {
      const userIds = [];
      // Search for users by name, email, phone
      const users = await usersCollection.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      }, { projection: { _id: 1 } }).toArray();
      
      userIds.push(...users.map(u => u._id));

      query.$or = [
        { 'planSnapshot.planName': { $regex: search, $options: 'i' } },
        { 'payment.transactionId': { $regex: search, $options: 'i' } },
        { user: { $in: userIds } }
      ];
    }

    // Filter by status if specified
    if (status) {
      query.status = status;
    }

    // Filter by payment status if specified
    if (paymentStatus) {
      query['payment.paymentStatus'] = paymentStatus;
    }

    // Filter by payment method if specified
    if (paymentMethod) {
      query['payment.paymentMethod'] = paymentMethod;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await subscriptionHistoryCollection.countDocuments(query);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get subscription history
    const subscriptions = await subscriptionHistoryCollection
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Populate user and plan information
    for (let subscription of subscriptions) {
      // Populate user information
      if (subscription.user) {
        const user = await usersCollection.findOne(
          { _id: subscription.user },
          { projection: { name: 1, email: 1, phone: 1 } }
        );
        subscription.userInfo = user;
      }

      // Populate subscription plan information
      if (subscription.subscriptionPlan) {
        const plan = await subscriptionPlansCollection.findOne(
          { _id: subscription.subscriptionPlan },
          { projection: { planName: 1, duration: 1, totalLeads: 1, price: 1 } }
        );
        subscription.planInfo = plan;
      }

      // Calculate additional fields
      const now = new Date();
      subscription.daysRemaining = subscription.endDate ? 
        Math.max(0, Math.ceil((subscription.endDate - now) / (1000 * 60 * 60 * 24))) : 0;
      subscription.usagePercentage = subscription.planSnapshot?.totalLeads ? 
        Math.round((subscription.usage.leadsConsumed / subscription.planSnapshot.totalLeads) * 100) : 0;
      subscription.isExpired = subscription.daysRemaining === 0 && subscription.endDate < now;
      subscription.isExpiringSoon = subscription.daysRemaining <= 7 && subscription.daysRemaining > 0;
    }

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get summary statistics
    const summary = await subscriptionHistoryCollection.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSubscriptions: { $sum: 1 },
          totalRevenue: { $sum: '$payment.amount' },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ['$payment.paymentStatus', 'pending'] }, 1, 0] }
          },
          activeSubscriptions: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          bankTransferPending: {
            $sum: { 
              $cond: [
                { 
                  $and: [
                    { $eq: ['$payment.paymentMethod', 'bank_transfer'] },
                    { $eq: ['$payment.paymentStatus', 'pending'] }
                  ]
                }, 
                1, 
                0
              ] 
            }
          },
          bankTransferSubmitted: {
            $sum: { 
              $cond: [
                { 
                  $and: [
                    { $eq: ['$payment.paymentMethod', 'bank_transfer'] },
                    { $eq: ['$payment.paymentStatus', 'submitted'] }
                  ]
                }, 
                1, 
                0
              ] 
            }
          }
        }
      }
    ]).toArray();

    const stats = summary[0] || {
      totalSubscriptions: 0,
      totalRevenue: 0,
      pendingPayments: 0,
      activeSubscriptions: 0,
      bankTransferPending: 0,
      bankTransferSubmitted: 0
    };

    return NextResponse.json({
      success: true,
      data: {
        subscriptions,
        summary: stats,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('Error fetching subscription history:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch subscription history',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT - Verify and activate subscription (for bank transfer payments)
export async function PUT(request) {
  try {
    const adminUser = await requireAdmin();
    const { subscriptionId, action, verificationNotes, transactionId } = await request.json();
    
    // Connect to MongoDB for Mongoose models (for notifications)
    await connectDB();

    if (!subscriptionId || !action) {
      return NextResponse.json({
        success: false,
        error: 'Subscription ID and action are required'
      }, { status: 400 });
    }

    if (!ObjectId.isValid(subscriptionId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid subscription ID format'
      }, { status: 400 });
    }

    const subscriptionHistoryCollection = await database.getSubscriptionHistoryCollection();

    // Get the subscription
    const subscription = await subscriptionHistoryCollection.findOne({
      _id: new ObjectId(subscriptionId)
    });

    if (!subscription) {
      return NextResponse.json({
        success: false,
        error: 'Subscription not found'
      }, { status: 404 });
    }

    const now = new Date();
    let updateData = {
      updatedAt: now
    };

    let historyEntry = {
      date: now,
      performedBy: new ObjectId(adminUser.user.id),
      reason: verificationNotes || ''
    };

    if (action === 'verify_and_activate') {
      // Verify payment and activate subscription
      updateData.status = 'active';
      updateData.isActive = true;
      updateData['payment.paymentStatus'] = 'completed';
      updateData['payment.verifiedBy'] = new ObjectId(adminUser.user.id);
      updateData['payment.verifiedAt'] = now;
      updateData['payment.verificationNotes'] = verificationNotes || '';
      
      if (transactionId) {
        updateData['payment.transactionId'] = transactionId;
      }

      historyEntry.action = 'activated';
      historyEntry.reason = `Payment verified and subscription activated by admin. ${verificationNotes || ''}`;

    } else if (action === 'reject_payment') {
      // Reject payment
      updateData.status = 'cancelled';
      updateData.isActive = false;
      updateData['payment.paymentStatus'] = 'failed';
      updateData['payment.rejectedBy'] = new ObjectId(adminUser.user.id);
      updateData['payment.rejectedAt'] = now;
      updateData['payment.rejectionReason'] = verificationNotes || '';

      historyEntry.action = 'cancelled';
      historyEntry.reason = `Payment rejected by admin. ${verificationNotes || ''}`;

    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use "verify_and_activate" or "reject_payment"'
      }, { status: 400 });
    }

    // Update the subscription
    await subscriptionHistoryCollection.updateOne(
      { _id: new ObjectId(subscriptionId) },
      {
        $set: updateData,
        $push: {
          history: historyEntry
        }
      }
    );

    // Get updated subscription with user info
    const updatedSubscription = await subscriptionHistoryCollection.aggregate([
      { $match: { _id: new ObjectId(subscriptionId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo',
          pipeline: [
            { $project: { name: 1, email: 1, phone: 1, fcmToken: 1 } }
          ]
        }
      },
      { $unwind: '$userInfo' }
    ]).toArray();

    // Send notification to vendor if subscription was activated
    let notificationResult = null;
    if (action === 'verify_and_activate' && updatedSubscription[0]?.userInfo) {
      try {
        // Convert MongoDB ObjectId to Mongoose ObjectId for notification
        const mongooseUserId = new mongoose.Types.ObjectId(updatedSubscription[0].user);
        const mongooseAdminId = new mongoose.Types.ObjectId(adminUser.user.id);
        
        // Get user with FCM token for notification
        const userForNotification = await User.findById(mongooseUserId).select('name email phone fcmToken').lean();
        
        if (userForNotification) {
          notificationResult = await sendSubscriptionNotification(
            userForNotification, 
            updatedSubscription[0], 
            mongooseAdminId
          );
        }
      } catch (notificationError) {
        console.error('Failed to send verification notification:', notificationError);
        // Don't fail the verification if notifications fail
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'verify_and_activate' ? 
        'Subscription verified and activated successfully' : 
        'Payment rejected successfully',
      data: {
        subscription: updatedSubscription[0],
        notification: notificationResult ? {
          sent: notificationResult.sent,
          notificationId: notificationResult.notificationId,
          error: notificationResult.error || null,
          reason: notificationResult.reason || null
        } : null
      }
    });

  } catch (error) {
    console.error('Error verifying subscription:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to verify subscription',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST - Create new subscription
export async function POST(request) {
  try {
    const session = await requireAdmin();
    const adminUserId = session.user.id;
    
    // Connect to MongoDB for Mongoose models (for notifications)
    await connectDB();

    const body = await request.json();
    const { action, vendorId, subscriptionPlanId, paymentMethod, transactionId, amount, paymentStatus, status, notes } = body;

    if (action !== 'create_subscription') {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Validation
    if (!vendorId || !subscriptionPlanId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: vendorId, subscriptionPlanId, amount' },
        { status: 400 }
      );
    }

    const subscriptionHistoryCollection = await database.getSubscriptionHistoryCollection();
    const usersCollection = await database.getUsersCollection();
    const vendorsCollection = await database.getVendorsCollection();
    const subscriptionPlansCollection = await database.getSubscriptionPlansCollection();

    // Debug logging
    console.log("Creating subscription for vendorId:", vendorId);
    console.log("VendorId type:", typeof vendorId);
    console.log("VendorId length:", vendorId?.length);
    
    // Verify vendor exists - try by vendor ID first, then by user ID
    let vendor = await vendorsCollection.findOne({ _id: new ObjectId(vendorId) });
    console.log("Found vendor by vendor ID:", vendor ? "YES" : "NO");
    
    if (!vendor) {
      // Try to find by user ID instead
      vendor = await vendorsCollection.findOne({ user: new ObjectId(vendorId) });
      console.log("Found vendor by user ID:", vendor ? "YES" : "NO");
    }
    
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: `Vendor not found with ID: ${vendorId}` },
        { status: 404 }
      );
    }

    // Get vendor user info
    const vendorUser = await usersCollection.findOne({ _id: vendor.user });
    if (!vendorUser) {
      return NextResponse.json(
        { success: false, error: 'Vendor user not found' },
        { status: 404 }
      );
    }

    // Verify subscription plan exists
    const subscriptionPlan = await subscriptionPlansCollection.findOne({ _id: new ObjectId(subscriptionPlanId) });
    if (!subscriptionPlan) {
      return NextResponse.json(
        { success: false, error: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    // Check if vendor already has an active subscription
    const existingActiveSubscription = await subscriptionHistoryCollection.findOne({
      user: vendor.user,
      status: 'active'
    });

    if (existingActiveSubscription) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Vendor already has an active subscription. Please wait for it to expire or cancel it first.' 
        },
        { status: 400 }
      );
    }

    // Create subscription record
    const now = new Date();
    const endDate = new Date(now.getTime() + (subscriptionPlan.durationInDays * 24 * 60 * 60 * 1000));

    const subscriptionData = {
      user: vendor.user,
      subscriptionPlan: new ObjectId(subscriptionPlanId),
      
      // Plan snapshot
      planSnapshot: {
        planName: subscriptionPlan.planName,
        description: subscriptionPlan.description,
        duration: subscriptionPlan.duration,
        durationInDays: subscriptionPlan.durationInDays,
        totalLeads: subscriptionPlan.totalLeads,
        leadsPerMonth: subscriptionPlan.leadsPerMonth,
        price: subscriptionPlan.price,
        discountedPrice: subscriptionPlan.discountedPrice,
        features: subscriptionPlan.features || []
      },
      
      // Subscription period
      startDate: now,
      endDate: endDate,
      
      // Status
      status: status || 'active',
      isActive: status === 'active',
      
      // Usage
      usage: {
        leadsConsumed: 0,
        leadsRemaining: subscriptionPlan.totalLeads,
        monthlyUsage: [],
        averageLeadsPerMonth: 0,
        totalJobsCompleted: 0,
        conversionRate: 0
      },
      
      // Payment
      payment: {
        amount: parseFloat(amount),
        currency: 'INR',
        paymentMethod: paymentMethod || 'online',
        transactionId: transactionId || '',
        paymentStatus: paymentStatus || 'completed',
        paymentDate: paymentStatus === 'completed' ? now : null
      },
      
      // History
      history: [{
        action: 'purchased',
        date: now,
        performedBy: new ObjectId(adminUserId),
        reason: 'Manually created by admin',
        newStatus: status || 'active',
        metadata: { notes: notes || '' }
      }],
      
      // Admin notes
      adminNotes: notes ? [{
        note: notes,
        addedBy: new ObjectId(adminUserId),
        addedAt: now,
        isInternal: true
      }] : [],
      
      createdAt: now,
      updatedAt: now
    };

    // Insert subscription
    const result = await subscriptionHistoryCollection.insertOne(subscriptionData);

    // Fetch the created subscription with populated data
    const createdSubscription = await subscriptionHistoryCollection.aggregate([
      { $match: { _id: result.insertedId } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo',
          pipeline: [
            { $project: { name: 1, email: 1, phone: 1, fcmToken: 1 } }
          ]
        }
      },
      { $unwind: '$userInfo' }
    ]).toArray();

    // Send notification to vendor about the new subscription
    let notificationResult = null;
    try {
      if (createdSubscription[0]?.userInfo) {
        // Convert MongoDB ObjectId to Mongoose ObjectId for notification
        const mongooseUserId = new mongoose.Types.ObjectId(vendorUser._id);
        const mongooseAdminId = new mongoose.Types.ObjectId(adminUserId);
        
        // Get user with FCM token for notification
        const userForNotification = await User.findById(mongooseUserId).select('name email phone fcmToken').lean();
        
        if (userForNotification) {
          notificationResult = await sendSubscriptionNotification(
            userForNotification, 
            subscriptionData, 
            mongooseAdminId
          );
        }
      }
    } catch (notificationError) {
      console.error('Failed to send subscription notification:', notificationError);
      // Don't fail the subscription creation if notifications fail
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscription: createdSubscription[0],
        notification: notificationResult ? {
          sent: notificationResult.sent,
          notificationId: notificationResult.notificationId,
          error: notificationResult.error || null,
          reason: notificationResult.reason || null
        } : {
          sent: false,
          error: 'Failed to send notification'
        }
      }
    });

  } catch (error) {
    console.error('Error creating subscription:', error);

    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create subscription',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete subscription
export async function DELETE(request) {
  try {
    const session = await requireAdmin();
    
    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    const subscriptionHistoryCollection = await database.getSubscriptionHistoryCollection();

    // Verify subscription exists
    const subscription = await subscriptionHistoryCollection.findOne({ 
      _id: new ObjectId(subscriptionId) 
    });
    
    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Delete the subscription
    const result = await subscriptionHistoryCollection.deleteOne({ 
      _id: new ObjectId(subscriptionId) 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting subscription:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete subscription',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/subscriptions/history - Update subscription status
export async function PATCH(request) {
  try {
    await requireAdmin();

    const { subscriptionId, status } = await request.json();

    // Validate required fields
    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['pending', 'active', 'expired', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate ObjectId
    if (!ObjectId.isValid(subscriptionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription ID format' },
        { status: 400 }
      );
    }

    const subscriptionHistoryCollection = await database.getSubscriptionHistoryCollection();

    // Check if subscription exists
    const existingSubscription = await subscriptionHistoryCollection.findOne({
      _id: new ObjectId(subscriptionId)
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Update subscription status
    const updateResult = await subscriptionHistoryCollection.updateOne(
      { _id: new ObjectId(subscriptionId) },
      { 
        $set: { 
          status: status,
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'No changes made to subscription' },
        { status: 400 }
      );
    }

    console.log(`Subscription ${subscriptionId} status updated to: ${status}`);

    return NextResponse.json({
      success: true,
      message: `Subscription status updated to ${status}`
    });

  } catch (error) {
    console.error('Error updating subscription status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update subscription status',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 