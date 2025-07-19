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

// POST /api/admin/leads - Create new lead (admin only)
export async function POST(request) {
  try {
    await requireAdmin();
    await connectDB();

    const body = await request.json();

    // Validation - check essential fields
    if (!body.customerName?.trim() || !body.customerPhone?.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Customer name and phone number are required' 
        },
        { status: 400 }
      );
    }

    if (!body.service?.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Service selection is required' 
        },
        { status: 400 }
      );
    }

    if (!body.address?.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Address is required' 
        },
        { status: 400 }
      );
    }

    // Phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(body.customerPhone.trim())) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Please provide a valid 10-digit phone number' 
        },
        { status: 400 }
      );
    }

    // Email validation if provided
    if (body.customerEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.customerEmail.trim())) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Please provide a valid email address' 
          },
          { status: 400 }
        );
      }
    }

    // Check for recent duplicates (within 24 hours)
    const existingLead = await Lead.findOne({
      customerPhone: body.customerPhone.trim(),
      service: body.service.trim(),
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).lean();

    if (existingLead) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'A similar lead was created recently. Please check the lead list.' 
        },
        { status: 409 }
      );
    }

    // Create lead object matching the schema
    const leadData = {
      // Customer Information
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      customerEmail: body.customerEmail?.trim() || undefined,
      
      // Service Information
      service: body.service.trim(),
      selectedService: body.selectedService?.trim() || body.service.trim(),
      selectedSubService: body.selectedSubService?.trim() || undefined,
      
      // Address
      address: body.address.trim(),
      
      // Lead Details
      description: body.description?.trim() || `Service request for ${body.service}`,
      additionalNotes: body.additionalNotes?.trim() || undefined,
      
      // Pricing
      price: body.price || undefined,
      getQuote: body.getQuote || (body.price === 'Quote'),
      
      // Scheduling
      preferredDate: body.preferredDate ? new Date(body.preferredDate) : undefined,
      preferredTime: body.preferredTime || undefined,
      
      // Lead Status - starts as pending (admin controlled)
      status: 'pending',
      
      // Multi-Vendor Availability (empty initially - admin will assign)
      availableToVendors: {
        vendor: []
      },
      
      // Follow-ups and Notes (empty initially)
      followUps: [],
      notes: [],
      
      // Lead Progress History
      leadProgressHistory: [{
        toStatus: 'pending',
        reason: 'Lead created by admin',
        date: new Date()
      }],
      
      // Refund Request (default state)
      refundRequest: {
        isRequested: false,
        adminResponse: {
          status: 'pending'
        }
      },
      
      // Admin Tracking - include createdBy when admin creates lead
      createdBy: body.createdBy || null, // Will be admin user ID
      modifiedBy: body.createdBy || null
    };

    console.log('Creating lead with data:', leadData);

    // Create the lead
    const newLead = new Lead(leadData);
    const savedLead = await newLead.save();

    console.log('Lead created successfully:', savedLead._id);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Lead created successfully!',
      leadId: savedLead._id.toString(),
      data: {
        id: savedLead._id.toString(),
        service: savedLead.service,
        selectedService: savedLead.selectedService,
        customerName: savedLead.customerName,
        customerPhone: savedLead.customerPhone,
        status: savedLead.status,
        createdAt: savedLead.createdAt,
        createdBy: savedLead.createdBy
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating lead:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { 
          success: false, 
          error: `Validation error: ${validationErrors.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'A similar lead already exists.' 
        },
        { status: 409 }
      );
    }

    // Handle database connection errors
    if (error.message.includes('connection') || error.message.includes('connect')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection error. Please try again.' 
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create lead. Please try again.' 
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/leads - Get all leads with filtering and pagination
export async function GET(request) {
  try {
    const { user, role } = await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit')) || 10));
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || '';
    const service = searchParams.get('service') || '';
    const city = searchParams.get('city') || '';
    const assignedStatus = searchParams.get('assignedStatus') || ''; // assigned, unassigned, all
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Build aggregation pipeline for optimal performance
    const pipeline = [];

    // Match stage - build query
    const matchQuery = {};

    // Role-based filtering: Only admins see all leads, others see only their created leads
    if (role.name !== 'admin') {
      matchQuery.createdBy = new mongoose.Types.ObjectId(user.id);
    }

    // Search across multiple fields
    if (search) {
      matchQuery.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { service: { $regex: search, $options: 'i' } },
        { selectedService: { $regex: search, $options: 'i' } },
        { selectedSubService: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (status && status !== 'all') {
      matchQuery.status = status;
    }

    // Filter by service
    if (service && service !== 'all') {
      matchQuery.$or = matchQuery.$or || [];
      matchQuery.$or.push(
        { service: { $regex: service, $options: 'i' } },
        { selectedService: { $regex: service, $options: 'i' } }
      );
    }

    // Filter by city
    if (city && city !== 'all') {
      matchQuery['address.city'] = { $regex: city, $options: 'i' };
    }

    // Filter by assigned status
    if (assignedStatus === 'assigned') {
      matchQuery['availableToVendors.vendor'] = { $exists: true, $not: { $size: 0 } };
    } else if (assignedStatus === 'unassigned') {
      matchQuery.$or = [
        { 'availableToVendors.vendor': { $exists: false } },
        { 'availableToVendors.vendor': { $size: 0 } }
      ];
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      matchQuery.createdAt = {};
      if (dateFrom) {
        matchQuery.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        matchQuery.createdAt.$lte = new Date(dateTo);
      }
    }

    pipeline.push({ $match: matchQuery });

    // Lookup vendor information for assigned leads (using users with vendor role)
    pipeline.push({
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
    });

    // Add computed fields
    pipeline.push({
      $addFields: {
        assignedVendorCount: { $size: '$assignedVendors' },
        isAssigned: { $gt: [{ $size: '$assignedVendors' }, 0] },
        lastUpdated: '$updatedAt',
        leadAge: {
          $divide: [
            { $subtract: [new Date(), '$createdAt'] },
            86400000 // milliseconds in a day
          ]
        }
      }
    });

    // Sort
    const sortStage = {};
    sortStage[sortBy] = sortOrder;
    pipeline.push({ $sort: sortStage });

    // Get total count for pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Lead.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Add pagination
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: limit });

    // Project only needed fields for performance
    pipeline.push({
      $project: {
        customerName: 1,
        customerPhone: 1,
        customerEmail: 1,
        service: 1,
        selectedService: 1,
        selectedSubService: 1,
        address: 1,
        status: 1,
        priority: 1,
        assignedVendors: 1,
        assignedVendorCount: 1,
        isAssigned: 1,
        leadAge: 1,
        createdAt: 1,
        updatedAt: 1,
        availableToVendors: 1,
        leadProgressHistory: { $slice: ['$leadProgressHistory', -3] }, // Last 3 entries
        followUps: { $slice: ['$followUps', -2] }, // Last 2 follow-ups
        notes: { $slice: ['$notes', -2] } // Last 2 notes
      }
    });

    // Execute the aggregation
    const leads = await Lead.aggregate(pipeline);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get summary stats
    const statsPromise = Lead.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgLeadAge: {
            $avg: {
              $divide: [
                { $subtract: [new Date(), '$createdAt'] },
                86400000
              ]
            }
          }
        }
      }
    ]);

    const assignedStatsPromise = Lead.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          assignedLeads: {
            $sum: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ['$availableToVendors.vendor', []] } }, 0] },
                1,
                0
              ]
            }
          },
          unassignedLeads: {
            $sum: {
              $cond: [
                { $eq: [{ $size: { $ifNull: ['$availableToVendors.vendor', []] } }, 0] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const [statusStats, assignedStats] = await Promise.all([statsPromise, assignedStatsPromise]);

    // Format stats
    const formattedStatusStats = {};
    statusStats.forEach(stat => {
      formattedStatusStats[stat._id] = {
        count: stat.count,
        avgAge: Math.round(stat.avgLeadAge || 0)
      };
    });

    const summary = {
      total,
      assigned: assignedStats[0]?.assignedLeads || 0,
      unassigned: assignedStats[0]?.unassignedLeads || 0,
      statusBreakdown: formattedStatusStats
    };

    return NextResponse.json({
      success: true,
      data: {
        leads,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage
        },
        summary,
        filters: {
          search,
          status,
          service,
          city,
          assignedStatus,
          dateFrom,
          dateTo
        }
      }
    });

  } catch (error) {
    console.error('Error fetching leads:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch leads',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/leads - Bulk update leads
export async function PATCH(request) {
  try {
    await requireAdmin();
    await connectDB();

    const { action, leadIds, data } = await request.json();

    if (!action || !leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: action, leadIds' },
        { status: 400 }
      );
    }

    let updateResult;
    let message;

    switch (action) {
      case 'updateStatus':
        if (!data?.status) {
          return NextResponse.json(
            { success: false, error: 'Status is required for status update' },
            { status: 400 }
          );
        }

        // For proper history tracking, we need to update each lead individually
        const leadsToUpdate = await Lead.find({ _id: { $in: leadIds } }).select('_id status').lean();
        
        // Validate performedBy ObjectId if provided
        let validPerformedBy = null;
        if (data.performedBy && mongoose.Types.ObjectId.isValid(data.performedBy)) {
          validPerformedBy = new mongoose.Types.ObjectId(data.performedBy);
        }
        
        const updatePromises = leadsToUpdate.map(lead => 
          Lead.findByIdAndUpdate(
            lead._id,
            { 
              $set: { 
                status: data.status,
                modifiedBy: validPerformedBy,
                updatedAt: new Date()
              },
              $push: {
                leadProgressHistory: {
                  fromStatus: lead.status,
                  toStatus: data.status,
                  date: new Date(),
                  performedBy: validPerformedBy,
                  reason: data.notes || `Bulk status update to ${data.status}`
                }
              }
            }
          )
        );
        
        await Promise.all(updatePromises);
        updateResult = { modifiedCount: leadsToUpdate.length, matchedCount: leadsToUpdate.length };
        message = `Updated status for ${updateResult.modifiedCount} leads`;
        break;

      case 'assignVendors':
        if (!data?.vendorIds || !Array.isArray(data.vendorIds)) {
          return NextResponse.json(
            { success: false, error: 'vendorIds array is required for vendor assignment' },
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

        // For proper history tracking, update each lead individually
        const leadsToAssign = await Lead.find({ _id: { $in: leadIds } }).select('_id status').lean();
        
        // Validate assignedBy ObjectId if provided
        let validAssignedBy = null;
        if (data.assignedBy && mongoose.Types.ObjectId.isValid(data.assignedBy)) {
          validAssignedBy = new mongoose.Types.ObjectId(data.assignedBy);
        }
        
        const assignPromises = leadsToAssign.map(lead => 
          Lead.findByIdAndUpdate(
            lead._id,
            { 
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
                  fromStatus: lead.status,
                  toStatus: 'available',
                  date: new Date(),
                  performedBy: validAssignedBy,
                  reason: `Bulk assigned to ${vendors.length} vendor(s): ${vendors.map(v => v.name).join(', ')}`
                }
              }
            }
          )
        );
        
        await Promise.all(assignPromises);
        updateResult = { modifiedCount: leadsToAssign.length, matchedCount: leadsToAssign.length };
        message = `Assigned ${updateResult.modifiedCount} leads to ${vendors.length} vendor(s)`;
        break;

      case 'unassignVendors':
        // For proper history tracking, update each lead individually
        const leadsToUnassign = await Lead.find({ _id: { $in: leadIds } }).select('_id status').lean();
        
        // Validate performedBy ObjectId if provided
        let validPerformedByUnassign = null;
        if (data.performedBy && mongoose.Types.ObjectId.isValid(data.performedBy)) {
          validPerformedByUnassign = new mongoose.Types.ObjectId(data.performedBy);
        }
        
        const unassignPromises = leadsToUnassign.map(lead => 
          Lead.findByIdAndUpdate(
            lead._id,
            { 
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
                  fromStatus: lead.status,
                  toStatus: 'pending',
                  date: new Date(),
                  performedBy: validPerformedByUnassign,
                  reason: 'Bulk unassigned from vendors'
                }
              }
            }
          )
        );
        
        await Promise.all(unassignPromises);
        updateResult = { modifiedCount: leadsToUnassign.length, matchedCount: leadsToUnassign.length };
        message = `Unassigned ${updateResult.modifiedCount} leads from vendors`;
        break;

      case 'setPriority':
        if (!data?.priority) {
          return NextResponse.json(
            { success: false, error: 'Priority is required' },
            { status: 400 }
          );
        }

        updateResult = await Lead.updateMany(
          { _id: { $in: leadIds } },
          { 
            $set: { 
              priority: data.priority,
              updatedAt: new Date()
            }
          }
        );
        message = `Updated priority for ${updateResult.modifiedCount} leads`;
        break;

      case 'addNote':
        if (!data?.note) {
          return NextResponse.json(
            { success: false, error: 'Note content is required' },
            { status: 400 }
          );
        }

        updateResult = await Lead.updateMany(
          { _id: { $in: leadIds } },
          { 
            $push: {
              notes: {
                note: data.note,
                createdBy: data.createdBy || null,
                date: new Date()
              }
            },
            $set: { updatedAt: new Date() }
          }
        );
        message = `Added note to ${updateResult.modifiedCount} leads`;
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message,
      data: {
        modifiedCount: updateResult.modifiedCount,
        matchedCount: updateResult.matchedCount
      }
    });

  } catch (error) {
    console.error('Error updating leads:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update leads',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/leads - Bulk delete leads
export async function DELETE(request) {
  try {
    await requireAdmin();
    await connectDB();

    const { leadIds, reason } = await request.json();

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'leadIds array is required' },
        { status: 400 }
      );
    }

    // For audit purposes, we might want to soft delete or log deletion
    const deleteResult = await Lead.deleteMany({
      _id: { $in: leadIds }
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleteResult.deletedCount} lead(s)`,
      data: {
        deletedCount: deleteResult.deletedCount,
        reason: reason || 'No reason provided'
      }
    });

  } catch (error) {
    console.error('Error deleting leads:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete leads',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 