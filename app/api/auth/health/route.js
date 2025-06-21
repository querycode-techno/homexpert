import { NextResponse } from 'next/server'
import client from '@/lib/db'

export async function GET() {
  try {
    // Test database connection
    await client.connect()
    const db = client.db('homexpert')
    
    // Simple ping to check connection
    await db.admin().ping()
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 