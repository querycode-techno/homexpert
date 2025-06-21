import { NextResponse } from 'next/server'
import { database } from '@/lib/db'
import { requireAdmin } from '@/lib/dal'
import { ObjectId } from 'mongodb'

// GET - Fetch single role by ID
export async function GET(request, { params }) {
  try {
    await requireAdmin()

    const { id } = params

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      )
    }

    const rolesCollection = await database.getRolesCollection()
    const permissionsCollection = await database.getPermissionsCollection()
    const usersCollection = await database.getUsersCollection()

    // Fetch role
    const role = await rolesCollection.findOne({ _id: new ObjectId(id) })

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    // Populate permissions
    if (role.permissions && role.permissions.length > 0) {
      const permissions = await permissionsCollection
        .find({ _id: { $in: role.permissions } })
        .toArray()
      role.permissions = permissions
    } else {
      role.permissions = []
    }

    // Get user count
    const userCount = await usersCollection.countDocuments({ role: role._id })
    role.userCount = userCount

    return NextResponse.json({ role }, { status: 200 })

  } catch (error) {
    console.error('Error fetching role:', error)
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    )
  }
}

// PUT - Update role
export async function PUT(request, { params }) {
  try {
    await requireAdmin()

    const { id } = params
    const { name, description, permissions = [] } = await request.json()

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      )
    }

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      )
    }

    const rolesCollection = await database.getRolesCollection()
    const permissionsCollection = await database.getPermissionsCollection()
    const usersCollection = await database.getUsersCollection()

    // Check if role exists
    const existingRole = await rolesCollection.findOne({ _id: new ObjectId(id) })

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    // Check if system role and prevent certain changes
    if (existingRole.isSystemRole && existingRole.name !== name.trim()) {
      return NextResponse.json(
        { error: 'Cannot change name of system role' },
        { status: 400 }
      )
    }

    // Check if new name conflicts with another role
    if (name.trim().toLowerCase() !== existingRole.name.toLowerCase()) {
      const nameConflict = await rolesCollection.findOne({
        name: name.trim().toLowerCase(),
        _id: { $ne: new ObjectId(id) }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Role with this name already exists' },
          { status: 409 }
        )
      }
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

    // Update role
    const updateData = {
      name: name.trim(),
      description: description?.trim() || '',
      permissions: validPermissions,
      updatedAt: new Date()
    }

    await rolesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    // Fetch updated role with permissions
    const updatedRole = await rolesCollection.findOne({ _id: new ObjectId(id) })
    
    if (validPermissions.length > 0) {
      const rolePermissions = await permissionsCollection
        .find({ _id: { $in: validPermissions } })
        .toArray()
      updatedRole.permissions = rolePermissions
    } else {
      updatedRole.permissions = []
    }

    // Get user count
    const userCount = await usersCollection.countDocuments({ role: updatedRole._id })
    updatedRole.userCount = userCount

    return NextResponse.json(
      {
        message: 'Role updated successfully',
        role: updatedRole
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error updating role:', error)
    
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
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}

// DELETE - Delete role
export async function DELETE(request, { params }) {
  try {
    await requireAdmin()

    const { id } = params

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      )
    }

    const rolesCollection = await database.getRolesCollection()
    const usersCollection = await database.getUsersCollection()

    // Check if role exists
    const role = await rolesCollection.findOne({ _id: new ObjectId(id) })

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of system roles
    if (role.isSystemRole) {
      return NextResponse.json(
        { error: 'Cannot delete system role' },
        { status: 400 }
      )
    }

    // Check if role is assigned to any users
    const userCount = await usersCollection.countDocuments({ role: role._id })

    if (userCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete role. It is assigned to ${userCount} user(s)` },
        { status: 400 }
      )
    }

    // Delete role
    await rolesCollection.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json(
      { message: 'Role deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error deleting role:', error)
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    )
  }
} 