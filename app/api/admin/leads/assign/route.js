import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAdmin } from '@/lib/dal';
import Lead from '@/lib/models/lead';
import User from '@/lib/models/user';
import Role from '@/lib/models/role';
import Notification from '@/lib/models/notification';
import NotificationRecipient from '@/lib/models/notificationRecipient';
import admin from '@/lib/firebase/admin';

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

// Function to send notifications to assigned vendors
async function sendAssignmentNotifications(assignedVendors, leads, assignedByUserId) {
  try {
    console.log(`Sending assignment notifications to ${assignedVendors.length} vendors for ${leads.length} leads`);

    // Create notification content
    const leadCount = leads.length;
    const leadText = leadCount === 1 ? 'lead' : 'leads';
    const title = `New ${leadText.charAt(0).toUpperCase() + leadText.slice(1)} Assigned`;
    const message = leadCount === 1 
      ? `You have been assigned a new lead: ${leads[0].customerName || 'Customer'} - ${leads[0].service || leads[0].selectedService || 'Service'}`
      : `You have been assigned ${leadCount} new leads. Check your dashboard for details.`;

    // Create the notification document
    const notification = new Notification({
      title,
      message,
      messageType: 'Info',
      createdBy: assignedByUserId,
      target: 'vendor',
    });
    await notification.save();

    // Create NotificationRecipient documents and send FCM notifications
    const notificationPromises = assignedVendors.map(async (vendor) => {
      // Create notification recipient record
      const recipientDoc = new NotificationRecipient({
        notificationId: notification._id,
        userId: vendor._id,
        userType: 'vendor',
        deliveryStatus: vendor.fcmToken ? 'pending' : 'failed',
        deliveryAttempts: 0,
      });
      await recipientDoc.save();

      // Send FCM notification if vendor has a token
      if (vendor.fcmToken && vendor.fcmToken.trim() !== '') {
        try {
          const fcmMessage = {
            notification: {
              title,
              body: message,
            },
            data: {
              type: 'lead_assignment',
              leadCount: leadCount.toString(),
              notificationId: notification._id.toString(),
            },
            token: vendor.fcmToken,
          };

          const sendResult = await admin.messaging().send(fcmMessage);
          console.log(`FCM notification sent to vendor ${vendor.name}:`, sendResult);

          // Update delivery status to delivered
          await NotificationRecipient.findByIdAndUpdate(recipientDoc._id, {
            deliveryStatus: 'delivered',
            deliveryAttempts: 1,
          });

        } catch (fcmError) {
          console.error(`Failed to send FCM to vendor ${vendor.name}:`, fcmError.message);

          // Update delivery status to failed
          await NotificationRecipient.findByIdAndUpdate(recipientDoc._id, {
            deliveryStatus: 'failed',
            deliveryAttempts: 1,
          });

          // Remove invalid FCM token if it's a token error
          if (fcmError.code === 'messaging/invalid-registration-token' || 
              fcmError.code === 'messaging/registration-token-not-registered') {
            await User.findByIdAndUpdate(vendor._id, { fcmToken: null });
            console.log(`Removed invalid FCM token for vendor: ${vendor.name}`);
          }
        }
      } else {
        console.log(`No FCM token for vendor ${vendor.name}, notification saved to database only`);
      }
    });

    await Promise.all(notificationPromises);
    console.log(`Assignment notifications processed for ${assignedVendors.length} vendors`);

    return {
      notificationId: notification._id,
      sentCount: assignedVendors.filter(v => v.fcmToken).length,
      totalVendors: assignedVendors.length,
    };

  } catch (error) {
    console.error('Error sending assignment notifications:', error);
    throw error;
  }
}

