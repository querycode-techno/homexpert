import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { permissionCache } from '@/lib/permissionCache'
import { PermissionService } from '@/lib/services/permissionService'

export async function POST(request) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { userId } = await request.json()
    const targetUserId = userId || session.user.id

    // Clear permission cache for the user
    permissionCache.clear(targetUserId)
    
    // Fetch fresh permissions from database
    const roleId = session.user.role?._id || session.user.role
    const freshPermissions = await PermissionService.getUserPermissions(roleId)
    
    console.log('Refreshed permissions for user:', targetUserId)
    console.log('Fresh permissions:', freshPermissions)
    
    return NextResponse.json({
      success: true,
      message: 'Permissions refreshed successfully',
      permissions: freshPermissions
    })
    
  } catch (error) {
    console.error('Error refreshing permissions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to refresh permissions' },
      { status: 500 }
    )
  }
} 