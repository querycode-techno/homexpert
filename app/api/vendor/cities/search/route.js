import { NextResponse } from 'next/server'
import cityService from '@/lib/services/cityService'

// GET - Search cities with autocomplete optimization (public endpoint)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit')) || 20 // Smaller limit for autocomplete
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }
    
    const result = await cityService.searchCities(query, limit)

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in GET /api/vendor/cities/search:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search cities' },
      { status: 500 }
    )
  }
}
