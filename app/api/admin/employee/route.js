import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { requireAdmin } from '@/lib/dal';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// GET /api/admin/employee - Get all employees
export async function GET(request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    const usersCollection = await database.getUsersCollection();
    const rolesCollection = await database.getRolesCollection();

    // Build query
    let query = {};
    
    // Search across multiple fields
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by role if specified
    if (role && ObjectId.isValid(role)) {
      query.role = new ObjectId(String(role));
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await usersCollection.countDocuments(query);

    // Get employees
    const employees = await usersCollection
      .find(query, { projection: { password: 0 } }) // Exclude password
      .sort({ createdAt: -1 })
      .skip(skip)
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

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        employees,
        pagination: {
          currentPage: page,
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

// POST /api/admin/employee - Create new employee
export async function POST(request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { name, email, phone, password, role, address, profileImage, type } = body;

    // Validation
    if (!name || !email || !phone || !password || !role || !type) {
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

    // Check if role exists
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
      updatedAt: new Date(),
      type:type,
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