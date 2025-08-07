/**
 * City Service - Handles all city-related database operations
 */

import City from '@/lib/models/City'
import connectDB from '@/lib/connnectDB'

// Cache system
class CityCache {
  constructor() {
    this.cache = new Map()
    this.statesCache = null
    this.statesCacheTime = null
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
  }

  // Generate cache key for cities
  getCitiesKey(params = {}) {
    const { page = 1, limit = 50, search = '', state = '' } = params
    return `cities:${page}:${limit}:${search}:${state}`
  }

  // Generate cache key for states
  getStatesKey() {
    return 'states:all'
  }

  // Get cached data
  get(key) {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  // Set cache data
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  // Clear all cache
  clear() {
    this.cache.clear()
    this.statesCache = null
    this.statesCacheTime = null
  }

  // Clear cities cache
  clearCities() {
    const keysToDelete = []
    for (const key of this.cache.keys()) {
      if (key.startsWith('cities:')) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  // Clear states cache
  clearStates() {
    this.statesCache = null
    this.statesCacheTime = null
  }
}

// Global cache instance
const cityCache = new CityCache()

class CityService {
  async getCities(page = 1, limit = 50, search = '', state = '') {
    try {
      await connectDB()
      
      // Check cache first
      const cacheKey = cityCache.getCitiesKey({ page, limit, search, state })
      const cached = cityCache.get(cacheKey)
      if (cached) {
        console.log('Returning cached cities data')
        return cached
      }

      const query = { isActive: true }
      
      // Add state filter if provided
      if (state && state !== 'all') {
        query.state = state
      }
      
      // Add search filter if provided
      if (search) {
        // Use case-insensitive regex search instead of text search
        query.$or = [
          { state: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } }
        ]
      }

      const skip = (page - 1) * limit
      
      const [cities, total] = await Promise.all([
        City.find(query)
          .sort({ state: 1, city: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        City.countDocuments(query)
      ])

      const result = {
        success: true,
        data: cities,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }

      // Cache the result
      cityCache.set(cacheKey, result)
      
      return result
    } catch (error) {
      console.error('Error in getCities:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getStates() {
    try {
      await connectDB()
      
      // Check cache first
      if (cityCache.statesCache && cityCache.statesCacheTime) {
        if (Date.now() - cityCache.statesCacheTime < cityCache.cacheTimeout) {
          console.log('Returning cached states data')
          return cityCache.statesCache
        }
      }

      const states = await City.distinct('state', { isActive: true })
      const sortedStates = states.sort()

      const result = {
        success: true,
        data: sortedStates
      }

      // Cache the result
      cityCache.statesCache = result
      cityCache.statesCacheTime = Date.now()
      
      return result
    } catch (error) {
      console.error('Error in getStates:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async addCity(state, city) {
    try {
      await connectDB()
      
      const newCity = new City({
        state: state.trim(),
        city: city.trim(),
        isActive: true
      })
      
      await newCity.save()
      
      // Clear cache after adding new city
      cityCache.clearCities()
      cityCache.clearStates()
      
      return {
        success: true,
        data: newCity
      }
    } catch (error) {
      console.error('Error in addCity:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async updateCity(oldState, oldCity, newState, newCity) {
    try {
      await connectDB()
      
      const updatedCity = await City.findOneAndUpdate(
        { state: oldState, city: oldCity },
        { 
          state: newState.trim(),
          city: newCity.trim()
        },
        { new: true }
      )
      
      if (!updatedCity) {
        return {
          success: false,
          error: 'City not found'
        }
      }
      
      // Clear cache after updating city
      cityCache.clearCities()
      cityCache.clearStates()
      
      return {
        success: true,
        data: updatedCity
      }
    } catch (error) {
      console.error('Error in updateCity:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async deleteCity(state, city) {
    try {
      await connectDB()
      
      const deletedCity = await City.findOneAndUpdate(
        { state: state, city: city },
        { isActive: false },
        { new: true }
      )
      
      if (!deletedCity) {
        return {
          success: false,
          error: 'City not found'
        }
      }
      
      // Clear cache after deleting city
      cityCache.clearCities()
      cityCache.clearStates()
      
      return {
        success: true,
        data: deletedCity
      }
    } catch (error) {
      console.error('Error in deleteCity:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getCitiesByState(state) {
    try {
      await connectDB()
      
      const cities = await City.find({ 
        state: state, 
        isActive: true 
      })
      .sort({ city: 1 })
      .lean()
      
      return {
        success: true,
        data: cities
      }
    } catch (error) {
      console.error('Error in getCitiesByState:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async searchCities(query) {
    try {
      await connectDB()
      
      const cities = await City.find({
        $or: [
          { state: { $regex: query, $options: 'i' } },
          { city: { $regex: query, $options: 'i' } }
        ],
        isActive: true
      })
      .sort({ state: 1, city: 1 })
      .limit(50)
      .lean()
      
      return {
        success: true,
        data: cities
      }
    } catch (error) {
      console.error('Error in searchCities:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Method to manually clear cache (for admin purposes)
  clearCache() {
    cityCache.clear()
    return {
      success: true,
      message: 'Cache cleared successfully'
    }
  }

  // Method to get cache statistics
  getCacheStats() {
    return {
      cacheSize: cityCache.cache.size,
      statesCached: !!cityCache.statesCache,
      cacheTimeout: cityCache.cacheTimeout
    }
  }
}

const cityService = new CityService()
export default cityService
