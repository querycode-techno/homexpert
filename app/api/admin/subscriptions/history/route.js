import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { requireAdmin } from '@/lib/dal';
import { ObjectId } from 'mongodb';

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

    // Get updated subscription
    const updatedSubscription = await subscriptionHistoryCollection.findOne({
      _id: new ObjectId(subscriptionId)
    });

    return NextResponse.json({
      success: true,
      message: action === 'verify_and_activate' ? 
        'Subscription verified and activated successfully' : 
        'Payment rejected successfully',
      data: updatedSubscription
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