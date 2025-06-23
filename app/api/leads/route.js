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

// POST /api/leads - Create new lead (optimized for user submissions)
export async function POST(request) {
  try {
    // Connect to database first
    await connectDB();

    const body = await request.json();

    // Fast validation - only check essential fields
    if (!body.customerName?.trim() || !body.customerPhone?.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Name and phone number are required' 
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

    // Quick phone validation
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

    // Optimistic approach - check for duplicate in background, don't block user
    const duplicateCheckPromise = Lead.findOne({
      customerPhone: body.customerPhone.trim(),
      service: body.service.trim(),
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).lean();

    // Create lead object matching new schema
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
      address: body.address?.trim() || `${body.city || ''}, ${body.state || ''}`.trim(),
      
      // Lead Details
      description: body.description?.trim() || body.notes?.trim() || `Service request for ${body.service}`,
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
        reason: 'Lead created from website',
        date: new Date()
      }],
      
      // Refund Request (default state)
      refundRequest: {
        isRequested: false,
        adminResponse: {
          status: 'pending'
        }
      },
      
      // Admin Tracking
      createdBy: null, // Customer submission
      modifiedBy: null
    };

    // Create the lead optimistically
    const newLead = new Lead(leadData);
    const savePromise = newLead.save();

    // Wait for both save and duplicate check
    const [savedLead, existingLead] = await Promise.all([savePromise, duplicateCheckPromise]);

    // If duplicate found after saving, we could log it but still return success
    if (existingLead) {
      console.log(`Duplicate lead detected for phone ${body.customerPhone}, service ${body.service}`);
      // Still return success for better user experience
    }

    // Return optimistic success response
    return NextResponse.json({
      success: true,
      message: 'Your service request has been submitted successfully!',
      leadId: savedLead._id.toString(),
      data: {
        id: savedLead._id.toString(),
        service: savedLead.service,
        selectedService: savedLead.selectedService,
        customerName: savedLead.customerName,
        customerPhone: savedLead.customerPhone,
        status: savedLead.status,
        createdAt: savedLead.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating lead:', error);
    
    // Handle validation errors gracefully
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { 
          success: false, 
          error: `Please check your information: ${validationErrors.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'A similar request was recently submitted. Our team will contact you shortly.' 
        },
        { status: 409 }
      );
    }

    // Handle database connection errors
    if (error.message.includes('connection') || error.message.includes('connect')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Service temporarily unavailable. Please try again in a moment.' 
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Unable to submit your request right now. Please try again in a moment.' 
      },
      { status: 500 }
    );
  }
}

// GET /api/leads - Get leads (optimized for admin use)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Cap at 100
    const status = searchParams.get('status');
    const service = searchParams.get('service');
    const phone = searchParams.get('phone');
    const vendorId = searchParams.get('vendorId');

    // Build optimized query
    const query = {};
    if (status) {
      if (status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else {
        query.status = status;
      }
    }
    if (service) query.service = { $regex: service, $options: 'i' };
    if (phone) query.customerPhone = { $regex: phone.replace(/\D/g, ''), $options: 'i' };
    if (vendorId) query['availableToVendors.vendor'] = vendorId;

    // Optimize query with lean() and selected fields
    const skip = (page - 1) * limit;
    const leads = await Lead.find(query)
      .select('customerName customerPhone customerEmail service selectedService status createdAt address price takenBy availableToVendors')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count efficiently
    const total = await Lead.countDocuments(query);

    // Get aggregated stats efficiently
    const statsPromise = Lead.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = await statsPromise;
    const formattedStats = {
      total,
      pending: stats.find(s => s._id === 'pending')?.count || 0,
      available: stats.find(s => s._id === 'available')?.count || 0,
      assigned: stats.find(s => s._id === 'assigned')?.count || 0,
      taken: stats.find(s => s._id === 'taken')?.count || 0,
      completed: stats.find(s => s._id === 'completed')?.count || 0,
      cancelled: stats.find(s => s._id === 'cancelled')?.count || 0
    };

    return NextResponse.json({
      success: true,
      data: leads,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      stats: formattedStats
    });

  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch leads' 
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods efficiently
export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use POST to create leads.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Leads cannot be deleted via this endpoint.' },
    { status: 405 }
  );
} 