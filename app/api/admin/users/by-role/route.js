import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { requireAdmin } from '@/lib/dal';

// GET /api/admin/users/by-role - Get users by role(s)
export async function GET(request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const rolesParam = searchParams.get('roles'); // Comma-separated role names
    const includeInactive = searchParams.get('includeInactive') === 'true';

    if (!rolesParam) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'roles parameter is required' 
        },
        { status: 400 }
      );
    }

    const roleNames = rolesParam.split(',').map(role => role.trim().toLowerCase());
    console.log('Fetching users for roles:', roleNames);

    const rolesCollection = await database.getRolesCollection();
    const usersCollection = await database.getUsersCollection();

    // Find the role IDs for the specified role names
    const roles = await rolesCollection.find({
      name: { $in: roleNames }
    }).toArray();

    console.log('Found roles:', roles.map(r => ({ id: r._id, name: r.name })));

    if (roles.length === 0) {
      return NextResponse.json({
        success: true,
        users: [],
        message: 'No roles found with the specified names'
      });
    }

    const roleIds = roles.map(role => role._id);

    // Build user query
    const userQuery = {
      role: { $in: roleIds }
    };

    // Optionally filter out inactive users
    if (!includeInactive) {
      userQuery.isActive = { $ne: false }; // Include users where isActive is true or undefined
    }

    console.log('User query:', userQuery);

    // Fetch users with role information
    const users = await usersCollection.aggregate([
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
        $project: {
          _id: 1,
          userId: 1,
          employeeId: 1,
          name: 1,
          email: 1,
          phone: 1,
          profileImage: 1,
          isActive: 1,
          createdAt: 1,
          'roleData.name': 1,
          'roleData.description': 1
        }
      },
      { $sort: { name: 1 } }
    ]).toArray();

    console.log('Found users:', users.length);

    // Format the response
    const formattedUsers = users.map(user => ({
      _id: user._id,
      userId: user.userId,
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      isActive: user.isActive !== false,
      role: {
        name: user.roleData.name,
        description: user.roleData.description
      },
      createdAt: user.createdAt
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      totalUsers: formattedUsers.length,
      roles: roles.map(role => ({
        _id: role._id,
        name: role.name,
        description: role.description
      }))
    });

  } catch (error) {
    console.error('Error fetching users by role:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch users',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 