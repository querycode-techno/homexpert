import { NextResponse } from 'next/server'
import cityService from '@/lib/services/cityService'

// GET - Get cities with pagination and filtering (public endpoint)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 100 // Higher limit for mobile
    const search = searchParams.get('search') || ''
    const state = searchParams.get('state') || ''
    
    const result = await cityService.getCities(page, limit, search, state)

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in GET /api/vendor/cities:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cities' },
      { status: 500 }
    )
  }
}
