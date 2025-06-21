import { NextResponse } from 'next/server'
import client from '@/lib/db'

export async function GET() {
  try {
    await client.connect()
    const db = client.db('homexpert')
    
    // Check if any admin user exists
    const adminRole = await db.collection('roles').findOne({ name: 'admin' })
    
    if (!adminRole) {
      return NextResponse.json({
        needsSetup: true,
        reason: 'No admin role found'
      })
    }
    
    const adminUser = await db.collection('users').findOne({ role: adminRole._id })
    
    return NextResponse.json({
      needsSetup: !adminUser,
      reason: adminUser ? 'Admin exists' : 'No admin user found'
    })
    
  } catch (error) {
    console.error('Setup check error:', error)
    return NextResponse.json(
      { error: 'Failed to check setup status' },
      { status: 500 }
    )
  }
} 