import { NextResponse } from 'next/server'
import cityService from '@/lib/services/cityService'

// GET - Get all states (public endpoint)
export async function GET(request) {
  try {
    const result = await cityService.getStates()

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
    console.error('Error in GET /api/vendor/states:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch states' },
      { status: 500 }
    )
  }
}
