import { NextResponse } from 'next/server'
import client from '@/lib/db'
import { requireAdmin } from '@/lib/dal'

// Default permissions structure
const DEFAULT_PERMISSIONS = [
  // Dashboard
  { module: 'dashboard', resource: 'Dashboard', action: 'view' },
  
  // Employee Management
  { module: 'employees', resource: 'Employees', action: 'view' },
  { module: 'employees', resource: 'Employees', action: 'create' },
  { module: 'employees', resource: 'Employees', action: 'update' },
  { module: 'employees', resource: 'Employees', action: 'delete' },
  { module: 'employees', resource: 'Employee Roles', action: 'manage' },
  
  // Booking Management
  { module: 'bookings', resource: 'Bookings', action: 'view' },
  { module: 'bookings', resource: 'Bookings', action: 'create' },
  { module: 'bookings', resource: 'Bookings', action: 'update' },
  { module: 'bookings', resource: 'Bookings', action: 'delete' },
  { module: 'bookings', resource: 'Bookings', action: 'assign' },
  { module: 'bookings', resource: 'Booking Status', action: 'update' },
  
  // Vendor Management
  { module: 'vendors', resource: 'Vendors', action: 'view' },
  { module: 'vendors', resource: 'Vendors', action: 'create' },
  { module: 'vendors', resource: 'Vendors', action: 'update' },
  { module: 'vendors', resource: 'Vendors', action: 'delete' },
  { module: 'vendors', resource: 'Vendor Status', action: 'toggle' },
  { module: 'vendors', resource: 'Vendor Documents', action: 'manage' },
  
  // Lead Management
  { module: 'leads', resource: 'Leads', action: 'view' },
  { module: 'leads', resource: 'Leads', action: 'create' },
  { module: 'leads', resource: 'Leads', action: 'update' },
  { module: 'leads', resource: 'Leads', action: 'delete' },
  { module: 'leads', resource: 'Leads', action: 'assign' },
  { module: 'leads', resource: 'Lead Status', action: 'update' },
  
  // Subscription Management
  { module: 'subscriptions', resource: 'Subscriptions', action: 'view' },
  { module: 'subscriptions', resource: 'Subscriptions', action: 'create' },
  { module: 'subscriptions', resource: 'Subscriptions', action: 'update' },
  { module: 'subscriptions', resource: 'Subscriptions', action: 'delete' },
  { module: 'subscriptions', resource: 'Vendor Subscriptions', action: 'manage' },
  
  // Customer Management
  { module: 'customers', resource: 'Customers', action: 'view' },
  { module: 'customers', resource: 'Customers', action: 'create' },
  { module: 'customers', resource: 'Customers', action: 'update' },
  { module: 'customers', resource: 'Customers', action: 'delete' },
  
  // Reports & Analytics
  { module: 'reports', resource: 'Reports', action: 'view' },
  { module: 'reports', resource: 'Analytics', action: 'view' },
  { module: 'reports', resource: 'Revenue Reports', action: 'view' },
  
  // Settings & Configuration
  { module: 'settings', resource: 'System Settings', action: 'view' },
  { module: 'settings', resource: 'System Settings', action: 'update' },
  { module: 'settings', resource: 'Service Categories', action: 'manage' },
  { module: 'settings', resource: 'Pricing', action: 'manage' },
  
  // System Administration
  { module: 'system', resource: 'system', action: 'role_management' },
  { module: 'system', resource: 'system', action: 'permission_management' },
  { module: 'system', resource: 'system', action: 'user_management' },
  { module: 'system', resource: 'system', action: 'settings' },
  { module: 'system', resource: 'system', action: 'audit_logs' },
  { module: 'system', resource: 'system', action: 'backup_restore' },
  
  // Communication
  { module: 'communication', resource: 'Notifications', action: 'send' },
  { module: 'communication', resource: 'SMS', action: 'send' },
  { module: 'communication', resource: 'Email', action: 'send' },
]

