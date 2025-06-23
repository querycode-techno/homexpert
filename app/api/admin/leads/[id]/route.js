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
        $lookup: {
          from: 'users',
          localField: 'takenBy',
          foreignField: '_id',
          as: 'takenByVendor',
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
                status: 'active'
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
          takenByVendorInfo: { $arrayElemAt: ['$takenByVendor', 0] }
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
        const allowedFields = ['customerName', 'customerPhone', 'customerEmail', 'address', 'priority'];
        const updateFields = {};
        
        allowedFields.forEach(field => {
          if (data[field] !== undefined) {
            updateFields[field] = data[field];
          }
        });

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
        message = 'Lead basic information updated successfully';
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

        // Validate performedBy ObjectId if provided
        let validPerformedBy = null;
        if (data.performedBy && mongoose.Types.ObjectId.isValid(data.performedBy)) {
          validPerformedBy = new mongoose.Types.ObjectId(data.performedBy);
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
        
        // Validate assignedBy ObjectId if provided
        let validAssignedBy = null;
        if (data.assignedBy && mongoose.Types.ObjectId.isValid(data.assignedBy)) {
          validAssignedBy = new mongoose.Types.ObjectId(data.assignedBy);
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

      case 'unassignVendors':
        const currentLeadForUnassign = await Lead.findById(id).lean();
        
        // Validate performedBy ObjectId if provided
        let validPerformedByUnassign = null;
        if (data.performedBy && mongoose.Types.ObjectId.isValid(data.performedBy)) {
          validPerformedByUnassign = new mongoose.Types.ObjectId(data.performedBy);
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