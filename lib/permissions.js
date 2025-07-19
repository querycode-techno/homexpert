// Permission Management System for HomeXpert Platform

// Core permission definitions organized by module
export const PERMISSIONS = {
  // Dashboard & Analytics
  DASHBOARD: {
    VIEW: 'dashboard:view',
    ANALYTICS: 'dashboard:analytics',
    EXPORT_REPORTS: 'dashboard:export_reports'
  },

  // Employee Management (Admin & Subadmin Users)
  EMPLOYEES: {
    VIEW: 'employees:view',
    CREATE: 'employees:create',
    EDIT: 'employees:edit',
    DELETE: 'employees:delete',
    SEARCH: 'employees:search',
    EXPORT: 'employees:export',
    IMPORT: 'employees:import'
  },

  // Vendor Management (Partners)
  VENDORS: {
    VIEW: 'vendors:view',
    CREATE: 'vendors:create',
    EDIT: 'vendors:edit',
    DELETE: 'vendors:delete',
    ACTIVATE: 'vendors:activate',
    DEACTIVATE: 'vendors:deactivate',
    SEARCH: 'vendors:search',
    MANAGE_LEADS: 'vendors:manage_leads',
    VIEW_PROFILE: 'vendors:view_profile'
  },

  // Booking Management
  BOOKINGS: {
    VIEW: 'bookings:view',
    CREATE: 'bookings:create',
    EDIT: 'bookings:edit',
    DELETE: 'bookings:delete',
    ASSIGN: 'bookings:assign',
    EXPORT: 'bookings:export',
    IMPORT: 'bookings:import',
    MANAGE_STATUS: 'bookings:manage_status'
  },

  // Lead Management
  LEADS: {
    VIEW: 'leads:view',
    CREATE: 'leads:create',
    EDIT: 'leads:edit',
    DELETE: 'leads:delete',
    ASSIGN: 'leads:assign',
    ADD_TO_VENDOR: 'leads:add_to_vendor',
    REMOVE_FROM_VENDOR: 'leads:remove_from_vendor',
    VIEW_HISTORY: 'leads:view_history'
  },

  // Subscription Management
  SUBSCRIPTIONS: {
    VIEW: 'subscriptions:view',
    CREATE: 'subscriptions:create',
    EDIT: 'subscriptions:edit',
    DELETE: 'subscriptions:delete',
    ACTIVATE: 'subscriptions:activate',
    DEACTIVATE: 'subscriptions:deactivate',
    MANAGE_VENDOR_SUBSCRIPTIONS: 'subscriptions:manage_vendor_subscriptions',
    VIEW_ANALYTICS: 'subscriptions:view_analytics'
  },

  // Payment Management
  PAYMENTS: {
    VIEW: 'payments:view',
    PROCESS: 'payments:process',
    VIEW_TRANSACTIONS: 'payments:view_transactions',
    MANAGE_REFUNDS: 'payments:manage_refunds',
    VIEW_SETTLEMENTS: 'payments:view_settlements',
    EXPORT_REPORTS: 'payments:export_reports',
    RECONCILE: 'payments:reconcile'
  },

  // Notifications & Support
  NOTIFICATIONS: {
    VIEW: 'notifications:view',
    CREATE: 'notifications:create',
    EDIT: 'notifications:edit',
    DELETE: 'notifications:delete',
    SEND: 'notifications:send',
    MANAGE_SUPPORT: 'notifications:manage_support'
  },

  // System Administration
  SYSTEM: {
    ROLE_MANAGEMENT: 'system:role_management',
    PERMISSION_MANAGEMENT: 'system:permission_management',
    USER_MANAGEMENT: 'system:user_management',
    SETTINGS: 'system:settings',
    AUDIT_LOGS: 'system:audit_logs',
    BACKUP_RESTORE: 'system:backup_restore'
  }
};

