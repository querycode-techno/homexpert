"use client"

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export function useAuth() {
  const { data: session, status } = useSession()
  const [permissions, setPermissions] = useState([])
  const [permissionsLoading, setPermissionsLoading] = useState(false)

  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'

  // Fetch permissions when session is available
  useEffect(() => {
    if (isAuthenticated && session?.user?.role?.id) {
      fetchPermissions()
    }
  }, [isAuthenticated, session?.user?.role?.id])

  const fetchPermissions = async () => {
    if (!session?.user?.role?.id) return

    setPermissionsLoading(true)
    try {
      const response = await fetch('/api/user/permissions/refresh')
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.permissions || [])
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    } finally {
      setPermissionsLoading(false)
    }
  }

  const hasPermission = (permission) => {
    return permissions.some(p => 
      `${p.module}.${p.action}` === permission || 
      `${p.module}.${p.resource}` === permission
    )
  }

  const canAccessRoute = (route) => {
    // Basic route access logic - can be enhanced
    if (!isAuthenticated) return false
    
    // Admin routes
    if (route.startsWith('/admin')) {
      const userRole = session?.user?.role?.name
      return ['admin', 'super_admin', 'regional_manager'].includes(userRole)
    }
    
    return true
  }

  return {
    user: session?.user || null,
    isLoading,
    isAuthenticated,
    permissions,
    permissionsLoading,
    hasPermission,
    canAccessRoute,
    refreshPermissions: fetchPermissions
  }
} 