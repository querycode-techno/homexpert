import cityService from '@/lib/services/cityService'

/**
 * Server-side only utilities for state/city operations
 * These functions should NOT be imported on the client side
 */

/**
 * Get all states from database (server-side only)
 */
export async function getStatesServer() {
  try {
    const result = await cityService.getStates()
    return result.success ? result.data : []
  } catch (error) {
    console.error('Error getting states:', error)
    return []
  }
}

/**
 * Get cities by state from database (server-side only)
 */
export async function getCitiesByStateServer(state) {
  try {
    const result = await cityService.getCitiesByState(state)
    return result.success ? result.data : []
  } catch (error) {
    console.error('Error getting cities by state:', error)
    return []
  }
}

/**
 * Search cities from database (server-side only)
 */
export async function searchCitiesServer(query) {
  try {
    const result = await cityService.searchCities(query)
    return result.success ? result.data : []
  } catch (error) {
    console.error('Error searching cities:', error)
    return []
  }
}

/**
 * Get all cities with pagination (server-side only)
 */
export async function getCitiesServer(params = {}) {
  try {
    const result = await cityService.getCities(params)
    return result.success ? result : { data: [], pagination: {} }
  } catch (error) {
    console.error('Error getting cities:', error)
    return { data: [], pagination: {} }
  }
}

/**
 * Add a new city (server-side only)
 */
export async function addCityServer(state, city) {
  try {
    const result = await cityService.addCity(state, city)
    return result
  } catch (error) {
    console.error('Error adding city:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update a city (server-side only)
 */
export async function updateCityServer(state, city, newCityName) {
  try {
    const result = await cityService.updateCity(state, city, newCityName)
    return result
  } catch (error) {
    console.error('Error updating city:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete a city (server-side only)
 */
export async function deleteCityServer(state, city) {
  try {
    const result = await cityService.deleteCity(state, city)
    return result
  } catch (error) {
    console.error('Error deleting city:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Check if a city exists in a specific state (server-side only)
 */
export async function isCityInStateServer(state, city) {
  try {
    const cities = await getCitiesByStateServer(state)
    return cities.includes(city)
  } catch (error) {
    console.error('Error checking if city is in state:', error)
    return false
  }
}

/**
 * Get the state for a specific city (server-side only)
 */
export async function getStateForCityServer(city) {
  try {
    const result = await cityService.searchCities(city)
    if (result.success && result.data.length > 0) {
      // Find the first match for the exact city name
      const exactMatch = result.data.find(item => 
        item.city.toLowerCase() === city.toLowerCase()
      )
      return exactMatch ? exactMatch.state : null
    }
    return null
  } catch (error) {
    console.error('Error getting state for city:', error)
    return null
  }
}
