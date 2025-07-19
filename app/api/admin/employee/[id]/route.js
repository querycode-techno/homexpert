import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { requireAdmin } from '@/lib/dal';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// GET /api/admin/employee/[id] - Get single employee (no vendors)
export async function GET(request, { params }) {
  try {
    await requireAdmin();

    const { id } = params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid employee ID format' 
        },
        { status: 400 }
      );
    }

    const usersCollection = await database.getUsersCollection();
    const rolesCollection = await database.getRolesCollection();

    // Get vendor role to ensure we don't return vendor users
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

    // Find employee by ID (exclude vendors)
    const employee = await usersCollection.findOne(
      { 
        _id: new ObjectId(String(id)),
        role: { $ne: vendorRole._id }
      },
      { projection: { password: 0 } }
    );

    if (!employee) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Employee not found' 
        },
        { status: 404 }
      );
    }

    // Populate role information
    if (employee.role) {
      const roleData = await rolesCollection.findOne(
        { _id: employee.role },
        { projection: { name: 1, description: 1, permissions: 1 } }
      );
      employee.role = roleData;
    }

    return NextResponse.json({
      success: true,
      data: employee
    });

  } catch (error) {
    console.error('Error fetching employee:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch employee',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/employee/[id] - Update employee
export async function PUT(request, { params }) {
  try {
    await requireAdmin();

    const { id } = params;
    const body = await request.json();

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid employee ID format' 
        },
        { status: 400 }
      );
    }

    const usersCollection = await database.getUsersCollection();
    const rolesCollection = await database.getRolesCollection();

    // Check if employee exists
    const existingEmployee = await usersCollection.findOne({ _id: new ObjectId(String(id)) });
    if (!existingEmployee) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Employee not found' 
        },
        { status: 404 }
      );
    }

    const { name, email, phone, password, role, address, profileImage, status } = body;

    // Validate required fields (name, email, phone are required)
    if (!name || !email || !phone) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: name, email, phone' 
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

    // Validate phone format
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

    // If role is being updated, validate it exists and is not vendor role
    if (role && role !== existingEmployee.role.toString()) {
      if (!ObjectId.isValid(role)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid role ID format' 
          },
          { status: 400 }
        );
      }

      // Get vendor role to prevent assignment
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

      // Prevent vendor role assignment in employee update
      if (roleExists._id.equals(vendorRole._id)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot assign vendor role to employee. Use vendor management instead.' 
          },
          { status: 400 }
        );
      }
    }

    // Check if email is being changed and if it already exists
    if (email.toLowerCase() !== existingEmployee.email) {
      const existingEmail = await usersCollection.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: new ObjectId(String(id)) } 
      });
      if (existingEmail) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Email already exists' 
          },
          { status: 409 }
        );
      }
    }

    // Check if phone is being changed and if it already exists
    if (phone !== existingEmployee.phone) {
      const existingPhone = await usersCollection.findOne({ 
        phone,
        _id: { $ne: new ObjectId(String(id)) } 
      });
      if (existingPhone) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Phone number already exists' 
          },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      role: role ? new ObjectId(String(role)) : existingEmployee.role,
      address: address || existingEmployee.address,
      profileImage: profileImage !== undefined ? profileImage : existingEmployee.profileImage,
      updatedAt: new Date(),
      status: status,
    };

    // If password is provided, hash it
    if (password && password.trim()) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(password.trim(), saltRounds);
    }

    // Update employee
    await usersCollection.updateOne(
      { _id: new ObjectId(String(id)) },
      { $set: updateData }
    );

    // Fetch updated employee
    const updatedEmployee = await usersCollection.findOne(
      { _id: new ObjectId(String(id)) },
      { projection: { password: 0 } }
    );

    // Populate role information
    if (updatedEmployee.role) {
      const roleData = await rolesCollection.findOne(
        { _id: updatedEmployee.role },
        { projection: { name: 1, description: 1 } }
      );
      updatedEmployee.role = roleData;
    }

    if (!updatedEmployee) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update employee' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    });

  } catch (error) {
    console.error('Error updating employee:', error);

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
        error: 'Failed to update employee',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/employee/[id] - Delete employee
export async function DELETE(request, { params }) {
  try {
    await requireAdmin();

    const { id } = params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid employee ID format' 
        },
        { status: 400 }
      );
    }

    const usersCollection = await database.getUsersCollection();
    const rolesCollection = await database.getRolesCollection();

    // Check if employee exists
    const employee = await usersCollection.findOne({ _id: new ObjectId(String(id)) });
    if (!employee) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Employee not found' 
        },
        { status: 404 }
      );
    }

    // Get role name for response
    let roleName = null;
    if (employee.role) {
      const roleData = await rolesCollection.findOne(
        { _id: employee.role },
        { projection: { name: 1 } }
      );
      roleName = roleData?.name;
    }

    // Optional: Check if employee can be deleted (e.g., if they have dependencies)
    // You might want to check for related records like assignments, tasks, etc.
    
    // Perform soft delete or hard delete based on your business logic
    // For this example, we'll do a hard delete
    const deleteResult = await usersCollection.deleteOne({ _id: new ObjectId(String(id)) });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to delete employee' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully',
      data: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        employeeId: employee.employeeId,
        role: roleName
      }
    });

  } catch (error) {
    console.error('Error deleting employee:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete employee',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 