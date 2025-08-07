import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/dal';
import fs from 'fs/promises';
import path from 'path';

const CITIES_FILE_PATH = path.join(process.cwd(), 'lib/data/StateCity.json');

// PUT - Update city name
export async function PUT(request, { params }) {
  try {
    await requireAdmin();
    
    const { state, city } = params;
    const { newCityName } = await request.json();
    
    if (!newCityName || newCityName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'New city name is required' },
        { status: 400 }
      );
    }
    
    // Read current data
    const citiesData = JSON.parse(await fs.readFile(CITIES_FILE_PATH, 'utf8'));
    
    // Check if state and city exist
    if (!citiesData[state] || !citiesData[state].includes(city)) {
      return NextResponse.json(
        { success: false, error: 'State or city not found' },
        { status: 404 }
      );
    }
    
    // Check if new name already exists
    if (citiesData[state].includes(newCityName.trim())) {
      return NextResponse.json(
        { success: false, error: 'City with this name already exists' },
        { status: 400 }
      );
    }
    
    // Update city name
    const cityIndex = citiesData[state].indexOf(city);
    citiesData[state][cityIndex] = newCityName.trim();
    citiesData[state].sort(); // Keep sorted
    
    // Write back to file
    await fs.writeFile(CITIES_FILE_PATH, JSON.stringify(citiesData, null, 2));
    
    return NextResponse.json({
      success: true,
      message: `City "${city}" updated to "${newCityName.trim()}" successfully`,
      data: { state, oldCity: city, newCity: newCityName.trim() }
    });
  } catch (error) {
    console.error('Error updating city:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove city
export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    
    const { state, city } = params;
    
    // Read current data
    const citiesData = JSON.parse(await fs.readFile(CITIES_FILE_PATH, 'utf8'));
    
    // Check if state and city exist
    if (!citiesData[state] || !citiesData[state].includes(city)) {
      return NextResponse.json(
        { success: false, error: 'State or city not found' },
        { status: 404 }
      );
    }
    
    // Remove city
    citiesData[state] = citiesData[state].filter(c => c !== city);
    
    // Write back to file
    await fs.writeFile(CITIES_FILE_PATH, JSON.stringify(citiesData, null, 2));
    
    return NextResponse.json({
      success: true,
      message: `City "${city}" removed from "${state}" successfully`,
      data: { state, city }
    });
  } catch (error) {
    console.error('Error deleting city:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
