import { NextResponse } from 'next/server'
import client from '@/lib/db'
import { requireAdmin } from '@/lib/dal'

// GET - Fetch all permissions
export async function GET(request) {
  try {
    console.log('🔍 Permissions API - Starting request')
    
    // Check admin access
    await requireAdmin()
    console.log('✅ Permissions API - Admin access verified')

    await client.connect()
    const db = client.db('homexpert')
    console.log('✅ Permissions API - Database connected')

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const groupBy = searchParams.get('groupBy') || 'module'
    const search = searchParams.get('search') || ''
    console.log('📋 Permissions API - Query params:', { groupBy, search })

    // Build query
    let query = {}
    if (search) {
      query = {
        $or: [
          { module: { $regex: search, $options: 'i' } },
          { action: { $regex: search, $options: 'i' } },
          { resource: { $regex: search, $options: 'i' } }
        ]
      }
    }

    // Fetch permissions
    const permissions = await db.collection('permissions')
      .find(query)
      .sort({ module: 1, resource: 1, action: 1 })
      .toArray()
    
    console.log('📊 Permissions API - Found permissions:', permissions.length)

    // Group permissions if requested
    let groupedPermissions = permissions
    if (groupBy === 'module') {
      groupedPermissions = permissions.reduce((acc, permission) => {
        const module = permission.module
        if (!acc[module]) {
          acc[module] = []
        }
        acc[module].push(permission)
        return acc
      }, {})
    } else if (groupBy === 'resource') {
      groupedPermissions = permissions.reduce((acc, permission) => {
        const resource = permission.resource
        if (!acc[resource]) {
          acc[resource] = []
        }
        acc[resource].push(permission)
        return acc
      }, {})
    }

    const response = {
      permissions: groupedPermissions,
      total: permissions.length,
      grouped: groupBy !== 'none'
    }

    console.log('✅ Permissions API - Response ready:', Object.keys(response))
    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ Permissions API - Error:', error)
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch permissions', details: error.message },
      { status: 500 }
    )
  }
} 