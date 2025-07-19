import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { requireAdmin } from '@/lib/dal';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// GET /api/admin/employee - Get all employees (exclude vendors by role)
export async function GET(request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit')) || 10));
    const search = searchParams.get('search')?.trim() || '';
    const role = searchParams.get('role')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';

    const usersCollection = await database.getUsersCollection();
    const rolesCollection = await database.getRolesCollection();

    // Get vendor role to exclude vendors
    const vendorRole = await rolesCollection.findOne({ name: 'vendor' });
    if (!vendorRole) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Vendor role not found in system' 
        },
        { status: 500 }
      );
    }

    // Build query conditions - CRITICAL: Always exclude vendor role
    const queryConditions = [
      { role: { $ne: vendorRole._id } } // Always exclude vendors
    ];
    
    // Filter by specific role if provided (but never allow vendor role)
    if (role && ObjectId.isValid(role)) {
      const requestedRoleId = new ObjectId(String(role));
      // Double check that the requested role is not vendor role
      if (!requestedRoleId.equals(vendorRole._id)) {
        queryConditions.push({ role: requestedRoleId });
      }
    }

    // Filter by status if specified
    if (status) {
      queryConditions.push({ status: status });
    }
    
    // Handle search across multiple fields
    if (search) {
      queryConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Combine all conditions with $and
    const query = queryConditions.length > 1 ? { $and: queryConditions } : queryConditions[0];

    // Get total count for pagination (using same query)
    const total = await usersCollection.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit) || 1;
    
    // If requested page exceeds total pages, redirect to last page
    const actualPage = Math.min(page, totalPages);
    const actualSkip = (actualPage - 1) * limit;

    const hasNextPage = actualPage < totalPages;
    const hasPrevPage = actualPage > 1;

    // Get employees (using same query with corrected pagination)
    const employees = await usersCollection
      .find(query, { projection: { password: 0 } }) // Exclude password
      .sort({ createdAt: -1 })
      .skip(actualSkip)
      .limit(limit)
      .toArray();

    // Populate role information
    for (let employee of employees) {
      if (employee.role) {
        const roleData = await rolesCollection.findOne(
          { _id: employee.role },
          { projection: { name: 1, description: 1 } }
        );
        employee.role = roleData;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        employees,
        pagination: {
          currentPage: actualPage,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('Error fetching employees:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch employees',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/employee - Create new employee (no vendors allowed)
export async function POST(request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { name, email, phone, password, role, address, profileImage } = body;

    // Validation
    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: name, email, phone, password, role' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email format' 
        },
        { status: 400 }
      );
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid phone format' 
        },
        { status: 400 }
      );
    }

    // Validate role ID
    if (!ObjectId.isValid(role)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid role ID format' 
        },
        { status: 400 }
      );
    }

    const usersCollection = await database.getUsersCollection();
    const rolesCollection = await database.getRolesCollection();

    // Get vendor role to ensure it's not assigned to employees
    const vendorRole = await rolesCollection.findOne({ name: 'vendor' });
    if (!vendorRole) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Vendor role not found in system' 
        },
        { status: 500 }
      );
    }

    // Check if role exists and is not vendor role
    const roleExists = await rolesCollection.findOne({ _id: new ObjectId(String(role)) });
    if (!roleExists) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid role specified' 
        },
        { status: 400 }
      );
    }

    // Prevent vendor role assignment in employee creation
    if (roleExists._id.equals(vendorRole._id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot assign vendor role to employee. Use vendor management instead.' 
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email already exists' 
        },
        { status: 409 }
      );
    }

    // Check if phone already exists 
    const existingPhone = await usersCollection.findOne({ phone });
 
    if (existingPhone) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Phone number already exists' 
        },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user data
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
      role: new ObjectId(String(role)),
      address: address || {},
      profileImage: profileImage || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create new employee
    const result = await usersCollection.insertOne(userData);

    // Fetch the created employee with role information
    const newEmployee = await usersCollection.findOne(
      { _id: result.insertedId },
      { projection: { password: 0 } }
    );

    // Populate role information
    if (newEmployee.role) {
      const roleData = await rolesCollection.findOne(
        { _id: newEmployee.role },
        { projection: { name: 1, description: 1 } }
      );
      newEmployee.role = roleData;
    }

    return NextResponse.json({
      success: true,
      message: 'Employee created successfully',
      data: newEmployee
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating employee:', error);

    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        { 
          success: false, 
          error: `${field} already exists` 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create employee',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 