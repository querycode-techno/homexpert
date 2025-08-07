import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import cityService from '@/lib/services/cityService'

// PUT - Update city name
export async function PUT(request, { params }) {
  try {
    await requireAdmin()
    
    const { state, city } = params
    const { newCityName } = await request.json()
    
    if (!newCityName || newCityName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'New city name is required' },
        { status: 400 }
      )
    }
    
    const result = await cityService.updateCity(state, city, newCityName)
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in PUT /api/admin/cities/[state]/[city]:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete city
export async function DELETE(request, { params }) {
  try {
    await requireAdmin()
    
    const { state, city } = params
    
    const result = await cityService.deleteCity(state, city)
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in DELETE /api/admin/cities/[state]/[city]:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
