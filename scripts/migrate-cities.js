#!/usr/bin/env node

import { importCitiesFromJSON } from '../lib/migrations/importCities.js'

//console.log('Starting city migration...')
//console.log('This will import all cities from StateCity.json into the database')

importCitiesFromJSON()
  .then(result => {
    if (result.success) {
      //console.log(`✅ Migration completed successfully!`)
      //console.log(`📊 Imported ${result.count} cities`)
      process.exit(0)
    } else {
      console.error(`❌ Migration failed: ${result.error}`)
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })
