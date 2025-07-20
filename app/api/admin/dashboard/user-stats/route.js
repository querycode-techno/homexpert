import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/dal';
import { database } from '@/lib/db';
import { ObjectId } from 'mongodb';

// GET /api/admin/dashboard/user-stats - Get user-specific statistics for non-admin users
export async function GET(request) {
  try {
    const session = await requireAdmin();
    const userId = session.user.id;
    const userRole = session.user.role;

    // Get database collections
    const vendorsCollection = await database.getVendorsCollection();
    const leadsCollection = await database.getLeadsCollection();

    let stats = {
      totalOnboardedVendors: 0,
      totalCreatedLeads: 0,
      recentVendors: [],
      recentLeads: []
    };

    // If user is admin, return admin-level stats
    const roleName = typeof userRole === 'object' ? userRole.name : userRole;
    if (roleName?.toLowerCase() === 'admin') {
      // Get all vendors and leads for admin
      const [totalVendors, totalLeads, recentVendors, recentLeads] = await Promise.all([
        vendorsCollection.countDocuments({ status: { $ne: 'inactive' } }),
        leadsCollection.countDocuments({}),
        vendorsCollection.aggregate([
          { $match: { status: { $ne: 'inactive' } } },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'userData'
            }
          },
          { $unwind: '$userData' },
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
          {
            $project: {
              businessName: 1,
              'userData.name': 1,
              'userData.email': 1,
              services: 1,
              status: 1,
              createdAt: 1,
              'address.city': 1
            }
          }
        ]).toArray(),
        leadsCollection.find({}, {
          projection: {
            customerName: 1,
            service: 1,
            selectedService: 1,
            status: 1,
            createdAt: 1,
            'address': 1
          }
        }).sort({ createdAt: -1 }).limit(5).toArray()
      ]);

      stats = {
        totalOnboardedVendors: totalVendors,
        totalCreatedLeads: totalLeads,
        recentVendors: recentVendors.map(vendor => ({
          id: vendor._id.toString(),
          businessName: vendor.businessName,
          userName: vendor.userData?.name || 'Unknown',
          email: vendor.userData?.email || '',
          services: vendor.services || [],
          status: vendor.status,
          city: vendor.address?.city || '',
          createdAt: vendor.createdAt
        })),
        recentLeads: recentLeads.map(lead => ({
          id: lead._id.toString(),
          customerName: lead.customerName,
          service: lead.service || lead.selectedService,
          status: lead.status,
          address: lead.address || '',
          createdAt: lead.createdAt
        }))
      };
    } else {
      // For non-admin users, get their specific statistics
      const userObjectId = new ObjectId(userId);

      const [onboardedVendors, createdLeads, recentVendors, recentLeads] = await Promise.all([
        // Count vendors onboarded by this user
        vendorsCollection.countDocuments({ 
          onboardedBy: userObjectId,
          status: { $ne: 'inactive' }
        }),
        
        // Count leads created by this user
        leadsCollection.countDocuments({ 
          createdBy: userObjectId 
        }),
        
        // Get recent vendors onboarded by this user
        vendorsCollection.aggregate([
          { $match: { onboardedBy: userObjectId, status: { $ne: 'inactive' } } },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'userData'
            }
          },
          { $unwind: '$userData' },
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
          {
            $project: {
              businessName: 1,
              'userData.name': 1,
              'userData.email': 1,
              services: 1,
              status: 1,
              createdAt: 1,
              'address.city': 1
            }
          }
        ]).toArray(),
        
        // Get recent leads created by this user
        leadsCollection.find({ 
          createdBy: userObjectId 
        }, {
          projection: {
            customerName: 1,
            service: 1,
            selectedService: 1,
            status: 1,
            createdAt: 1,
            address: 1
          }
        }).sort({ createdAt: -1 }).limit(5).toArray()
      ]);

      stats = {
        totalOnboardedVendors: onboardedVendors,
        totalCreatedLeads: createdLeads,
        recentVendors: recentVendors.map(vendor => ({
          id: vendor._id.toString(),
          businessName: vendor.businessName,
          userName: vendor.userData?.name || 'Unknown',
          email: vendor.userData?.email || '',
          services: vendor.services || [],
          status: vendor.status,
          city: vendor.address?.city || '',
          createdAt: vendor.createdAt
        })),
        recentLeads: recentLeads.map(lead => ({
          id: lead._id.toString(),
          customerName: lead.customerName,
          service: lead.service || lead.selectedService,
          status: lead.status,
          address: lead.address || '',
          createdAt: lead.createdAt
        }))
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: userId,
          role: roleName,
          isAdmin: roleName?.toLowerCase() === 'admin'
        },
        stats
      }
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user statistics',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 