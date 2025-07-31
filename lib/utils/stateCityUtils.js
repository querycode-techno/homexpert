import { useState, useEffect } from 'react'
import stateCityData from '@/lib/data/StateCity.json'

/**
 * State-City Utility Functions
 * Provides functions to work with Indian states and cities data
 */

/**
 * Get all available states
 * @returns {string[]} Array of state names
 */
export function getStates() {
  return Object.keys(stateCityData).sort((a, b) => a.localeCompare(b))
}

/**
 * Get cities for a specific state
 * @param {string} stateName - Name of the state
 * @returns {string[]} Array of city names for the state
 */
export function getCitiesForState(stateName) {
  if (!stateName || !stateCityData[stateName]) {
    return []
  }
  return stateCityData[stateName].sort((a, b) => a.localeCompare(b))
}

/**
 * Get all cities from all states (for autocomplete/search)
 * @returns {string[]} Array of all city names
 */
export function getAllCities() {
  const allCities = []
  Object.values(stateCityData).forEach(cities => {
    allCities.push(...cities)
  })
  return [...new Set(allCities)].sort((a, b) => a.localeCompare(b)) // Remove duplicates and sort
}

/**
 * Find state for a given city
 * @param {string} cityName - Name of the city
 * @returns {string|null} State name or null if not found
 */
export function getStateForCity(cityName) {
  if (!cityName) return null
  
  for (const [state, cities] of Object.entries(stateCityData)) {
    if (cities.some(city => city.toLowerCase() === cityName.toLowerCase())) {
      return state
    }
  }
  return null
}

/**
 * Validate if a city exists in the given state
 * @param {string} stateName - Name of the state
 * @param {string} cityName - Name of the city
 * @returns {boolean} True if city exists in the state
 */
export function isCityInState(stateName, cityName) {
  if (!stateName || !cityName || !stateCityData[stateName]) {
    return false
  }
  
  return stateCityData[stateName].some(
    city => city.toLowerCase() === cityName.toLowerCase()
  )
}

/**
 * Search cities by partial name (for autocomplete)
 * @param {string} searchTerm - Partial city name
 * @param {string} [stateName] - Optional state to limit search
 * @param {number} [limit=10] - Maximum number of results
 * @returns {Array<{city: string, state: string}>} Array of matching cities with states
 */
export function searchCities(searchTerm, stateName = null, limit = 10) {
  if (!searchTerm || searchTerm.length < 2) {
    return []
  }
  
  const searchLower = searchTerm.toLowerCase()
  const results = []
  
  const statesToSearch = stateName ? [stateName] : Object.keys(stateCityData)
  
  for (const state of statesToSearch) {
    if (!stateCityData[state]) continue
    
    for (const city of stateCityData[state]) {
      if (city.toLowerCase().includes(searchLower)) {
        results.push({ city, state })
        if (results.length >= limit) {
          return results
        }
      }
    }
  }
  
  return results
}

/**
 * Get formatted state-city options for Select components
 * @returns {Array<{value: string, label: string}>} Formatted options
 */
export function getStateOptions() {
  return getStates().map(state => ({
    value: state,
    label: state
  }))
}

/**
 * Get formatted city options for a specific state
 * @param {string} stateName - Name of the state
 * @returns {Array<{value: string, label: string}>} Formatted city options
 */
export function getCityOptions(stateName) {
  return getCitiesForState(stateName).map(city => ({
    value: city,
    label: city
  }))
}

/**
 * React hook for managing state-city selection
 * @returns {object} Hook object with state, cities, and setter functions
 */
export function useStateCitySelection() {
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [availableCities, setAvailableCities] = useState([])
  
  // Update available cities when state changes
  useEffect(() => {
    if (selectedState) {
      setAvailableCities(getCitiesForState(selectedState))
      // Clear city if it's not valid for the new state
      if (selectedCity && !isCityInState(selectedState, selectedCity)) {
        setSelectedCity('')
      }
    } else {
      setAvailableCities([])
      setSelectedCity('')
    }
  }, [selectedState])
  
  const handleStateChange = (newState) => {
    setSelectedState(newState)
  }
  
  const handleCityChange = (newCity) => {
    setSelectedCity(newCity)
  }
  
  const reset = () => {
    setSelectedState('')
    setSelectedCity('')
    setAvailableCities([])
  }
  
  return {
    selectedState,
    selectedCity,
    availableCities,
    allStates: getStates(),
    handleStateChange,
    handleCityChange,
    reset,
    isValidSelection: selectedState && selectedCity && isCityInState(selectedState, selectedCity)
  }
}