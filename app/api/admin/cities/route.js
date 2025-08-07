import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import cityService from '@/lib/services/cityService'

// GET - Get all cities with pagination and filtering
export async function GET(request) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 50
    const search = searchParams.get('search') || ''
    const state = searchParams.get('state') || ''
    
    const result = await cityService.getCities(page, limit, search, state)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in GET /api/admin/cities:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Add a new city
export async function POST(request) {
  try {
    await requireAdmin()
    
    const { state, city } = await request.json()
    
    if (!state || !city) {
      return NextResponse.json(
        { success: false, error: 'State and city are required' },
        { status: 400 }
      )
    }
    
    const result = await cityService.addCity(state, city)
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in POST /api/admin/cities:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
