import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Lead from '@/lib/models/lead';

// Ensure mongoose connection
async function connectDB() {
  if (mongoose.connections[0].readyState) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Database connection failed');
  }
}

// GET /api/leads/old-unassigned - Get unassigned leads older than 3 days
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const daysOld = parseInt(searchParams.get('daysOld') || '3');

    // Calculate the date threshold (3 days ago by default)
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysOld);

    // Build query for unassigned leads older than specified days
    const query = {
      status: 'pending',
      createdAt: { $lt: dateThreshold },
      $or: [
        { 'availableToVendors.vendor': { $size: 0 } },
        { 'availableToVendors.vendor': { $exists: false } }
      ]
    };

    // Get leads with pagination
    const skip = (page - 1) * limit;
    const leads = await Lead.find(query)
      .select('customerName customerPhone customerEmail service selectedService status createdAt address description')
      .sort({ createdAt: 1 }) // Oldest first
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Lead.countDocuments(query);

    // Calculate days old for each lead
    const leadsWithDaysOld = leads.map(lead => ({
      ...lead,
      daysOld: Math.floor((Date.now() - new Date(lead.createdAt)) / (1000 * 60 * 60 * 24))
    }));

    // Get summary stats
    const summaryStats = await Lead.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          averageDaysOld: { $avg: { $divide: [{ $subtract: [new Date(), '$createdAt'] }, 1000 * 60 * 60 * 24] } },
          oldestLead: { $min: '$createdAt' },
          newestLead: { $max: '$createdAt' }
        }
      }
    ]);

    const stats = summaryStats[0] || {
      totalCount: 0,
      averageDaysOld: 0,
      oldestLead: null,
      newestLead: null
    };

    return NextResponse.json({
      success: true,
      data: leadsWithDaysOld,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      stats: {
        totalUnassignedOld: stats.totalCount,
        averageDaysOld: Math.round(stats.averageDaysOld * 100) / 100,
        oldestLead: stats.oldestLead,
        newestLead: stats.newestLead,
        dateThreshold: dateThreshold
      }
    });

  } catch (error) {
    console.error('Error fetching old unassigned leads:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch old unassigned leads' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/old-unassigned - Delete old unassigned leads
export async function DELETE(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { leadIds, reason, deleteAll } = body;

    let leadsToDelete = [];
    let query = {};

    if (deleteAll || !leadIds || leadIds.length === 0) {
      // Delete all old unassigned leads
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      query = {
        status: 'pending',
        createdAt: { $lt: threeDaysAgo },
        $or: [
          { 'availableToVendors.vendor': { $size: 0 } },
          { 'availableToVendors.vendor': { $exists: false } }
        ]
      };

      leadsToDelete = await Lead.find(query);
    } else {
      // Delete specific leads
      if (!Array.isArray(leadIds)) {
        return NextResponse.json(
          { success: false, error: 'Lead IDs must be an array' },
          { status: 400 }
        );
      }

      // Verify leads are actually old and unassigned before deletion
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      query = {
        _id: { $in: leadIds },
        status: 'pending',
        createdAt: { $lt: threeDaysAgo },
        $or: [
          { 'availableToVendors.vendor': { $size: 0 } },
          { 'availableToVendors.vendor': { $exists: false } }
        ]
      };

      leadsToDelete = await Lead.find(query);
    }

    if (leadsToDelete.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No eligible leads found for deletion' },
        { status: 400 }
      );
    }

    // Delete the leads
    const deleteResult = await Lead.deleteMany(query);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.deletedCount} old unassigned leads`,
      deletedCount: deleteResult.deletedCount,
      reason: reason || 'Automatic cleanup of old unassigned leads',
      deletedAll: deleteAll || false
    });

  } catch (error) {
    console.error('Error deleting old unassigned leads:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete old unassigned leads' 
      },
      { status: 500 }
    );
  }
}
