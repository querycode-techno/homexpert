/**
 * Client-safe utilities for state/city operations
 * These functions use API calls instead of direct database access
 */

/**
 * Get state options for select dropdowns (client-safe)
 */
export async function getStateOptions() {
  try {
    // Use API call instead of direct database access for client-side safety
    const response = await fetch('/api/admin/cities/states', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch states`)
    }

    const result = await response.json()
    
    if (result.success) {
      return result.data.map(state => ({
        value: state,
        label: state
      }))
    } else {
      console.error('Error fetching states:', result.error)
      return []
    }
  } catch (error) {
    console.error('Error getting state options:', error)
    return []
  }
}

/**
 * Get city options for select dropdowns by state (client-safe)
 */
export async function getCityOptions(state) {
  try {
    if (!state) return []
    
    // Use API call instead of direct database access for client-side safety
    const response = await fetch(`/api/admin/cities?state=${encodeURIComponent(state)}&limit=1000`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch cities`)
    }

    const result = await response.json()
    
    if (result.success) {
      return result.data.map(city => ({
        value: city.city,
        label: city.city
      }))
    } else {
      console.error('Error fetching cities:', result.error)
      return []
    }
  } catch (error) {
    console.error('Error getting city options:', error)
    return []
  }
}

/**
 * Get cities for a specific state (client-safe)
 */
export async function getCitiesForState(state) {
  try {
    if (!state) return []
    
    const response = await fetch(`/api/admin/cities?state=${encodeURIComponent(state)}&limit=1000`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch cities`)
    }

    const result = await response.json()
    
    if (result.success) {
      return result.data.map(city => city.city)
    } else {
      console.error('Error fetching cities:', result.error)
      return []
    }
  } catch (error) {
    console.error('Error getting cities for state:', error)
    return []
  }
}

/**
 * Search cities (client-safe)
 */
export async function searchCities(query) {
  try {
    const response = await fetch(`/api/admin/cities?search=${encodeURIComponent(query)}&limit=50`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to search cities`)
    }

    const result = await response.json()
    
    if (result.success) {
      return result.data.map(city => ({
        state: city.state,
        city: city.city,
        id: city.id
      }))
    } else {
      console.error('Error searching cities:', result.error)
      return []
    }
  } catch (error) {
    console.error('Error searching cities:', error)
    return []
  }
}

/**
 * Check if a city exists in a specific state (client-safe)
 */
export async function isCityInState(state, city) {
  try {
    const cities = await getCitiesForState(state)
    return cities.includes(city)
  } catch (error) {
    console.error('Error checking if city is in state:', error)
    return false
  }
}

/**
 * Get the state for a specific city (client-safe)
 */
export async function getStateForCity(city) {
  try {
    const cities = await searchCities(city)
    if (cities.length > 0) {
      // Find the first match for the exact city name
      const exactMatch = cities.find(item => 
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