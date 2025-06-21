import { cache } from 'react'
import { auth } from '@/auth.js'
import { redirect } from 'next/navigation'
import client from './db'
import { ADMINISTRATIVE_ROLES, hasAdminAccess } from '@/lib/constants'

// Verify session with caching for performance
export const verifySession = cache(async () => {
  const session = await auth()
  
  if (!session || !session.user) {
    return null
  }

  return session
})

// Get user data with authentication check
export const getUser = cache(async () => {
  const session = await verifySession()

  if (!session) {
    return null
  }

  try {
    // Connect to MongoDB
    await client.connect()
    const db = client.db('homexpert')
    
    // Get user data using the session
    const userData = await db.collection('users').findOne(
      { email: session.user.email },
      {
        projection: {
          _id: 1,
          userId: 1,
          name: 1,
          email: 1,
          role: 1,
          profile: 1,
          phone: 1,
          dateOfBirth: 1,
          gender: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    )

    return userData
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return null
  }
})

// Check if user has specific role
export const requireRole = cache(async (requiredRole) => {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  // Get role information
  try {
    await client.connect()
    const db = client.db('homexpert')
    
    const role = await db.collection('roles').findOne(
      { _id: user.role }
    )

    if (!role || role.name !== requiredRole) {
      redirect('/unauthorized')
    }

    return { user, role }
  } catch (error) {
    console.error('Failed to verify role:', error)
    redirect('/auth/signin')
  }
})

// Admin-only access
export const requireAdmin = cache(async () => {
  try {
    const session = await verifySession()
    if (!session) {
      throw new Error('Access denied: No session found')
    }

    // Check if user has administrative role using cached session data
    const userRole = session.user.role
    if (!userRole || !hasAdminAccess(userRole)) {
      throw new Error('Access denied: Administrative role required')
    }

    return { 
      user: session.user, 
      role: userRole,
      permissions: session.user.permissions || []
    }
  } catch (error) {
    console.error('Admin access denied:', error)
    throw new Error('Unauthorized: Admin access required')
  }
})

// Protected route wrapper
export const protectedRoute = cache(async () => {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  return user
}) 