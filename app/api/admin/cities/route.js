import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/dal';
import fs from 'fs/promises';
import path from 'path';

const CITIES_FILE_PATH = path.join(process.cwd(), 'lib/data/StateCity.json');

// GET - Get all cities with pagination and filtering
export async function GET(request) {
  try {
    await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const search = searchParams.get('search') || '';
    const state = searchParams.get('state') || '';
    
    // Read current cities data
    const citiesData = JSON.parse(await fs.readFile(CITIES_FILE_PATH, 'utf8'));
    
    // Filter cities based on search and state
    let filteredCities = [];
    Object.entries(citiesData).forEach(([stateName, cities]) => {
      if (!state || stateName.toLowerCase().includes(state.toLowerCase())) {
        cities.forEach(city => {
          if (!search || city.toLowerCase().includes(search.toLowerCase())) {
            filteredCities.push({ state: stateName, city });
          }
        });
      }
    });
    
    // Sort by state, then by city
    filteredCities.sort((a, b) => {
      if (a.state !== b.state) {
        return a.state.localeCompare(b.state);
      }
      return a.city.localeCompare(b.city);
    });
    
    // Pagination
    const total = filteredCities.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCities = filteredCities.slice(startIndex, endIndex);
    
    return NextResponse.json({
      success: true,
      data: paginatedCities,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: endIndex < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Add new city
export async function POST(request) {
  try {
    await requireAdmin();
    
    const { state, city } = await request.json();
    
    if (!state || !city) {
      return NextResponse.json(
        { success: false, error: 'State and city are required' },
        { status: 400 }
      );
    }
    
    // Validate city name
    if (city.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'City name cannot be empty' },
        { status: 400 }
      );
    }
    
    // Read current data
    const citiesData = JSON.parse(await fs.readFile(CITIES_FILE_PATH, 'utf8'));
    
    // Check if state exists
    if (!citiesData[state]) {
      return NextResponse.json(
        { success: false, error: 'State not found' },
        { status: 400 }
      );
    }
    
    // Check if city already exists
    if (citiesData[state].includes(city.trim())) {
      return NextResponse.json(
        { success: false, error: 'City already exists in this state' },
        { status: 400 }
      );
    }
    
    // Add city
    citiesData[state].push(city.trim());
    citiesData[state].sort(); // Keep sorted
    
    // Write back to file
    await fs.writeFile(CITIES_FILE_PATH, JSON.stringify(citiesData, null, 2));
    
    return NextResponse.json({
      success: true,
      message: `City "${city.trim()}" added to "${state}" successfully`,
      data: { state, city: city.trim() }
    });
  } catch (error) {
    console.error('Error adding city:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
