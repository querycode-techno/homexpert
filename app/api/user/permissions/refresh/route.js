import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { PermissionService } from '@/lib/services/permissionService'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = await PermissionService.getUserPermissions(session.user.role.id)
    
    return NextResponse.json({ 
      permissions,
      userId: session.user.id 
    })

  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch permissions' }, 
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    // Get current session
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Refresh permissions using the service
    const permissions = await PermissionService.getUserPermissions(session.user.role.id)
    
    return NextResponse.json({ 
      message: 'Permissions refreshed successfully',
      permissions,
      userId: session.user.id 
    })

  } catch (error) {
    console.error('Error refreshing permissions:', error)
    return NextResponse.json(
      { error: 'Failed to refresh permissions' }, 
      { status: 500 }
    )
  }
} 