// Role definitions for HomeXpert platform
export const ROLES = {
  ADMIN: {
    id: 'admin',
    name: 'Admin',
    description: 'Complete system access with all permissions',
    level: 1,
    permissions: Object.values(PERMISSIONS).flatMap(module => Object.values(module))
  },

  HELPLINE: {
    id: 'helpline',
    name: 'Helpline',
    description: 'Create bookings and provide support to vendors and partners',
    level: 2,
    permissions: [
      // Dashboard
      PERMISSIONS.DASHBOARD.VIEW,

      // Bookings (full access)
      PERMISSIONS.BOOKINGS.VIEW,
      PERMISSIONS.BOOKINGS.CREATE,
      PERMISSIONS.BOOKINGS.EDIT,
      PERMISSIONS.BOOKINGS.EXPORT,
      PERMISSIONS.BOOKINGS.IMPORT,

      // Support Services
      PERMISSIONS.NOTIFICATIONS.VIEW,
      PERMISSIONS.NOTIFICATIONS.MANAGE_SUPPORT,

      // Leads (create and edit)
      PERMISSIONS.LEADS.VIEW,
      PERMISSIONS.LEADS.CREATE,
      PERMISSIONS.LEADS.EDIT,
      PERMISSIONS.LEADS.VIEW_HISTORY,

      // Vendors (view only for assignment)
      PERMISSIONS.VENDORS.VIEW,
      PERMISSIONS.VENDORS.VIEW_PROFILE
    ]
  },

  TELECALLER: {
    id: 'telecaller',
    name: 'Telecaller',
    description: 'Manage vendors, subscriptions, and lead assignments',
    level: 3,
    permissions: [
      // Dashboard
      PERMISSIONS.DASHBOARD.VIEW,

      // Vendor Management (full access)
      PERMISSIONS.VENDORS.VIEW,
      PERMISSIONS.VENDORS.CREATE,
      PERMISSIONS.VENDORS.EDIT,
      PERMISSIONS.VENDORS.ACTIVATE,
      PERMISSIONS.VENDORS.DEACTIVATE,
      PERMISSIONS.VENDORS.SEARCH,
      PERMISSIONS.VENDORS.MANAGE_LEADS,
      PERMISSIONS.VENDORS.VIEW_PROFILE,

      // Booking Management (view and assign)
      PERMISSIONS.BOOKINGS.VIEW,
      PERMISSIONS.BOOKINGS.ASSIGN,
      PERMISSIONS.BOOKINGS.MANAGE_STATUS,

      // Subscription Management
      PERMISSIONS.SUBSCRIPTIONS.VIEW,
      PERMISSIONS.SUBSCRIPTIONS.MANAGE_VENDOR_SUBSCRIPTIONS,
      PERMISSIONS.SUBSCRIPTIONS.VIEW_ANALYTICS,

      // Lead Management
      PERMISSIONS.LEADS.VIEW,
      PERMISSIONS.LEADS.CREATE,
      PERMISSIONS.LEADS.EDIT,
      PERMISSIONS.LEADS.ASSIGN,
      PERMISSIONS.LEADS.ADD_TO_VENDOR,
      PERMISSIONS.LEADS.REMOVE_FROM_VENDOR,
      PERMISSIONS.LEADS.VIEW_HISTORY,

      // Support Services
      PERMISSIONS.NOTIFICATIONS.VIEW,
      PERMISSIONS.NOTIFICATIONS.MANAGE_SUPPORT,

      // Payments (input pricing data)
      PERMISSIONS.PAYMENTS.VIEW,
      PERMISSIONS.PAYMENTS.PROCESS
    ]
  },

  VENDOR: {
    id: 'vendor',
    name: 'Vendor',
    description: 'Partner app user with limited access to own profile and leads',
    level: 4,
    permissions: [
      // Own profile management
      PERMISSIONS.VENDORS.VIEW_PROFILE,

      // Lead acceptance/rejection
      PERMISSIONS.LEADS.VIEW,

      // Booking completion
      PERMISSIONS.BOOKINGS.VIEW,

      // Subscription status
      PERMISSIONS.SUBSCRIPTIONS.VIEW
    ]
  }
};

// Permission checking utilities
export class PermissionManager {
  constructor(userRole, userPermissions = []) {
    this.userRole = userRole;
    this.userPermissions = userPermissions;
  }

