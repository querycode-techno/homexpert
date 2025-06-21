import { NextResponse } from 'next/server';
import client from '@/lib/db';

// GET /api/health - Health check endpoint
export async function GET(request) {
  const startTime = Date.now();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'HomeXpert API',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    checks: {}
  };

  try {
    // Check database connectivity
    await client.connect();
    const db = client.db('homexpert');
    
    // Perform a simple query to verify database is working
    const dbStart = Date.now();
    await db.admin().ping();
    const dbTime = Date.now() - dbStart;

    // Get basic database stats
    const stats = await db.stats();
    const collections = await db.listCollections().toArray();
    
    health.checks.database = {
      status: 'healthy',
      responseTime: `${dbTime}ms`,
      collections: collections.length,
      dbSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)}MB`
    };

    // Check collections exist
    const requiredCollections = ['users', 'roles', 'permissions'];
    const existingCollections = collections.map(col => col.name);
    const missingCollections = requiredCollections.filter(col => !existingCollections.includes(col));

    if (missingCollections.length > 0) {
      health.checks.collections = {
        status: 'warning',
        message: `Missing collections: ${missingCollections.join(', ')}`,
        existing: existingCollections.length,
        required: requiredCollections.length
      };
    } else {
      health.checks.collections = {
        status: 'healthy',
        message: 'All required collections exist',
        count: existingCollections.length
      };
    }

    // Check data integrity
    const permissionCount = await db.collection('permissions').countDocuments();
    const roleCount = await db.collection('roles').countDocuments();
    const userCount = await db.collection('users').countDocuments();

    health.checks.data = {
      status: (permissionCount > 0 && roleCount > 0) ? 'healthy' : 'warning',
      permissions: permissionCount,
      roles: roleCount,
      users: userCount,
      seeded: permissionCount > 0 && roleCount > 0
    };

  } catch (error) {
    console.error('Database health check failed:', error);
    health.status = 'unhealthy';
    health.checks.database = {
      status: 'unhealthy',
      error: error.message,
      code: error.code || 'DATABASE_ERROR'
    };
  }

  // Check environment variables
  const requiredEnvVars = ['MONGODB_URI', 'NEXTAUTH_SECRET'];
  const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);

  health.checks.environment = {
    status: missingEnvVars.length === 0 ? 'healthy' : 'warning',
    required: requiredEnvVars.length,
    missing: missingEnvVars.length,
    ...(missingEnvVars.length > 0 && { missingVars: missingEnvVars })
  };

  // Check memory usage
  const memUsage = process.memoryUsage();
  health.checks.memory = {
    status: 'healthy',
    used: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
    total: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
    external: `${(memUsage.external / 1024 / 1024).toFixed(2)}MB`
  };

  // Overall response time
  const responseTime = Date.now() - startTime;
  health.responseTime = `${responseTime}ms`;

  // Determine overall status
  const hasUnhealthy = Object.values(health.checks).some(check => check.status === 'unhealthy');
  const hasWarnings = Object.values(health.checks).some(check => check.status === 'warning');

  if (hasUnhealthy) {
    health.status = 'unhealthy';
  } else if (hasWarnings) {
    health.status = 'degraded';
  }

  // Return appropriate HTTP status code
  const statusCode = health.status === 'healthy' ? 200 : 
                    health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}

// Simple HEAD request for basic uptime checks
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
} 