import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAdmin } from '@/lib/dal';
import Lead from '@/lib/models/lead';

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

// Format date for CSV
const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

// Escape CSV values
const escapeCSV = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// POST /api/admin/leads/export - Simple CSV export
export async function POST(request) {
  try {
    await requireAdmin();
    await connectDB();

    const body = await request.json();
    const { filters = {} } = body;

    // Build simple query
    let query = {};
    
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    
    if (filters.service && filters.service !== 'all') {
      query.service = new RegExp(filters.service, 'i');
    }
    
    if (filters.search) {
      const searchRegex = new RegExp(filters.search.trim(), 'i');
      query.$or = [
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { customerEmail: searchRegex },
        { service: searchRegex },
        { address: searchRegex }
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) {
        query.createdAt.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    // Get leads
    const leads = await Lead.find(query)
      .populate('takenBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    if (leads.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No leads found matching the criteria'
      }, { status: 404 });
    }

    // Create CSV headers (matching import template exactly)
    const headers = [
      'Customer Name',
      'Phone Number', 
      'Email Address',
      'Service',
      'Sub Service',
      'Address',
      'Description',
      'Price',
      'Preferred Date',
      'Preferred Time'
    ];

    let csvContent = headers.join(',') + '\n';

    // Add data rows
    for (const lead of leads) {
      const row = [
        escapeCSV(lead.customerName || ''),
        escapeCSV(lead.customerPhone || ''),
        escapeCSV(lead.customerEmail || ''),
        escapeCSV(lead.service || ''),
        escapeCSV(lead.selectedSubService || ''),
        escapeCSV(lead.address || ''),
        escapeCSV(lead.description || ''),
        escapeCSV(lead.price || ''),
        escapeCSV(formatDate(lead.preferredDate)),
        escapeCSV(lead.preferredTime || '')
      ];
      
      csvContent += row.join(',') + '\n';
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `leads-export-${timestamp}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(csvContent, 'utf8').toString(),
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Export failed: ' + error.message },
      { status: 500 }
    );
  }
}

// GET /api/admin/leads/export - Get import template
export async function GET() {
  try {
    await requireAdmin();

    const template = `Customer Name,Phone Number,Email Address,Service,Sub Service,Address,Description,Price,Preferred Date,Preferred Time
John Doe,9876543210,john@example.com,Plumbing,Pipe Repair,123 Main St Delhi,Kitchen sink repair,500,2024-01-15,10:00 AM`;

    return new NextResponse(template, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="leads-import-template.csv"',
      },
    });

  } catch (error) {
    console.error('Template error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate template' },
      { status: 500 }
    );
  }
} 