  // Check if user has a specific permission
  hasPermission(permission) {
    // Admin has all permissions
    if (this.userRole === ROLES.ADMIN.id || this.userRole === 'admin') {
      return true;
    }

    // Use database permissions if available (this is the primary source)
    if (this.userPermissions && this.userPermissions.length > 0) {
      return this.userPermissions.includes(permission);
    }

    // If no database permissions are loaded yet, return false to prevent unauthorized access
    // This ensures that when permissions are removed from database, access is immediately denied
    return false;
  }

  // Check if user has any of the permissions in an array
  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission));
  }

  // Check if user has all permissions in an array
  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission));
  }

  // Get all permissions for current user
  getAllPermissions() {
    // Admin gets all permissions
    if (this.userRole === ROLES.ADMIN.id || this.userRole === 'admin') {
      return Object.values(PERMISSIONS).flatMap(module => Object.values(module));
    }

    // Use only database permissions (userPermissions) instead of hardcoded role permissions
    return this.userPermissions;
  }

  // Check if user can access a specific route/page
  canAccessRoute(route) {
    const routePermissions = {
      '/admin': [PERMISSIONS.DASHBOARD.VIEW],
      '/admin/dashboard': [PERMISSIONS.DASHBOARD.VIEW],
      '/admin/employees': [PERMISSIONS.EMPLOYEES.VIEW],
      '/admin/vendors': [PERMISSIONS.VENDORS.VIEW],
      '/admin/bookings': [PERMISSIONS.BOOKINGS.VIEW],
      '/admin/leads': [PERMISSIONS.LEADS.VIEW],
      '/admin/subscriptions': [PERMISSIONS.SUBSCRIPTIONS.VIEW],
      '/admin/payments': [PERMISSIONS.PAYMENTS.VIEW],
      '/admin/notifications': [PERMISSIONS.NOTIFICATIONS.VIEW],
      '/admin/roles': [PERMISSIONS.SYSTEM.ROLE_MANAGEMENT],
      '/admin/settings': [PERMISSIONS.SYSTEM.SETTINGS],
      '/profile': [] // Everyone can access their profile
    };

    const requiredPermissions = routePermissions[route];
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No specific permissions required
    }

    return this.hasAnyPermission(requiredPermissions);
  }

  // Get permission level (lower number = higher access)
  getPermissionLevel() {
    const role = ROLES[this.userRole.toUpperCase()];
    return role ? role.level : 999;
  }

  // Check if user can perform bulk operations
  canPerformBulkOperations() {
    return this.hasAnyPermission([
      PERMISSIONS.EMPLOYEES.IMPORT,
      PERMISSIONS.VENDORS.CREATE,
      PERMISSIONS.BOOKINGS.IMPORT,
      PERMISSIONS.LEADS.CREATE
    ]);
  }

  // Check if user can manage financial operations
  canManageFinancials() {
    return this.hasAnyPermission([
      PERMISSIONS.PAYMENTS.PROCESS,
      PERMISSIONS.PAYMENTS.MANAGE_REFUNDS,
      PERMISSIONS.PAYMENTS.VIEW_SETTLEMENTS,
      PERMISSIONS.PAYMENTS.RECONCILE
    ]);
  }
}

// Hook for React components to check permissions
export const usePermissions = (userRole, userPermissions = []) => {
  const permissionManager = new PermissionManager(userRole, userPermissions);

  return {
    hasPermission: (permission) => permissionManager.hasPermission(permission),
    hasAnyPermission: (permissions) => permissionManager.hasAnyPermission(permissions),
    hasAllPermissions: (permissions) => permissionManager.hasAllPermissions(permissions),
    canAccessRoute: (route) => permissionManager.canAccessRoute(route),
    canPerformBulkOperations: () => permissionManager.canPerformBulkOperations(),
    canManageFinancials: () => permissionManager.canManageFinancials(),
    hasAnyPermission: (permissions) => permissionManager.hasAnyPermission(permissions),
    hasAllPermissions: (permissions) => permissionManager.hasAllPermissions(permissions),
    getAllPermissions: () => permissionManager.getAllPermissions(),
    getPermissionLevel: () => permissionManager.getPermissionLevel(),
    permissionManager
  };
};

// Default export for easy importing
export default {
  PERMISSIONS,
  ROLES,
  PermissionManager,
  usePermissions
}; 