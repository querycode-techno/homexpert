import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAdmin } from '@/lib/dal';
import Lead from '@/lib/models/lead';
import User from '@/lib/models/user';
import Role from '@/lib/models/role';

// Connect to MongoDB
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

// GET /api/admin/leads/[id] - Get single lead with full details
export async function GET(request, { params }) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid lead ID' },
        { status: 400 }
      );
    }

    // Get lead with full vendor information (using users with vendor role)
    const lead = await Lead.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'availableToVendors.vendor',
          foreignField: '_id',
          as: 'assignedVendors',
          pipeline: [
            {
              $lookup: {
                from: 'roles',
                localField: 'role',
                foreignField: '_id',
                as: 'roleData'
              }
            },
            { $unwind: '$roleData' },
            { $match: { 'roleData.name': 'vendor' } },
            {
              $project: {
                businessName: '$name',
                userData: {
                  name: '$name',
                  email: '$email',
                  phone: '$phone'
                },
                status: 'active',
                name: 1,
                email: 1,
                phone: 1
              }
            }
          ]
        }
      },
      {
        $addFields: {
          takenByObjectId: {
            $cond: [
              { $eq: [{ $type: '$takenBy' }, 'string'] },
              {
                $convert: {
                  input: '$takenBy',
                  to: 'objectId',
                  onError: null,
                  onNull: null
                }
              },
              '$takenBy'
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'takenByObjectId',
          foreignField: '_id',
          as: 'takenByUserLookup',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                phone: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'vendors',
          localField: 'takenByObjectId',
          foreignField: '_id',
          as: 'takenByVendorById',
          pipeline: [
            {
              $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'vendorUserDoc',
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      email: 1,
                      phone: 1
                    }
                  }
                ]
              }
            },
            {
              $addFields: {
                vendorUser: { $arrayElemAt: ['$vendorUserDoc', 0] }
              }
            },
            {
              $project: {
                _id: 1,
                businessName: 1,
                status: 1,
                vendorUser: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'vendors',
          localField: 'takenByObjectId',
          foreignField: 'user',
          as: 'takenByVendorByUser',
          pipeline: [
            {
              $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'vendorUserDoc',
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      email: 1,
                      phone: 1
                    }
                  }
                ]
              }
            },
            {
              $addFields: {
                vendorUser: { $arrayElemAt: ['$vendorUserDoc', 0] }
              }
            },
            {
              $project: {
                _id: 1,
                businessName: 1,
                status: 1,
                vendorUser: 1
              }
            }
          ]
        }
      },
      {
        $addFields: {
          leadProgressHistory: {
            $map: {
              input: { $ifNull: ['$leadProgressHistory', []] },
              as: 'progress',
              in: {
                $let: {
                  vars: {
                    performedById: {
                      $cond: [
                        {
                          $and: [
                            { $ne: ['$$progress.performedBy', null] },
                            { $eq: [{ $type: '$$progress.performedBy' }, 'string'] }
                          ]
                        },
                        {
                          $convert: {
                            input: '$$progress.performedBy',
                            to: 'objectId',
                            onError: null,
                            onNull: null
                          }
                        },
                        '$$progress.performedBy'
                      ]
                    }
                  },
                  in: {
                    $mergeObjects: [
                      '$$progress',
                      { performedBy: '$$performedById' }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'leadProgressHistory.performedBy',
          foreignField: '_id',
          as: 'leadProgressHistoryUsers',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                phone: 1,
                role: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'vendors',
          localField: 'leadProgressHistory.performedBy',
          foreignField: 'user',
          as: 'leadProgressHistoryVendors',
          pipeline: [
            {
              $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'vendorUserDoc',
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      email: 1,
                      phone: 1
                    }
                  }
                ]
              }
            },
            {
              $addFields: {
                vendorUser: { $arrayElemAt: ['$vendorUserDoc', 0] }
              }
            },
            {
              $project: {
                _id: 1,
                businessName: 1,
                status: 1,
                vendorUser: 1,
                user: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'vendors',
          localField: 'leadProgressHistory.performedBy',
          foreignField: '_id',
          as: 'leadProgressHistoryVendorsById',
          pipeline: [
            {
              $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'vendorUserDoc',
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      email: 1,
                      phone: 1
                    }
                  }
                ]
              }
            },
            {
              $addFields: {
                vendorUser: { $arrayElemAt: ['$vendorUserDoc', 0] }
              }
            },
            {
              $project: {
                _id: 1,
                businessName: 1,
                status: 1,
                vendorUser: 1,
                user: 1
              }
            }
          ]
        }
      },
      {
        $addFields: {
          leadProgressHistory: {
            $map: {
              input: { $ifNull: ['$leadProgressHistory', []] },
              as: 'progress',
              in: {
                $let: {
                  vars: {
                    userInfo: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$leadProgressHistoryUsers',
                            as: 'user',
                            cond: { $eq: ['$$user._id', '$$progress.performedBy'] }
                          }
                        },
                        0
                      ]
                    },
                    vendorInfo: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: {
                              $concatArrays: [
                                { $ifNull: ['$leadProgressHistoryVendors', []] },
                                { $ifNull: ['$leadProgressHistoryVendorsById', []] }
                              ]
                            },
                            as: 'vendor',
                            cond: {
                              $or: [
                                { $eq: ['$$vendor.user', '$$progress.performedBy'] },
                                { $eq: ['$$vendor._id', '$$progress.performedBy'] }
                              ]
                            }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: {
                    $mergeObjects: [
                      '$$progress',
                      {
                        performedByUser: {
                          $cond: [
                            { $ifNull: ['$$userInfo', false] },
                            '$$userInfo',
                            null
                          ]
                        },
                        performedByVendor: {
                          $cond: [
                            { $ifNull: ['$$vendorInfo', false] },
                            '$$vendorInfo',
                            null
                          ]
                        },
                        performedByName: {
                          $cond: [
                            { $ifNull: ['$$vendorInfo', false] },
                            '$$vendorInfo.businessName',
                            {
                              $cond: [
                                { $ifNull: ['$$userInfo', false] },
                                '$$userInfo.name',
                                {
                                  $cond: [
                                    { $ifNull: ['$$progress.performedBy', false] },
                                    { $toString: '$$progress.performedBy' },
                                    null
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        performedByContact: {
                          email: {
                            $cond: [
                              { $ifNull: ['$$vendorInfo', false] },
                              '$$vendorInfo.vendorUser.email',
                              { $ifNull: ['$$userInfo.email', null] }
                            ]
                          },
                          phone: {
                            $cond: [
                              { $ifNull: ['$$vendorInfo', false] },
                              '$$vendorInfo.vendorUser.phone',
                              { $ifNull: ['$$userInfo.phone', null] }
                            ]
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdByUser',
          pipeline: [
            {
              $project: {
                name: 1,
                email: 1,
                role: 1
              }
            }
          ]
        }
      },
      {
        $addFields: {
          assignedVendorCount: { $size: '$assignedVendors' },
          isAssigned: { $gt: [{ $size: '$assignedVendors' }, 0] },
          isTaken: { $ne: ['$takenBy', null] },
          leadAge: {
            $divide: [
              { $subtract: [new Date(), '$createdAt'] },
              86400000 // milliseconds in a day
            ]
          },
          takenByUser: { $arrayElemAt: ['$takenByUserLookup', 0] },
          takenByVendorInfo: {
            $let: {
              vars: {
                vendorRecord: {
                  $arrayElemAt: [
                    {
                      $concatArrays: [
                        { $ifNull: ['$takenByVendorById', []] },
                        { $ifNull: ['$takenByVendorByUser', []] }
                      ]
                    },
                    0
                  ]
                },
                userRecord: { $arrayElemAt: ['$takenByUserLookup', 0] }
              },
              in: {
                $cond: [
                  { $ifNull: ['$$vendorRecord', false] },
                  {
                    businessName: {
                      $ifNull: ['$$vendorRecord.businessName', '$$vendorRecord.vendorUser.name']
                    },
                    userData: {
                      name: {
                        $ifNull: [
                          '$$vendorRecord.vendorUser.name',
                          '$$vendorRecord.businessName'
                        ]
                      },
                      email: '$$vendorRecord.vendorUser.email',
                      phone: '$$vendorRecord.vendorUser.phone'
                    },
                    status: { $ifNull: ['$$vendorRecord.status', 'active'] }
                  },
                  {
                    $cond: [
                      { $ifNull: ['$$userRecord', false] },
                      {
                        businessName: '$$userRecord.name',
                        userData: {
                          name: '$$userRecord.name',
                          email: '$$userRecord.email',
                          phone: '$$userRecord.phone'
                        },
                        status: 'active'
                      },
                      null
                    ]
                  }
                ]
              }
            }
          },
          createdByUser: { $arrayElemAt: ['$createdByUser', 0] }
        }
      },
      {
        $project: {
          takenByUserLookup: 0,
          takenByVendorById: 0,
          takenByVendorByUser: 0,
          leadProgressHistoryUsers: 0,
          leadProgressHistoryVendors: 0,
          leadProgressHistoryVendorsById: 0
        }
      }
    ]);

    if (!lead || lead.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: lead[0]
    });

  } catch (error) {
    console.error('Error fetching lead:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch lead',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/leads/[id] - Update single lead
export async function PATCH(request, { params }) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid lead ID' },
        { status: 400 }
      );
    }

    const { action, data } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    let updateQuery = {};
    let message = '';

    switch (action) {
      case 'updateBasicInfo':
        const allowedFields = [
          'customerName',
          'customerPhone',
          'customerEmail',
          'address',
          'city',
          'state',
          'priority',
          'service',
          'selectedService',
          'selectedSubService',
          'description',
          'additionalNotes',
          'preferredTime',
          'scheduledTime',
          'status'
        ];
        const updateFields = {};
        
        allowedFields.forEach(field => {
          if (data[field] !== undefined) {
            const value = data[field];
            if (typeof value === 'string') {
              updateFields[field] = value.trim();
            } else {
              updateFields[field] = value;
            }
          }
        });

        // Normalize city/state empty strings to null
        if (data.city !== undefined) {
          updateFields.city = (typeof data.city === 'string' && data.city.trim() !== '') 
            ? data.city.trim() 
            : null;
        }
        if (data.state !== undefined) {
          updateFields.state = (typeof data.state === 'string' && data.state.trim() !== '') 
            ? data.state.trim() 
            : null;
        }

        // Handle createdBy field - only allow admin users to modify this
        if (data.createdBy !== undefined) {
          if (data.createdBy === '' || data.createdBy === null) {
            updateFields.createdBy = null;
          } else if (mongoose.Types.ObjectId.isValid(data.createdBy)) {
            updateFields.createdBy = new mongoose.Types.ObjectId(data.createdBy);
          } else {
            return NextResponse.json(
              { success: false, error: 'Invalid createdBy user ID' },
              { status: 400 }
            );
          }
        }

        // Handle price field explicitly
        if (data.price !== undefined) {
          if (data.price === '' || data.price === null) {
            updateFields.price = null;
          } else {
            const numericPrice = Number(data.price);
            if (Number.isNaN(numericPrice)) {
              return NextResponse.json(
                { success: false, error: 'Price must be a valid number' },
                { status: 400 }
              );
            }
            updateFields.price = numericPrice;
          }
        }

        // Quote flag
        if (data.getQuote !== undefined) {
          updateFields.getQuote = !!data.getQuote;
          if (data.getQuote && updateFields.price === undefined) {
            updateFields.price = null;
          }
        }

        const handleDateField = (fieldName, value) => {
          if (value === undefined) {
            return;
          }
          if (value === '' || value === null) {
            updateFields[fieldName] = null;
            return;
          }
          const parsedDate = new Date(value);
          if (Number.isNaN(parsedDate.getTime())) {
            throw new Error(`${fieldName} must be a valid date`);
          }
          updateFields[fieldName] = parsedDate;
        };

        try {
          handleDateField('preferredDate', data.preferredDate);
          handleDateField('scheduledDate', data.scheduledDate);
        } catch (dateError) {
          return NextResponse.json(
            { success: false, error: dateError.message },
            { status: 400 }
          );
        }

        if (Object.keys(updateFields).length === 0) {
          return NextResponse.json(
            { success: false, error: 'No valid fields to update' },
            { status: 400 }
          );
        }

        updateQuery = {
          $set: {
            ...updateFields,
            updatedAt: new Date()
          }
        };
        message = 'Lead updated successfully';
        break;

      case 'updateStatus':
        if (!data?.status) {
          return NextResponse.json(
            { success: false, error: 'Status is required' },
            { status: 400 }
          );
        }

        // Get current lead to track status change
        const currentLead = await Lead.findById(id).lean();
        if (!currentLead) {
          return NextResponse.json(
            { success: false, error: 'Lead not found' },
            { status: 404 }
          );
        }

        // Handle performedBy - if it's "admin" string, find the admin user
        let validPerformedBy = null;
        if (data.performedBy) {
          if (data.performedBy === 'admin') {
            const adminRole = await Role.findOne({ name: 'admin' });
            if (adminRole) {
              const adminUser = await User.findOne({ role: adminRole._id }).lean();
              if (adminUser) {
                validPerformedBy = adminUser._id;
              }
            }
          } else if (mongoose.Types.ObjectId.isValid(data.performedBy)) {
            validPerformedBy = new mongoose.Types.ObjectId(data.performedBy);
          }
        }

        updateQuery = {
          $set: {
            status: data.status,
            modifiedBy: validPerformedBy,
            updatedAt: new Date()
          },
          $push: {
            leadProgressHistory: {
              fromStatus: currentLead.status,
              toStatus: data.status,
              date: new Date(),
              performedBy: validPerformedBy,
              reason: data.notes || `Status updated to ${data.status}`
            }
          }
        };
        message = `Lead status updated to ${data.status}`;
        break;

      case 'assignVendors':
        if (!data?.vendorIds || !Array.isArray(data.vendorIds)) {
          return NextResponse.json(
            { success: false, error: 'vendorIds array is required' },
            { status: 400 }
          );
        }

        // Get vendor role and verify vendors exist
        const vendorRole = await Role.findOne({ name: 'vendor' });
        if (!vendorRole) {
          return NextResponse.json(
            { success: false, error: 'Vendor role not found' },
            { status: 400 }
          );
        }

        const vendors = await User.find({ 
          _id: { $in: data.vendorIds },
          role: vendorRole._id
        }).lean();
        
        if (vendors.length !== data.vendorIds.length) {
          return NextResponse.json(
            { success: false, error: 'Some vendors not found' },
            { status: 400 }
          );
        }

        const currentLeadForAssign = await Lead.findById(id).lean();
        
        // Handle assignedBy - if it's "admin" string, find the admin user
        let validAssignedBy = null;
        if (data.assignedBy) {
          if (data.assignedBy === 'admin') {
            const adminRole = await Role.findOne({ name: 'admin' });
            if (adminRole) {
              const adminUser = await User.findOne({ role: adminRole._id }).lean();
              if (adminUser) {
                validAssignedBy = adminUser._id;
              }
            }
          } else if (mongoose.Types.ObjectId.isValid(data.assignedBy)) {
            validAssignedBy = new mongoose.Types.ObjectId(data.assignedBy);
          }
        }
        
        updateQuery = {
          $set: {
            'availableToVendors.vendor': data.vendorIds,
            'availableToVendors.assignedAt': new Date(),
            'availableToVendors.assignedBy': validAssignedBy,
            status: 'available',
            madeAvailableAt: new Date(),
            modifiedBy: validAssignedBy,
            updatedAt: new Date()
          },
          $push: {
            leadProgressHistory: {
              fromStatus: currentLeadForAssign?.status || 'pending',
              toStatus: 'available',
              date: new Date(),
              performedBy: validAssignedBy,
              reason: `Assigned to ${vendors.length} vendor(s): ${vendors.map(v => v.name).join(', ')}`
            }
          }
        };
        message = `Lead assigned to ${vendors.length} vendor(s)`;
        break;

      case 'removeVendor':
        if (!data?.vendorId) {
          return NextResponse.json(
            { success: false, error: 'vendorId is required' },
            { status: 400 }
          );
        }

        // Get the vendor details for logging
        const vendorRoleForRemoval = await Role.findOne({ name: 'vendor' });
        if (!vendorRoleForRemoval) {
          return NextResponse.json(
            { success: false, error: 'Vendor role not found' },
            { status: 400 }
          );
        }

        const vendorToRemove = await User.findOne({ 
          _id: data.vendorId, 
          role: vendorRoleForRemoval._id 
        }).lean();

        if (!vendorToRemove) {
          return NextResponse.json(
            { success: false, error: 'Vendor not found' },
            { status: 400 }
          );
        }

        const currentLeadForRemoval = await Lead.findById(id).lean();
        
        // Handle performedBy - if it's "admin" string, find the admin user
        let validPerformedByRemoval = null;
        if (data.performedBy) {
          if (data.performedBy === 'admin') {
            const adminRoleForRemoval = await Role.findOne({ name: 'admin' });
            if (adminRoleForRemoval) {
              const adminUserForRemoval = await User.findOne({ role: adminRoleForRemoval._id }).lean();
              if (adminUserForRemoval) {
                validPerformedByRemoval = adminUserForRemoval._id;
              }
            }
          } else if (mongoose.Types.ObjectId.isValid(data.performedBy)) {
            validPerformedByRemoval = new mongoose.Types.ObjectId(data.performedBy);
          }
        }

        // Remove the vendor from the array
        const currentVendors = currentLeadForRemoval?.availableToVendors?.vendor || [];
        const updatedVendors = currentVendors.filter(vendorId => vendorId.toString() !== data.vendorId);

        let newStatus = currentLeadForRemoval?.status;
        let additionalUpdates = {};

        // If no vendors left, change status back to pending
        if (updatedVendors.length === 0) {
          newStatus = 'pending';
          additionalUpdates = {
            $unset: {
              'availableToVendors': 1,
              'madeAvailableAt': 1
            }
          };
        } else {
          additionalUpdates = {
            $set: {
              'availableToVendors.vendor': updatedVendors,
              'availableToVendors.assignedAt': new Date(),
              'availableToVendors.assignedBy': currentLeadForRemoval?.availableToVendors?.assignedBy || null
            }
          };
        }

        updateQuery = {
          ...additionalUpdates,
          $set: {
            ...additionalUpdates.$set,
            status: newStatus,
            modifiedBy: validPerformedByRemoval,
            updatedAt: new Date()
          },
          $push: {
            leadProgressHistory: {
              fromStatus: currentLeadForRemoval?.status || 'available',
              toStatus: newStatus,
              date: new Date(),
              performedBy: validPerformedByRemoval,
              reason: `Vendor removed: ${vendorToRemove.name}${updatedVendors.length === 0 ? ' (no vendors remaining, status changed to pending)' : ''}`
            }
          }
        };
        message = `Vendor ${vendorToRemove.name} removed from lead`;
        break;

      case 'unassignVendors':
        const currentLeadForUnassign = await Lead.findById(id).lean();
        
        // Handle performedBy - if it's "admin" string, find the admin user
        let validPerformedByUnassign = null;
        if (data.performedBy) {
          if (data.performedBy === 'admin') {
            const adminRoleForUnassign = await Role.findOne({ name: 'admin' });
            if (adminRoleForUnassign) {
              const adminUserForUnassign = await User.findOne({ role: adminRoleForUnassign._id }).lean();
              if (adminUserForUnassign) {
                validPerformedByUnassign = adminUserForUnassign._id;
              }
            }
          } else if (mongoose.Types.ObjectId.isValid(data.performedBy)) {
            validPerformedByUnassign = new mongoose.Types.ObjectId(data.performedBy);
          }
        }
        
        updateQuery = {
          $unset: {
            'availableToVendors': 1,
            'takenBy': 1,
            'takenAt': 1
          },
          $set: {
            status: 'pending',
            modifiedBy: validPerformedByUnassign,
            updatedAt: new Date()
          },
          $push: {
            leadProgressHistory: {
              fromStatus: currentLeadForUnassign?.status || 'available',
              toStatus: 'pending',
              date: new Date(),
              performedBy: validPerformedByUnassign,
              reason: 'Unassigned from all vendors'
            }
          }
        };
        message = 'Lead unassigned from vendors';
        break;

      case 'addNote':
        if (!data?.note) {
          return NextResponse.json(
            { success: false, error: 'Note content is required' },
            { status: 400 }
          );
        }

        updateQuery = {
          $push: {
            notes: {
              note: data.note.trim(),
              createdBy: data.createdBy || null,
              date: new Date()
            }
          },
          $set: { updatedAt: new Date() }
        };
        message = 'Note added successfully';
        break;

      case 'addFollowUp':
        if (!data?.followUp) {
          return NextResponse.json(
            { success: false, error: 'Follow-up content is required' },
            { status: 400 }
          );
        }

        updateQuery = {
          $push: {
            followUps: {
              followUp: data.followUp.trim(),
              scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
              createdBy: data.createdBy || null,
              date: new Date()
            }
          },
          $set: { updatedAt: new Date() }
        };
        message = 'Follow-up added successfully';
        break;

      case 'markTaken':
        if (!data?.vendorId) {
          return NextResponse.json(
            { success: false, error: 'vendorId is required' },
            { status: 400 }
          );
        }

        // Verify vendor exists and has vendor role
        const vendorRoleForTaken = await Role.findOne({ name: 'vendor' });
        if (!vendorRoleForTaken) {
          return NextResponse.json(
            { success: false, error: 'Vendor role not found' },
            { status: 400 }
          );
        }

        const vendor = await User.findOne({ 
          _id: data.vendorId, 
          role: vendorRoleForTaken._id 
        }).lean();
        
        if (!vendor) {
          return NextResponse.json(
            { success: false, error: 'Vendor not found' },
            { status: 400 }
          );
        }

        const currentLeadForTaken = await Lead.findById(id).lean();
        
        // Validate vendorId ObjectId
        let validVendorId = null;
        if (data.vendorId && mongoose.Types.ObjectId.isValid(data.vendorId)) {
          validVendorId = new mongoose.Types.ObjectId(data.vendorId);
        }
        
        updateQuery = {
          $set: {
            'takenBy': validVendorId,
            'takenAt': new Date(),
            status: 'taken',
            modifiedBy: validVendorId,
            updatedAt: new Date()
          },
          $push: {
            leadProgressHistory: {
              fromStatus: currentLeadForTaken?.status || 'available',
              toStatus: 'taken',
              date: new Date(),
              performedBy: validVendorId,
              reason: `Lead taken by vendor: ${vendor.name}`
            }
          }
        };
        message = 'Lead marked as taken';
        break;

      case 'requestRefund':
        if (!data?.reason) {
          return NextResponse.json(
            { success: false, error: 'Refund reason is required' },
            { status: 400 }
          );
        }

        updateQuery = {
          $set: {
            'refundRequest.requested': true,
            'refundRequest.reason': data.reason.trim(),
            'refundRequest.requestedAt': new Date(),
            'refundRequest.requestedBy': data.requestedBy || null,
            'refundRequest.status': 'pending',
            updatedAt: new Date()
          },
          $push: {
            leadProgressHistory: {
              fromStatus: '$status',
              toStatus: '$status', // Status doesn't change, just adding refund request
              changedAt: new Date(),
              performedBy: data.requestedBy || null,
              notes: `Refund requested: ${data.reason}`
            }
          }
        };
        message = 'Refund request submitted';
        break;

      case 'processRefund':
        if (!data?.action || !['approve', 'reject'].includes(data.action)) {
          return NextResponse.json(
            { success: false, error: 'Action must be approve or reject' },
            { status: 400 }
          );
        }

        const refundUpdate = {
          'refundRequest.status': data.action === 'approve' ? 'approved' : 'rejected',
          'refundRequest.processedAt': new Date(),
          'refundRequest.processedBy': data.processedBy || null,
          updatedAt: new Date()
        };

        if (data.adminNotes) {
          refundUpdate['refundRequest.adminNotes'] = data.adminNotes;
        }

        updateQuery = {
          $set: refundUpdate,
          $push: {
            leadProgressHistory: {
              fromStatus: '$status',
              toStatus: '$status',
              changedAt: new Date(),
              performedBy: data.processedBy || null,
              notes: `Refund ${data.action}ed${data.adminNotes ? `: ${data.adminNotes}` : ''}`
            }
          }
        };
        message = `Refund request ${data.action}ed`;
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Execute the update
    const updateResult = await Lead.findByIdAndUpdate(
      id,
      updateQuery,
      { new: true, runValidators: true }
    );

    if (!updateResult) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message,
      data: updateResult
    });

  } catch (error) {
    console.error('Error updating lead:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update lead',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/leads/[id] - Delete single lead
export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid lead ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason') || 'No reason provided';

    // For audit purposes, you might want to soft delete instead
    const deleteResult = await Lead.findByIdAndDelete(id);

    if (!deleteResult) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully',
      data: {
        deletedLead: {
          id: deleteResult._id,
          customerName: deleteResult.customerName,
          service: deleteResult.service
        },
        reason
      }
    });

  } catch (error) {
    console.error('Error deleting lead:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete lead',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 