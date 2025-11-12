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

      // Normalize referenced IDs that may be stored as strings
      {
        $addFields: {
          normalizedLeadId: {
            $cond: [
              {
                $and: [
                  { $ne: ['$leadId', null] },
                  { $ne: ['$leadId', ''] },
                  { $ne: [{ $type: '$leadId' }, 'missing'] }
                ]
              },
              {
                $cond: [
                  { $eq: [{ $type: '$leadId' }, 'objectId'] },
                  '$leadId',
                  {
                    $convert: {
                      input: '$leadId',
                      to: 'objectId',
                      onError: null,
                      onNull: null
                    }
                  }
                ]
              },
              null
            ]
          },
          normalizedSubscriptionId: {
            $cond: [
              {
                $and: [
                  { $ne: ['$subscriptionId', null] },
                  { $ne: ['$subscriptionId', ''] },
                  { $ne: [{ $type: '$subscriptionId' }, 'missing'] }
                ]
              },
              {
                $cond: [
                  { $eq: [{ $type: '$subscriptionId' }, 'objectId'] },
                  '$subscriptionId',
                  {
                    $convert: {
                      input: '$subscriptionId',
                      to: 'objectId',
                      onError: null,
                      onNull: null
                    }
                  }
                ]
              },
              null
            ]
          }
        }
      },
      
      // Lookup subscription plan information (only for subscription type logs)
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: 'normalizedSubscriptionId',
          foreignField: '_id',
          as: 'subscriptionPlan'
        }
      },

       // Unwind subscription plan array
       { $unwind: { path: '$subscriptionPlan', preserveNullAndEmptyArrays: true } },
      
      {
        $lookup: {
          from: 'leads',
          let: {
            normalizedLeadId: '$normalizedLeadId',
            logTime: '$time'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $and: [
                        { $ne: ['$$normalizedLeadId', null] },
                        { $eq: ['$_id', '$$normalizedLeadId'] }
                      ]
                    },
                    {
                      $and: [
                        { $eq: ['$$normalizedLeadId', null] },
                        {
                          $lte: [
                            {
                              $abs: {
                                $subtract: ['$$logTime', '$createdAt']
                              }
                            },
                            1000 * 60 * 10 // within 10 minutes
                          ]
                        }
                      ]
                    }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
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
          rawLeadId: '$leadId',
          rawSubscriptionId: '$subscriptionId',
          leadId: {
            $ifNull: ['$lead._id', '$rawLeadId']
          },
          subscriptionId: '$subscriptionPlan._id',
          // User data
          name: '$user.name',
          mobile: '$user.phone',
          email: '$user.email',
          // city: '$vendor.address.city',
          // Subscription plan data
          planName: '$subscriptionPlan.planName',
          selectedService: '$lead.selectedService',
          selectedSubservice: '$lead.selectedSubService',
          leadService: '$lead.service',
          leadStatus: '$lead.status',
          leadCustomerName: '$lead.customerName',
          leadCustomerPhone: '$lead.customerPhone',
          leadCustomerEmail: '$lead.customerEmail',
          leadAddress: '$lead.address',
          leadPrice: '$lead.price'
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
      userId: log.userId ? log.userId.toString() : null,
      leadId: log.leadId
        ? log.leadId.toString()
        : log.rawLeadId
          ? log.rawLeadId.toString()
          : null,
      subscriptionId: log.subscriptionId
        ? log.subscriptionId.toString()
        : log.rawSubscriptionId
          ? log.rawSubscriptionId.toString()
          : null,
      name: log.name,
      mobile: log.mobile,
      email: log.email,
      // city: log.city,
      planName: log.planName,
      selectedService: log.selectedService,
      selectedSubservice: log.selectedSubservice,
      leadService: log.leadService,
      leadStatus: log.leadStatus,
      leadCustomerName: log.leadCustomerName,
      leadCustomerPhone: log.leadCustomerPhone,
      leadCustomerEmail: log.leadCustomerEmail,
      leadAddress: log.leadAddress,
      leadPrice: log.leadPrice
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
