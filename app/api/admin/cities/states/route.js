import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import cityService from '@/lib/services/cityService'

// GET - Get all states
export async function GET(request) {
  try {
   // await requireAdmin()
    
    const result = await cityService.getStates()
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in GET /api/admin/cities/states:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
