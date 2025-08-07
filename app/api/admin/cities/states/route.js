import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/dal';
import fs from 'fs/promises';
import path from 'path';

const CITIES_FILE_PATH = path.join(process.cwd(), 'lib/data/StateCity.json');

// GET - Get all states
export async function GET(request) {
  try {
    await requireAdmin();
    
    // Read current cities data
    const citiesData = JSON.parse(await fs.readFile(CITIES_FILE_PATH, 'utf8'));
    
    // Get all states and sort them
    const states = Object.keys(citiesData).sort((a, b) => a.localeCompare(b));
    
    return NextResponse.json({
      success: true,
      data: states
    });
  } catch (error) {
    console.error('Error fetching states:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