// Default roles with their permissions
const DEFAULT_ROLES = [
  {
    name: 'Admin',
    description: 'Full system access with all permissions',
    isSystemRole: true,
    permissions: 'ALL' // Will be assigned all permissions
  },
  {
    name: 'Helpline',
    description: 'Customer support and booking management',
    isSystemRole: true,
    permissions: [
      'dashboard:view',
      'bookings:view', 'bookings:create', 'bookings:update',
      'customers:view', 'customers:create', 'customers:update',
      'leads:view', 'leads:create', 'leads:update',
      'vendors:view',
      'communication:send'
    ]
  },
  {
    name: 'Telecaller',
    description: 'Lead generation and vendor management',
    isSystemRole: true,
    permissions: [
      'dashboard:view',
      'leads:view', 'leads:create', 'leads:update', 'leads:assign',
      'vendors:view', 'vendors:create', 'vendors:update',
      'bookings:view', 'bookings:assign',
      'subscriptions:view', 'subscriptions:manage',
      'communication:send'
    ]
  },
  {
    name: 'Vendor',
    description: 'Limited access for vendor partners',
    isSystemRole: true,
    permissions: [
      'dashboard:view',
      'bookings:view', 'bookings:update',
      'customers:view'
    ]
  }
]

// POST - Seed permissions and roles
export async function POST(request) {
  try {
    await requireAdmin()

    await client.connect()
    const db = client.db('homexpert')

    let insertedPermissions = 0
    let insertedRoles = 0
    const permissionMap = new Map() // To store permission ID mappings

    // 1. Insert permissions
    console.log('Seeding permissions...')
    for (const permission of DEFAULT_PERMISSIONS) {
      const existing = await db.collection('permissions').findOne({
        module: permission.module,
        resource: permission.resource,
        action: permission.action
      })

      if (!existing) {
        const result = await db.collection('permissions').insertOne({
          ...permission,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        insertedPermissions++
        permissionMap.set(`${permission.module}:${permission.action}`, result.insertedId)
      } else {
        permissionMap.set(`${permission.module}:${permission.action}`, existing._id)
      }
    }

    // Get all permissions for mapping
    const allPermissions = await db.collection('permissions').find({}).toArray()
    allPermissions.forEach(perm => {
      permissionMap.set(`${perm.module}:${perm.action}`, perm._id)
    })

    // 2. Insert roles with permissions
    console.log('Seeding roles...')
    for (const roleData of DEFAULT_ROLES) {
      const existing = await db.collection('roles').findOne({ 
        name: roleData.name.toLowerCase() 
      })

      if (!existing) {
        let rolePermissions = []
        
        if (roleData.permissions === 'ALL') {
          // Admin gets all permissions
          rolePermissions = Array.from(permissionMap.values())
        } else if (Array.isArray(roleData.permissions)) {
          // Map permission strings to ObjectIds
          rolePermissions = roleData.permissions
            .map(permKey => permissionMap.get(permKey))
            .filter(id => id) // Remove undefined IDs
        }

        await db.collection('roles').insertOne({
          name: roleData.name,
          description: roleData.description,
          permissions: rolePermissions,
          isSystemRole: roleData.isSystemRole,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        insertedRoles++
      }
    }

    console.log(`Seeded ${insertedPermissions} permissions and ${insertedRoles} roles`)

    return NextResponse.json(
      {
        message: 'Permissions and roles seeded successfully',
        permissions: {
          total: DEFAULT_PERMISSIONS.length,
          inserted: insertedPermissions,
          skipped: DEFAULT_PERMISSIONS.length - insertedPermissions
        },
        roles: {
          total: DEFAULT_ROLES.length,
          inserted: insertedRoles,  
          skipped: DEFAULT_ROLES.length - insertedRoles
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error seeding permissions:', error)
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to seed permissions and roles' },
      { status: 500 }
    )
  }
}

// GET - Check if permissions are seeded
export async function GET() {
  try {
    await client.connect()
    const db = client.db('homexpert')

    const permissionsCount = await db.collection('permissions').countDocuments()
    const rolesCount = await db.collection('roles').countDocuments()

    return NextResponse.json(
      {
        seeded: permissionsCount > 0,
        permissions: permissionsCount,
        roles: rolesCount
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error checking seed status:', error)
    return NextResponse.json(
      { error: 'Failed to check seed status' },
      { status: 500 }
    )
  }
} 