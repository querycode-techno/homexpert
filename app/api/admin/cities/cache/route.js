import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import cityService from '@/lib/services/cityService'

export async function GET(request) {
  try {
    // Check admin permissions
    await requireAdmin()
    
    // Get cache statistics
    const stats = cityService.getCacheStats()
    
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get cache statistics' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    // Check admin permissions
    await requireAdmin()
    
    // Clear cache
    const result = cityService.clearCache()
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}
