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

// Proper CSV parser that handles quoted fields
const parseCSV = (csvText) => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV must have headers and at least one data row');
  }

  // Parse a single CSV line handling quoted fields
  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Handle escaped quotes
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i]);
    if (row.length === headers.length) {
      rows.push(row);
    }
  }

  return { headers, rows };
};

// Validate phone number
const validatePhone = (phone) => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleanPhone);
};

// POST /api/admin/leads/import - Simple CSV import
export async function POST(request) {
  try {
    await requireAdmin();
    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file');
    const options = JSON.parse(formData.get('options') || '{}');

    if (!file || !file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid CSV file' },
        { status: 400 }
      );
    }

    const csvText = await file.text();
    const { headers, rows } = parseCSV(csvText);

    // Map headers to expected fields - exact matches first, then flexible
    const headerMap = {};
    headers.forEach((header, index) => {
      const lower = header.toLowerCase().trim();
      
      // Exact matches for template/export fields
      if (lower === 'customer name') headerMap.customerName = index;
      else if (lower === 'phone number') headerMap.customerPhone = index;
      else if (lower === 'email address') headerMap.customerEmail = index;
      else if (lower === 'service') headerMap.service = index;
      else if (lower === 'sub service') headerMap.selectedSubService = index;
      else if (lower === 'address') headerMap.address = index;
      else if (lower === 'description') headerMap.description = index;
      else if (lower === 'price') headerMap.price = index;
      else if (lower === 'preferred date') headerMap.preferredDate = index;
      else if (lower === 'preferred time') headerMap.preferredTime = index;
      
      // Flexible matches as fallback
      else if (lower.includes('name') && lower.includes('customer')) headerMap.customerName = index;
      else if (lower.includes('phone') || lower.includes('mobile')) headerMap.customerPhone = index;
      else if (lower.includes('email')) headerMap.customerEmail = index;
      else if (lower.includes('service') && !lower.includes('sub')) headerMap.service = index;
      else if (lower.includes('sub') && lower.includes('service')) headerMap.selectedSubService = index;
      else if (lower.includes('address')) headerMap.address = index;
      else if (lower.includes('description')) headerMap.description = index;
      else if (lower.includes('price')) headerMap.price = index;
      else if (lower.includes('date') && lower.includes('preferred')) headerMap.preferredDate = index;
      else if (lower.includes('time') && lower.includes('preferred')) headerMap.preferredTime = index;
    });

    // Check required fields
    const required = ['customerName', 'customerPhone', 'service', 'address'];
    const missing = required.filter(field => headerMap[field] === undefined);
    
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required columns: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const results = {
      total: rows.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Account for header row

      try {
        // Extract data
        const customerName = row[headerMap.customerName]?.trim();
        const customerPhone = row[headerMap.customerPhone]?.trim();
        const customerEmail = row[headerMap.customerEmail]?.trim() || undefined;
        const service = row[headerMap.service]?.trim();
        const selectedSubService = row[headerMap.selectedSubService]?.trim() || undefined;
        const address = row[headerMap.address]?.trim();
        const description = row[headerMap.description]?.trim() || `Service request for ${service}`;
        const price = row[headerMap.price] ? Number(row[headerMap.price]) : undefined;
        const preferredDate = row[headerMap.preferredDate] ? new Date(row[headerMap.preferredDate]) : undefined;
        const preferredTime = row[headerMap.preferredTime]?.trim() || undefined;

        // Basic validation
        if (!customerName) {
          results.errors.push(`Row ${rowNum}: Customer name is required`);
          results.failed++;
          continue;
        }

        if (!validatePhone(customerPhone)) {
          results.errors.push(`Row ${rowNum}: Invalid phone number`);
          results.failed++;
          continue;
        }

        if (!service) {
          results.errors.push(`Row ${rowNum}: Service is required`);
          results.failed++;
          continue;
        }

        if (!address) {
          results.errors.push(`Row ${rowNum}: Address is required`);
          results.failed++;
          continue;
        }

                 // Check for duplicates (same as main API) - only if not skipping
         if (!options.skipDuplicates) {
           const existingLead = await Lead.findOne({
             customerPhone: customerPhone,
             service: service,
             createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
           }).lean();

           if (existingLead) {
             results.errors.push(`Row ${rowNum}: Duplicate lead (similar lead exists within 24 hours)`);
             results.failed++;
             continue;
           }
         }

                 // Create lead (following exact structure from main API)
         const leadData = {
           customerName,
           customerPhone,
           customerEmail,
           service,
           selectedService: service, // Same as service for imports
           selectedSubService,
           address,
           description,
           price: price && !isNaN(price) ? price : undefined,
           getQuote: !price || isNaN(price),
           preferredDate,
           preferredTime,
           status: 'pending',
           availableToVendors: { vendor: [] },
           followUps: [],
           notes: [],
           leadProgressHistory: [{
             toStatus: 'pending',
             reason: 'Lead imported from CSV',
             date: new Date()
           }],
           refundRequest: {
             isRequested: false,
             adminResponse: { status: 'pending' }
           },
           // Add createdBy if provided in options
           createdBy: options.createdBy && mongoose.Types.ObjectId.isValid(options.createdBy) 
             ? new mongoose.Types.ObjectId(options.createdBy) 
             : undefined,
           modifiedBy: options.createdBy && mongoose.Types.ObjectId.isValid(options.createdBy) 
             ? new mongoose.Types.ObjectId(options.createdBy) 
             : undefined
         };

        const newLead = new Lead(leadData);
        await newLead.save();
        
        results.successful++;

      } catch (error) {
        results.errors.push(`Row ${rowNum}: ${error.message}`);
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${results.successful} successful, ${results.failed} failed`,
      results
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { success: false, error: 'Import failed: ' + error.message },
      { status: 500 }
    );
  }
}

// GET /api/admin/leads/import - Get import template
export async function GET() {
  try {
    await requireAdmin();

    const template = `Customer Name,Phone Number,Email Address,Service,Sub Service,Address,Description,Price,Preferred Date,Preferred Time
John Doe,9876543210,john@example.com,Plumbing,Pipe Repair,123 Main St Delhi,Kitchen sink repair,500,2024-01-15,10:00 AM`;

    return new NextResponse(template, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="leads-import-template.csv"'
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to generate template' },
      { status: 500 }
    );
  }
} 