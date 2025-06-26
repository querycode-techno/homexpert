import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import { ObjectId } from 'mongodb';

// GET /api/vendors/leads/[id]/notes - Get lead notes
export async function GET(request, { params }) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;
    const leadId = params.id;

    if (!leadId) {
      return NextResponse.json({
        success: false,
        error: 'Lead ID is required'
      }, { status: 400 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    // Get database collections
    const leadsCollection = await database.getLeadsCollection();

    // Get lead and verify access
    const lead = await leadsCollection.findOne({
      _id: new ObjectId(leadId),
      takenBy: new ObjectId(vendorId)
    }, {
      projection: { notes: 1, customerName: 1, service: 1 }
    });

    if (!lead) {
      return NextResponse.json({
        success: false,
        error: 'Lead not found or not accessible'
      }, { status: 404 });
    }

    // Get notes with pagination
    const notes = lead.notes || [];
    const totalNotes = notes.length;
    
    // Sort notes by date (newest first) and paginate
    const paginatedNotes = notes
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(skip, skip + limit);

    // Format notes data
    const formattedNotes = paginatedNotes.map(note => ({
      id: note._id?.toString() || note.date.getTime().toString(),
      note: note.note,
      createdBy: note.createdBy?.toString(),
      date: note.date,
      timeAgo: getTimeAgo(note.date)
    }));

    // Pagination info
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalNotes / limit),
      totalCount: totalNotes,
      hasNextPage: page < Math.ceil(totalNotes / limit),
      hasPrevPage: page > 1
    };

    return NextResponse.json({
      success: true,
      data: {
        leadInfo: {
          id: lead._id.toString(),
          customerName: lead.customerName,
          service: lead.service
        },
        notes: formattedNotes,
        pagination
      }
    });

  } catch (error) {
    console.error('Get lead notes error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch lead notes'
    }, { status: 500 });
  }
}

// POST /api/vendors/leads/[id]/notes - Add note to lead
export async function POST(request, { params }) {
  // Verify authentication
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;
    const leadId = params.id;
    const { note, type = 'general' } = await request.json();

    if (!leadId) {
      return NextResponse.json({
        success: false,
        error: 'Lead ID is required'
      }, { status: 400 });
    }

    if (!note || note.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Note content is required'
      }, { status: 400 });
    }

    if (note.trim().length > 1000) {
      return NextResponse.json({
        success: false,
        error: 'Note content cannot exceed 1000 characters'
      }, { status: 400 });
    }

    // Get database collections
    const leadsCollection = await database.getLeadsCollection();

    // Verify lead access
    const lead = await leadsCollection.findOne({
      _id: new ObjectId(leadId),
      takenBy: new ObjectId(vendorId)
    });

    if (!lead) {
      return NextResponse.json({
        success: false,
        error: 'Lead not found or not accessible'
      }, { status: 404 });
    }

    const now = new Date();

    // Create note object
    const noteData = {
      _id: new ObjectId(),
      note: note.trim(),
      type: type,
      createdBy: new ObjectId(vendorId),
      date: now
    };

    // Add note to lead
    const result = await leadsCollection.updateOne(
      { _id: new ObjectId(leadId) },
      {
        $push: { notes: noteData },
        $set: { 
          modifiedBy: new ObjectId(userId),
          updatedAt: now 
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to add note'
      }, { status: 500 });
    }

    // Return the created note
    return NextResponse.json({
      success: true,
      message: 'Note added successfully',
      data: {
        note: {
          id: noteData._id.toString(),
          note: noteData.note,
          type: noteData.type,
          createdBy: noteData.createdBy.toString(),
          date: noteData.date,
          timeAgo: 'just now'
        },
        leadInfo: {
          id: lead._id.toString(),
          customerName: lead.customerName,
          service: lead.service
        }
      }
    });

  } catch (error) {
    console.error('Add lead note error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add note'
    }, { status: 500 });
  }
}

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
} 