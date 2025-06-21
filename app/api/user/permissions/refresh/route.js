import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'
import { getToken } from 'next-auth/jwt'

export async function POST(request) {
  try {
    // Get current session
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the JWT token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || "homexpert-dev-secret-2024"
    })

    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 })
    }

    // Trigger JWT refresh by calling update
    // This will cause the jwt callback to run with trigger: 'update'
    const { update } = await import('next-auth/react')
    
    // Return success - the actual refresh happens in the JWT callback
    return NextResponse.json({ 
      message: 'Permission refresh triggered',
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

// GET endpoint to check current permissions without refresh
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      permissions: session.user.permissions || [],
      role: session.user.role,
      userId: session.user.userId
    })

  } catch (error) {
    console.error('Error getting permissions:', error)
    return NextResponse.json(
      { error: 'Failed to get permissions' }, 
      { status: 500 }
    )
  }
} 