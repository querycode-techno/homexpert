class PermissionCache {
  constructor() {
    this.cache = new Map()
    this.expiry = new Map()
    this.CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  }

  set(userId, permissions) {
    if (!userId) return
    this.cache.set(userId, permissions)
    this.expiry.set(userId, Date.now() + this.CACHE_DURATION)
  }

  get(userId) {
    if (!userId || !this.cache.has(userId)) return null
    
    const expiryTime = this.expiry.get(userId)
    if (Date.now() > expiryTime) {
      this.cache.delete(userId)
      this.expiry.delete(userId)
      return null
    }
    
    return this.cache.get(userId)
  }

  clear(userId = null) {
    if (userId) {
      this.cache.delete(userId)
      this.expiry.delete(userId)
    } else {
      // Clear all cache
      this.cache.clear()
      this.expiry.clear()
    }
  }

  has(userId) {
    if (!userId) return false
    return this.cache.has(userId) && Date.now() <= this.expiry.get(userId)
  }

  size() {
    return this.cache.size
  }

  // Clean expired entries
  cleanup() {
    const now = Date.now()
    for (const [userId, expiryTime] of this.expiry.entries()) {
      if (now > expiryTime) {
        this.cache.delete(userId)
        this.expiry.delete(userId)
      }
    }
  }
}

// Create singleton instance
export const permissionCache = new PermissionCache()

// Auto cleanup every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    permissionCache.cleanup()
  }, 10 * 60 * 1000)
}

export default permissionCache 