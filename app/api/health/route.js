import { NextResponse } from 'next/server';
import { database } from '@/lib/database-utils';
import Lead from '@/lib/models/lead';

// GET /api/health - Health check endpoint
export async function GET() {
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };

    // Test database connection
    try {
      await database.connect();
      health.database = 'connected';
      
      // Test lead model
      const leadCount = await Lead.countDocuments();
      health.leadModel = 'working';
      health.totalLeads = leadCount;
      
    } catch (dbError) {
      health.database = 'error';
      health.databaseError = dbError.message;
    }

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
}

// Simple HEAD request for basic uptime checks
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
} 