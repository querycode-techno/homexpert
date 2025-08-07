import connectDB from '../connnectDB.js'
import City from '../models/City.js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') })

export async function importCitiesFromJSON() {
  try {
    await connectDB()
    //console.log('Connected to database')

    // Read JSON file
    const jsonPath = path.join(__dirname, '../data/StateCity.json')
    const jsonData = await fs.readFile(jsonPath, 'utf8')
    const citiesData = JSON.parse(jsonData)

    // Clear existing cities
    await City.deleteMany({})
    //console.log('Cleared existing cities')

    const citiesToInsert = []

    // Convert JSON structure to database format
    for (const [state, cities] of Object.entries(citiesData)) {
      for (const city of cities) {
        citiesToInsert.push({
          state: state.trim(),
          city: city.trim(),
          isActive: true
        })
      }
    }

    // Insert cities in batches
    const batchSize = 1000
    for (let i = 0; i < citiesToInsert.length; i += batchSize) {
      const batch = citiesToInsert.slice(i, i + batchSize)
      await City.insertMany(batch, { ordered: false })
      //console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}`)
    }

    //console.log(`Successfully imported ${citiesToInsert.length} cities`)
    return { success: true, count: citiesToInsert.length }
  } catch (error) {
    console.error('Error importing cities:', error)
    return { success: false, error: error.message }
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importCitiesFromJSON()
    .then(result => {
      if (result.success) {
        //console.log('Migration completed successfully')
        process.exit(0)
      } else {
        console.error('Migration failed:', result.error)
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}
