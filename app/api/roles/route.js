import { NextResponse } from 'next/server'
import { database } from '@/lib/db'
import { requireAdmin } from '@/lib/dal'
import { ObjectId } from 'mongodb'

// GET - Fetch all roles with permissions
export async function GET(request) {
  try {
    console.log('🔍 Roles API - Starting request')
    
    await requireAdmin()
    console.log('✅ Roles API - Admin access verified')

    const rolesCollection = await database.getRolesCollection()
    const permissionsCollection = await database.getPermissionsCollection()
    const usersCollection = await database.getUsersCollection()
    console.log('✅ Roles API - Database connected')

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const includePermissions = searchParams.get('includePermissions') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    console.log('📋 Roles API - Query params:', { includePermissions, page, limit, search })

    // Build query
    let query = {}
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }
    }

    // Count total documents
    const total = await rolesCollection.countDocuments(query)
    console.log('📊 Roles API - Total roles:', total)

    // Fetch roles with pagination
    let rolesQuery = rolesCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const roles = await rolesQuery.toArray()
    console.log('📊 Roles API - Found roles:', roles.length)

    // If includePermissions is true, populate permissions
    let rolesWithPermissions = roles
    if (includePermissions) {
      for (let role of roles) {
        if (role.permissions && role.permissions.length > 0) {
          const permissions = await permissionsCollection
            .find({ _id: { $in: role.permissions } })
            .toArray()
          role.permissions = permissions
        } else {
          role.permissions = []
        }
      }
      rolesWithPermissions = roles
    }

    // Get user count for each role
    for (let role of rolesWithPermissions) {
      const userCount = await usersCollection.countDocuments({ role: role._id })
      role.userCount = userCount
    }

    const response = {
      roles: rolesWithPermissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }

    console.log('✅ Roles API - Response ready:', Object.keys(response))
    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ Roles API - Error:', error)
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}

// POST - Create new role
export async function POST(request) {
  try {
    await requireAdmin()

    const { name, description, permissions = [], isSystemRole = false } = await request.json()

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      )
    }

    const rolesCollection = await database.getRolesCollection()
    const permissionsCollection = await database.getPermissionsCollection()

    // Check if role already exists
    const existingRole = await rolesCollection.findOne({ 
      name: name.trim().toLowerCase() 
    })

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 409 }
      )
    }

    // Validate permission IDs if provided
    let validPermissions = []
    if (permissions.length > 0) {
      const permissionObjectIds = permissions.map(id => {
        try {
          return new ObjectId(id)
        } catch {
          throw new Error(`Invalid permission ID: ${id}`)
        }
      })

      const foundPermissions = await permissionsCollection
        .find({ _id: { $in: permissionObjectIds } })
        .toArray()

      if (foundPermissions.length !== permissions.length) {
        return NextResponse.json(
          { error: 'Some permission IDs are invalid' },
          { status: 400 }
        )
      }

      validPermissions = permissionObjectIds
    }

    // Create role
    const roleData = {
      name: name.trim(),
      description: description?.trim() || '',
      permissions: validPermissions,
      isSystemRole: Boolean(isSystemRole),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await rolesCollection.insertOne(roleData)

    // Fetch the created role with permissions
    const createdRole = await rolesCollection.findOne({ _id: result.insertedId })
    
    if (validPermissions.length > 0) {
      const rolePermissions = await permissionsCollection
        .find({ _id: { $in: validPermissions } })
        .toArray()
      createdRole.permissions = rolePermissions
    } else {
      createdRole.permissions = []
    }

    createdRole.userCount = 0

    return NextResponse.json(
      {
        message: 'Role created successfully',
        role: createdRole
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating role:', error)
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    if (error.message.includes('Invalid permission ID')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    )
  }
} 