"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { PERMISSIONS, PermissionManager } from "@/lib/permissions"
import { permissionCache } from "@/lib/permissionCache"
import { isAdministrativeRole } from "@/lib/constants"

export function usePermissions() {
  const { data: session, status, update } = useSession()
  const [permissions, setPermissions] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Get permissions from session with caching
  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true)
      return
    }

    if (session?.user) {
      const userId = session.user.id || session.user.userId

      // Try cache first for additional performance
      const cachedPermissions = permissionCache.get(userId)
      if (cachedPermissions) {
        setPermissions(cachedPermissions)
        setIsLoading(false)
        return
      }

      // Get permissions from session (now cached in JWT)
      if (session.user.permissions) {
        setPermissions(session.user.permissions)
        // Cache permissions for future use
        permissionCache.set(userId, session.user.permissions)
        setIsLoading(false)
      } else {
        // If no permissions in session, set empty array
        setPermissions([])
        setIsLoading(false)
      }
    } else {
      setPermissions([])
      setIsLoading(false)
    }
  }, [session, status])

  // Create permission manager instance
  const permissionManager = useMemo(() => {
    const userRole = session?.user?.role?.name?.toLowerCase() || 'user'
    const userPermissions = permissions.map(p => `${p.module}:${p.action}`) || []
    return new PermissionManager(userRole, userPermissions)
  }, [session, permissions])

  // Permission checking functions using the existing permission system
  const hasPermission = useMemo(() => {
    return (permission) => {
      return permissionManager.hasPermission(permission)
    }
  }, [permissionManager])

  const hasAnyPermission = useMemo(() => {
    return (permissionList) => {
      return permissionManager.hasAnyPermission(permissionList)
    }
  }, [permissionManager])

  const hasAllPermissions = useMemo(() => {
    return (permissionList) => {
      return permissionManager.hasAllPermissions(permissionList)
    }
  }, [permissionManager])

  const canAccess = useMemo(() => {
    return (route) => {
      return permissionManager.canAccessRoute(route)
    }
  }, [permissionManager])

  // Common permission groups for convenience using existing permission constants
  const can = useMemo(() => ({
    // Dashboard
    viewDashboard: hasPermission(PERMISSIONS.DASHBOARD.VIEW),
    viewAnalytics: hasPermission(PERMISSIONS.DASHBOARD.ANALYTICS),
    
    // Employees
    viewEmployees: hasPermission(PERMISSIONS.EMPLOYEES.VIEW),
    createEmployees: hasPermission(PERMISSIONS.EMPLOYEES.CREATE),
    editEmployees: hasPermission(PERMISSIONS.EMPLOYEES.EDIT),
    deleteEmployees: hasPermission(PERMISSIONS.EMPLOYEES.DELETE),
    
    // Bookings
    viewBookings: hasPermission(PERMISSIONS.BOOKINGS.VIEW),
    createBookings: hasPermission(PERMISSIONS.BOOKINGS.CREATE),
    editBookings: hasPermission(PERMISSIONS.BOOKINGS.EDIT),
    deleteBookings: hasPermission(PERMISSIONS.BOOKINGS.DELETE),
    assignBookings: hasPermission(PERMISSIONS.BOOKINGS.ASSIGN),
    
    // Vendors
    viewVendors: hasPermission(PERMISSIONS.VENDORS.VIEW),
    createVendors: hasPermission(PERMISSIONS.VENDORS.CREATE),
    editVendors: hasPermission(PERMISSIONS.VENDORS.EDIT),
    deleteVendors: hasPermission(PERMISSIONS.VENDORS.DELETE),
    activateVendors: hasPermission(PERMISSIONS.VENDORS.ACTIVATE),
    deactivateVendors: hasPermission(PERMISSIONS.VENDORS.DEACTIVATE),
    
    // Leads
    viewLeads: hasPermission(PERMISSIONS.LEADS.VIEW),
    createLeads: hasPermission(PERMISSIONS.LEADS.CREATE),
    editLeads: hasPermission(PERMISSIONS.LEADS.EDIT),
    deleteLeads: hasPermission(PERMISSIONS.LEADS.DELETE),
    assignLeads: hasPermission(PERMISSIONS.LEADS.ASSIGN),
    
    // Subscriptions
    viewSubscriptions: hasPermission(PERMISSIONS.SUBSCRIPTIONS.VIEW),
    createSubscriptions: hasPermission(PERMISSIONS.SUBSCRIPTIONS.CREATE),
    editSubscriptions: hasPermission(PERMISSIONS.SUBSCRIPTIONS.EDIT),
    deleteSubscriptions: hasPermission(PERMISSIONS.SUBSCRIPTIONS.DELETE),
    manageVendorSubscriptions: hasPermission(PERMISSIONS.SUBSCRIPTIONS.MANAGE_VENDOR_SUBSCRIPTIONS),
    
    // Payments
    viewPayments: hasPermission(PERMISSIONS.PAYMENTS.VIEW),
    processPayments: hasPermission(PERMISSIONS.PAYMENTS.PROCESS),
    manageRefunds: hasPermission(PERMISSIONS.PAYMENTS.MANAGE_REFUNDS),
    
    // Notifications
    viewNotifications: hasPermission(PERMISSIONS.NOTIFICATIONS.VIEW),
    createNotifications: hasPermission(PERMISSIONS.NOTIFICATIONS.CREATE),
    sendNotifications: hasPermission(PERMISSIONS.NOTIFICATIONS.SEND),
    manageSupport: hasPermission(PERMISSIONS.NOTIFICATIONS.MANAGE_SUPPORT),
    
    // System Administration
    manageRoles: hasPermission(PERMISSIONS.SYSTEM.ROLE_MANAGEMENT),
    managePermissions: hasPermission(PERMISSIONS.SYSTEM.PERMISSION_MANAGEMENT),
    manageUsers: hasPermission(PERMISSIONS.SYSTEM.USER_MANAGEMENT),
    manageSettings: hasPermission(PERMISSIONS.SYSTEM.SETTINGS),
    viewAuditLogs: hasPermission(PERMISSIONS.SYSTEM.AUDIT_LOGS),
    
    // Bulk operations
    canPerformBulkOperations: permissionManager.canPerformBulkOperations(),
    canManageFinancials: permissionManager.canManageFinancials(),
  }), [hasPermission, permissionManager])

  const isAdmin = useMemo(() => {
    const userRole = session?.user?.role?.name
    return userRole?.toLowerCase() === 'admin'
  }, [session])

  const userRole = useMemo(() => {
    return session?.user?.role?.name || 'user'
  }, [session])

  // Refresh permissions function
  const refreshPermissions = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Clear cache first
      const userId = session?.user?.id || session?.user?.userId
      if (userId) {
        permissionCache.clear(userId)
      }
      
      // Refresh JWT token which will trigger permission reload
      await update()
      
    } catch (error) {
      console.error('Error refreshing permissions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session, update])

  // Clear permissions cache on logout
  useEffect(() => {
    if (!session?.user) {
      permissionCache.clear()
    }
  }, [session])

  return {
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    can,
    isAdmin,
    userRole,
    user: session?.user,
    isAuthenticated: !!session?.user,
    permissionManager,
    refreshPermissions
  }
}

// Permission-based component wrapper
export function PermissionGuard({ 
  children, 
  permission,
  permissions: requiredPermissions, 
  role, 
  route,
  fallback = null,
  requireAll = false 
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canAccess, isAdmin, userRole } = usePermissions()

  let hasAccess = false

  // Admin always has access
  if (isAdmin) {
    hasAccess = true
  }
  // Check by role
  else if (role && userRole.toLowerCase() === role.toLowerCase()) {
    hasAccess = true
  }
  // Check by specific permission
  else if (permission) {
    hasAccess = hasPermission(permission)
  }
  // Check by route access
  else if (route) {
    hasAccess = canAccess(route)
  }
  // Check by permission list
  else if (requiredPermissions && Array.isArray(requiredPermissions)) {
    hasAccess = requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions)
  }

  return hasAccess ? children : fallback
} 