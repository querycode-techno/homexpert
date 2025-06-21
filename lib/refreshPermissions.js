import { permissionCache } from './permissionCache'

/**
 * Refresh permissions for a specific user or all users
 * @param {string|null} userId - User ID to refresh permissions for, or null for all users
 * @returns {Promise<boolean>} - Success status
 */
export async function refreshUserPermissions(userId = null) {
  try {
    if (userId) {
      // Clear cache for specific user
      permissionCache.clear(userId)
      
      // Call API to refresh permissions
      const response = await fetch('/api/user/permissions/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to refresh permissions: ${response.status}`)
      }
      
      return true
    } else {
      // Clear all cache
      permissionCache.clear()
      
      // For bulk refresh, we'll let users refresh on their next request
      console.log('Cleared all permission cache - users will refresh on next request')
      return true
    }
  } catch (error) {
    console.error('Error refreshing user permissions:', error)
    return false
  }
}

/**
 * Check if permissions are cached for a user
 * @param {string} userId - User ID to check
 * @returns {boolean} - Whether permissions are cached
 */
export function hasPermissionsInCache(userId) {
  return permissionCache.has(userId)
}

/**
 * Get cached permissions for a user
 * @param {string} userId - User ID
 * @returns {Array|null} - Cached permissions or null
 */
export function getCachedPermissions(userId) {
  return permissionCache.get(userId)
}

/**
 * Get cache statistics
 * @returns {object} - Cache stats
 */
export function getPermissionCacheStats() {
  return {
    size: permissionCache.size(),
    duration: permissionCache.CACHE_DURATION,
    lastCleanup: new Date().toISOString()
  }
}

export default refreshUserPermissions 