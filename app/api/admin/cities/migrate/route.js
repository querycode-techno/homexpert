import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import connectDB from '@/lib/connnectDB'
import City from '@/lib/models/City'
import citiesData from '@/lib/data/StateCity.json'

// POST - Run city migration
export async function POST(request) {
  try {
    await requireAdmin()
    
    //console.log('Starting city migration via API...')
    
    await connectDB()
    //console.log('Connected to database')

    // Clear existing cities
    await City.deleteMany({})
    //console.log('Cleared existing cities')

    const citiesToInsert = []
    const skippedCities = []
    const processedCities = new Set()

    // Convert JSON structure to database format and handle duplicates
    for (const [state, cities] of Object.entries(citiesData)) {
      for (const city of cities) {
        const cityKey = `${state.trim()}-${city.trim()}`
        
        // Check if we've already processed this state-city combination
        if (processedCities.has(cityKey)) {
          skippedCities.push({ state: state.trim(), city: city.trim() })
          continue
        }
        
        processedCities.add(cityKey)
        citiesToInsert.push({
          state: state.trim(),
          city: city.trim(),
          isActive: true
        })
      }
    }

    // Insert cities in batches with error handling
    const batchSize = 1000
    let insertedCount = 0
    let duplicateCount = 0

    for (let i = 0; i < citiesToInsert.length; i += batchSize) {
      const batch = citiesToInsert.slice(i, i + batchSize)
      
      try {
        const result = await City.insertMany(batch, { 
          ordered: false, // Continue inserting even if some fail
          rawResult: true 
        })
        
        insertedCount += result.insertedCount || batch.length
        //console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${result.insertedCount || batch.length} cities`)
        
        // If there were write errors (duplicates), count them
        if (result.writeErrors) {
          duplicateCount += result.writeErrors.length
          //console.log(`Skipped ${result.writeErrors.length} duplicates in batch ${Math.floor(i / batchSize) + 1}`)
        }
        
      } catch (error) {
        console.error(`Error in batch ${Math.floor(i / batchSize) + 1}:`, error.message)
        
        // If it's a bulk write error, try inserting one by one
        if (error.code === 11000 || error.name === 'BulkWriteError') {
          for (const city of batch) {
            try {
              await City.create(city)
              insertedCount++
            } catch (insertError) {
              if (insertError.code === 11000) {
                duplicateCount++
                //console.log(`Skipped duplicate: ${city.state} - ${city.city}`)
              } else {
                console.error(`Error inserting city ${city.city}:`, insertError.message)
              }
            }
          }
        }
      }
    }

    //console.log(`Migration completed: ${insertedCount} cities inserted, ${duplicateCount} duplicates skipped`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedCount} cities. ${duplicateCount} duplicates were skipped.`,
      count: insertedCount,
      duplicates: duplicateCount
    })
  } catch (error) {
    console.error('Error in POST /api/admin/cities/migrate:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