// POST /api/admin/leads/assign - Assign leads to vendors
export async function POST(request) {
  try {
    await requireAdmin();
    await connectDB();

    const { 
      leadIds, 
      vendorIds, 
      assignmentType = 'manual', // manual, auto, round-robin
      criteria = {},
      assignedBy,
      assignmentMode = 'selected' // 'selected' or 'all'
    } = await request.json();

    // Handle assignedBy - if it's "admin" string, find the admin user
    let validAssignedBy = null;
    if (assignedBy) {
      if (assignedBy === 'admin') {
        // Find the admin user (you might want to pass the actual admin ID from frontend)
        const adminRole = await Role.findOne({ name: 'admin' });
        if (adminRole) {
          const adminUser = await User.findOne({ role: adminRole._id }).lean();
          if (adminUser) {
            validAssignedBy = adminUser._id;
          }
        }
      } else if (mongoose.Types.ObjectId.isValid(assignedBy)) {
        validAssignedBy = new mongoose.Types.ObjectId(assignedBy);
      }
    }

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'leadIds array is required' },
        { status: 400 }
      );
    }

    let finalVendorIds = vendorIds;

    // Handle different assignment types
    if (assignmentType === 'auto') {
      // Auto-assign based on criteria
      finalVendorIds = await getVendorsForAutoAssignment(criteria, leadIds);
    } else if (assignmentType === 'round-robin') {
      // Round-robin assignment
      finalVendorIds = await getVendorsForRoundRobin(criteria, leadIds.length);
    } else {
      // Manual assignment - validate vendor IDs
      if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'vendorIds array is required for manual assignment' },
          { status: 400 }
        );
      }
    }

    // Get vendor role to verify vendors are users with vendor role
    const vendorRole = await Role.findOne({ name: 'vendor' });
    if (!vendorRole) {
      return NextResponse.json(
        { success: false, error: 'Vendor role not found' },
        { status: 400 }
      );
    }

    // Verify vendors exist and have vendor role (include FCM token for notifications)
    const vendors = await User.find({ 
      _id: { $in: finalVendorIds },
      role: vendorRole._id
    }).select('_id name email phone fcmToken').lean();

    if (vendors.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active vendors found' },
        { status: 400 }
      );
    }

    // Get leads to be assigned
    const leads = await Lead.find({ 
      _id: { $in: leadIds },
      status: { $in: ['pending', 'available'] } // Only assign pending or available leads
    }).lean();

    if (leads.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No assignable leads found' },
        { status: 400 }
      );
    }

    // Perform bulk assignment
    const assignmentPromises = [];
    const assignmentResults = [];

    if (assignmentType === 'round-robin') {
      // Round-robin: distribute leads evenly among vendors
      leads.forEach((lead, index) => {
        const vendorIndex = index % vendors.length;
        const assignedVendor = vendors[vendorIndex];
        
        const promise = Lead.findByIdAndUpdate(
          lead._id,
          {
            $set: {
              'availableToVendors.vendor': [assignedVendor._id],
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
                reason: `Round-robin assigned to vendor: ${assignedVendor.name}`
              }
            }
          },
          { new: true }
        );

        assignmentPromises.push(promise);
        assignmentResults.push({
          leadId: lead._id,
          vendorIds: [assignedVendor._id],
          vendorNames: [assignedVendor.name]
        });
      });
    } else {
      // Manual or auto assignment: assign all vendors to all leads
      const vendorIdArray = vendors.map(v => v._id);
      const vendorNames = vendors.map(v => v.name);

      leads.forEach(lead => {
        const assignmentTypeText = assignmentMode === 'all' ? 'all available vendors' : `${vendors.length} selected vendor(s)`;
        const reasonText = `Assigned to ${assignmentTypeText}: ${vendorNames.join(', ')}`;
        
        const promise = Lead.findByIdAndUpdate(
          lead._id,
          {
            $set: {
              'availableToVendors.vendor': vendorIdArray,
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
                reason: reasonText
              }
            }
          },
          { new: true }
        );

        assignmentPromises.push(promise);
        assignmentResults.push({
          leadId: lead._id,
          vendorIds: vendorIdArray,
          vendorNames
        });
      });
    }

    // Execute all assignments in parallel
    const updatedLeads = await Promise.all(assignmentPromises);

    // Send notifications to assigned vendors
    let notificationResult = null;
    try {
      notificationResult = await sendAssignmentNotifications(vendors, leads, validAssignedBy);
    } catch (notificationError) {
      console.error('Failed to send assignment notifications:', notificationError);
      // Don't fail the assignment if notifications fail
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${leads.length} lead(s) to vendor(s)`,
      data: {
        assignmentType,
        assignedLeadsCount: leads.length,
        vendorsCount: vendors.length,
        assignments: assignmentResults,
        vendors: vendors.map(v => ({
          id: v._id,
          name: v.name,
          email: v.email,
          phone: v.phone
        })),
        notifications: notificationResult ? {
          sent: true,
          notificationId: notificationResult.notificationId,
          sentCount: notificationResult.sentCount,
          totalVendors: notificationResult.totalVendors
        } : {
          sent: false,
          error: 'Failed to send notifications'
        }
      }
    });

  } catch (error) {
    console.error('Error assigning leads:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to assign leads',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function for auto assignment
async function getVendorsForAutoAssignment(criteria, leadIds) {
  const { city, maxVendorsPerLead = 3 } = criteria;

  // Get vendor role
  const vendorRole = await Role.findOne({ name: 'vendor' });
  if (!vendorRole) return [];

  // Get lead details to determine cities
  const leads = await Lead.find({ _id: { $in: leadIds } }).lean();
  const cities = [...new Set(leads.map(lead => lead.address?.city).filter(Boolean))];

  // Build user query for vendors
  const userQuery = {
    role: vendorRole._id
  };

  if (city || cities.length > 0) {
    userQuery['address.city'] = { 
      $in: city ? [city] : cities 
    };
  }

  // Get best matching vendor users
  const vendors = await User.find(userQuery)
    .sort({ name: 1 })
    .limit(maxVendorsPerLead)
    .lean();

  return vendors.map(v => v._id);
}

// Helper function for round-robin assignment
async function getVendorsForRoundRobin(criteria, leadCount) {
  const { city } = criteria;

  // Get vendor role
  const vendorRole = await Role.findOne({ name: 'vendor' });
  if (!vendorRole) return [];

  // Build user query for vendors
  const userQuery = {
    role: vendorRole._id
  };

  if (city) {
    userQuery['address.city'] = city;
  }

  // Get available vendor users for round-robin
  const vendors = await User.find(userQuery)
    .sort({ name: 1 }) // Sort alphabetically for fair distribution
    .lean();

  return vendors.map(v => v._id);
}

// GET /api/admin/leads/assign - Get assignment suggestions and return active vendor
export async function GET(request) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const leadIds = searchParams.get('leadIds')?.split(',') || [];
    const serviceFilter = searchParams.get('service');
    const cityFilter = searchParams.get('city');
    const assignmentType = searchParams.get('type') || 'manual';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    if (leadIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'leadIds parameter is required' },
        { status: 400 }
      );
    }

    // Get lead details
    const leads = await Lead.find({ _id: { $in: leadIds } })
      .select('customerName service selectedService address status')
      .lean();

    if (leads.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No leads found' },
        { status: 404 }
      );
    }

    // Extract unique services and cities from leads
    const services = [...new Set(leads.map(lead => lead.service || lead.selectedService).filter(Boolean))];
    const cities = [...new Set(leads.map(lead => lead.address?.city).filter(Boolean))];

    // Get vendor role
    const vendorRole = await Role.findOne({ name: 'vendor' });
    if (!vendorRole) {
      return NextResponse.json(
        { success: false, error: 'Vendor role not found' },
        { status: 400 }
      );
    }

    // Build user query for vendors - show ALL vendors regardless of city
    const userQuery = {
      role: vendorRole._id
    };

    // Add search functionality
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      userQuery.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: { $regex: search.trim() } },
        { 'address.city': searchRegex }
      ];
    }

    // Optional: Filter by city if specifically requested (but not by default)
    if (cityFilter && cityFilter !== 'all') {
      userQuery['address.city'] = cityFilter;
    }
    // Note: Removed automatic city filtering from leads to show all vendors

    // Get suggested vendors (users with vendor role)
    const suggestedVendors = await User.aggregate([
      { $match: userQuery },
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'roleData'
        }
      },
      { $unwind: '$roleData' },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: 'user',
          as: 'vendorData'
        }
      },
      {
        $addFields: {
          businessName: { 
            $cond: [
              { $gt: [{ $size: '$vendorData' }, 0] },
              { $arrayElemAt: ['$vendorData.businessName', 0] },
              '$name'
            ]
          },
          services: { 
            $cond: [
              { $gt: [{ $size: '$vendorData' }, 0] },
              { $arrayElemAt: ['$vendorData.services', 0] },
              []
            ]
          },
          rating: { 
            $cond: [
              { $gt: [{ $size: '$vendorData' }, 0] },
              { $arrayElemAt: ['$vendorData.rating', 0] },
              4.5
            ]
          },
          totalJobs: { 
            $cond: [
              { $gt: [{ $size: '$vendorData' }, 0] },
              { $arrayElemAt: ['$vendorData.totalJobs', 0] },
              0
            ]
          },
          status: { 
            $cond: [
              { $gt: [{ $size: '$vendorData' }, 0] },
              { $arrayElemAt: ['$vendorData.status', 0] },
              'active'
            ]
          },
          matchScore: {
            $add: [
              2.0, // Base score for all vendors
              { $cond: [{ $in: ['$address.city', cities] }, 1.0, 0] } // City match bonus
            ]
          }
        }
      },
      // Add search and filter stages after lookup
      ...((search && search.trim()) || serviceFilter || cityFilter ? [{
        $match: {
          $and: [
            // Search filter
            ...(search && search.trim() ? [{
              $or: [
                { name: { $regex: search.trim(), $options: 'i' } },
                { email: { $regex: search.trim(), $options: 'i' } },
                { phone: { $regex: search.trim() } },
                { 'address.city': { $regex: search.trim(), $options: 'i' } },
                { services: { $in: [{ $regex: search.trim(), $options: 'i' }] } }
              ]
            }] : []),
            // Service filter
            ...(serviceFilter ? [{ services: serviceFilter }] : []),
            // City filter  
            ...(cityFilter ? [{ 'address.city': cityFilter }] : [])
          ]
        }
      }] : []),
      {
        $project: {
          _id: 1,
          businessName: 1,
          services: 1,
          'address.city': 1,
          rating: 1,
          totalJobs: 1,
          status: 1,
          name: 1,
          email: 1,
          phone: 1,
          matchScore: 1,
          userData: {
            name: '$name',
            email: '$email', 
            phone: '$phone'
          }
        }
      },
      { $sort: { matchScore: -1, name: 1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Get total count for pagination
    const totalCount = await User.countDocuments(userQuery);
    const hasMore = skip + limit < totalCount;

    // Debug: If no vendors found, check what vendors exist
    if (suggestedVendors.length === 0) {
      console.log('DEBUG: No vendors found with query:', userQuery);
      
      // Check all users with vendor role
      const allVendorUsers = await User.find({ role: vendorRole._id }).select('name email phone address').lean();
      console.log('DEBUG: All vendor users in system:', allVendorUsers.length, allVendorUsers.map(u => ({
        name: u.name,
        email: u.email,
        city: u.address?.city
      })));
      
      // Check if vendor role exists and has users
      const vendorRoleWithUsers = await Role.findById(vendorRole._id).lean();
      const totalUsers = await User.countDocuments({});
      const vendorUsers = await User.countDocuments({ role: vendorRole._id });
      console.log('DEBUG: Total users:', totalUsers, 'Vendor users:', vendorUsers, 'Vendor role:', vendorRoleWithUsers?.name);
    }

    // Get assignment statistics
    const stats = {
      totalLeads: leads.length,
      availableVendors: suggestedVendors.length,
      servicesRequired: services,
      citiesRequired: cities,
      assignableLeads: leads.filter(lead => ['pending', 'available'].includes(lead.status)).length
    };

    return NextResponse.json({
      success: true,
      data: {
        leads: leads.map(lead => ({
          id: lead._id,
          customerName: lead.customerName,
          service: lead.service || lead.selectedService,
          city: lead.address?.city,
          status: lead.status
        })),
        suggestedVendors,
        pagination: {
          page,
          limit,
          total: totalCount,
          hasMore,
          totalPages: Math.ceil(totalCount / limit)
        },
        stats,
        filters: {
          service: serviceFilter,
          city: cityFilter,
          assignmentType,
          search
        }
      }
    });

  } catch (error) {
    console.error('Error getting assignment suggestions:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get assignment suggestions',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 