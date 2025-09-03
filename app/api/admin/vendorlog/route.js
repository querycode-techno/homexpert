import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { ObjectId } from 'mongodb';

// GET /api/admin/vendorlog - Get all vendor log entries
export async function GET(request) {
  try {
    // Get collections
    const vendorLogsCollection = await database.getVendorLogsCollection();

    // Build aggregation pipeline to get all vendor logs
    const pipeline = [
      // Lookup vendor information
      {
        $lookup: {
          from: 'vendors',
          localField: 'userId',
          foreignField: 'user',
          as: 'vendor'
        }
      },
      
      // Unwind vendor array
      { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
      
      // Lookup user information
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      
      // Unwind user array
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      
      // Lookup subscription plan information (only for subscription type logs)
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: 'subscriptionId',
          foreignField: '_id',
          as: 'subscriptionPlan'
        }
      },

       // Unwind subscription plan array
       { $unwind: { path: '$subscriptionPlan', preserveNullAndEmptyArrays: true } },
      
      {
        $lookup: {
          from: 'leads',
          localField: 'leadId',
          foreignField: '_id',
          as: 'lead'
        }
      },

      // Unwind lead array
      { $unwind: { path: '$lead', preserveNullAndEmptyArrays: true } },
     
      
      // Project only the required fields
      {
        $project: {
          _id: 1,
          type: 1,
          time: 1,
          userId: 1,
          // User data
          name: '$user.name',
          mobile: '$user.phone',
          email: '$user.email',
          // city: '$vendor.address.city',
          // Subscription plan data
          planName: '$subscriptionPlan.planName',
          selectedService: '$lead.selectedService',
          selectedSubservice: '$lead.selectedSubService',
        }
      },
      
      // Sort by time descending (newest first)
      { $sort: { time: -1 } }
    ];

    // Execute aggregation
    const logs = await vendorLogsCollection.aggregate(pipeline).toArray();

    // Format logs data
    const formattedLogs = logs.map(log => ({
      id: log._id.toString(),
      type: log.type,
      time: log.time,
      userId: log.userId.toString(),
      // leadId: log.leadId ? log.leadId.toString() : null,
      // subscriptionId: log.subscriptionId ? log.subscriptionId.toString() : null,
      name: log.name,
      mobile: log.mobile,
      email: log.email,
      // city: log.city,
      planName: log.planName,
      selectedService: log.selectedService,
      selectedSubservice: log.selectedSubservice,
    }));

    return NextResponse.json({
      success: true,
      logs: formattedLogs
    });

  } catch (error) {
    console.error('Error fetching all vendor logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/vendorlog - Delete a specific vendor log entry
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorlogId = searchParams.get('vendorlogId');

    if (!vendorlogId) {
      return NextResponse.json(
        { error: 'vendorlogId is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(vendorlogId)) {
      return NextResponse.json(
        { error: 'Invalid vendorlogId format' },
        { status: 400 }
      );
    }

    // Get vendor logs collection
    const vendorLogsCollection = await database.getVendorLogsCollection();

    // Delete the log entry
    const result = await vendorLogsCollection.deleteOne({
      _id: new ObjectId(vendorlogId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Vendor log entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor log entry deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting vendor log:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
