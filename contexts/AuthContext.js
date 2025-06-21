"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePermissions, ROLES, PERMISSIONS } from '@/lib/permissions';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Mock user data - in real app, this would come from API/database
  const mockUsers = {
    'admin@example.com': {
      id: 1,
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'super_admin',
      department: 'Administration',
      avatar: null,
      customPermissions: [] // Additional permissions beyond role
    },
    'manager@example.com': {
      id: 2,
      email: 'manager@example.com',
      name: 'Regional Manager',
      role: 'regional_manager',
      department: 'Operations',
      avatar: null,
      customPermissions: []
    },
    'store@example.com': {
      id: 3,
      email: 'store@example.com',
      name: 'Store Manager',
      role: 'store_manager',
      department: 'Store Operations',
      avatar: null,
      customPermissions: []
    }
  };

  // Initialize auth state on component mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for stored auth data
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid stored data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setIsLoading(true);

      // Mock authentication - in real app, this would be an API call
      const mockUser = mockUsers[email.toLowerCase()];
      
      if (!mockUser || password !== 'password123') {
        throw new Error('Invalid credentials');
      }

      // Mock token - in real app, this would come from the server
      const mockToken = `mock_token_${Date.now()}`;

      // Store auth data
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('token', mockToken);

      setUser(mockUser);
      setIsAuthenticated(true);

      return { success: true, user: mockUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    try {
      // Clear stored auth data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // Reset state
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setIsLoading(true);

      // Mock API call - in real app, this would update the server
      const updatedUser = { ...user, ...profileData };
      
      // Update stored data
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setIsLoading(true);

      // Mock password validation - in real app, this would be server-side
      if (currentPassword !== 'password123') {
        throw new Error('Current password is incorrect');
      }

      // In real app, this would hash and store the new password
      console.log('Password changed successfully');

      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Get user permissions using the permissions system
  const getUserPermissions = () => {
    if (!user) return [];
    return usePermissions(user.role, user.customPermissions || []);
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    if (!user) return false;
    const permissions = usePermissions(user.role, user.customPermissions || []);
    return permissions.hasPermission(permission);
  };

  // Check if user can access specific route
  const canAccessRoute = (route) => {
    if (!user) return false;
    const permissions = usePermissions(user.role, user.customPermissions || []);
    return permissions.canAccessRoute(route);
  };

  // Get user role information
  const getUserRole = () => {
    if (!user) return null;
    return ROLES[user.role.toUpperCase()] || null;
  };

  // Check if user is admin (super admin or regional manager)
  const isAdmin = () => {
    if (!user) return false;
    return ['super_admin', 'regional_manager'].includes(user.role);
  };

  // Check if user is manager level (regional manager or store manager)
  const isManager = () => {
    if (!user) return false;
    return ['super_admin', 'regional_manager', 'store_manager'].includes(user.role);
  };

  // Get permission level
  const getPermissionLevel = () => {
    if (!user) return 999;
    const permissions = usePermissions(user.role, user.customPermissions || []);
    return permissions.getPermissionLevel();
  };

  // Check if user can manage other users
  const canManageUsers = () => {
    return hasPermission(PERMISSIONS.STAFF.CREATE) || hasPermission(PERMISSIONS.STAFF.EDIT);
  };

  // Check if user can manage financials
  const canManageFinancials = () => {
    if (!user) return false;
    const permissions = usePermissions(user.role, user.customPermissions || []);
    return permissions.canManageFinancials();
  };

  // Check if user can perform bulk operations
  const canPerformBulkOperations = () => {
    if (!user) return false;
    const permissions = usePermissions(user.role, user.customPermissions || []);
    return permissions.canPerformBulkOperations();
  };

  // Get filtered navigation items based on permissions
  const getAuthorizedNavigation = (navigationItems) => {
    if (!user) return [];
    
    return navigationItems.filter(item => {
      // Convert href to route path for permission checking
      const route = item.href.startsWith('/') ? item.href : `/${item.href}`;
      return canAccessRoute(route);
    });
  };

  // Context value
  const contextValue = {
    // Auth state
    user,
    isLoading,
    isAuthenticated,

    // Auth actions
    login,
    logout,
    updateProfile,
    changePassword,

    // Permission utilities
    getUserPermissions,
    hasPermission,
    canAccessRoute,
    getUserRole,
    isAdmin,
    isManager,
    getPermissionLevel,
    canManageUsers,
    canManageFinancials,
    canPerformBulkOperations,
    getAuthorizedNavigation,

    // Constants for easy access
    PERMISSIONS,
    ROLES
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Higher-order component for route protection
export const withAuth = (WrappedComponent, requiredPermissions = []) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading, hasPermission, canAccessRoute } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Redirect to login or show unauthorized message
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">Please log in to access this page.</p>
          </div>
        </div>
      );
    }

    // Check specific permissions if provided
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = requiredPermissions.some(permission => 
        hasPermission(permission)
      );

      if (!hasRequiredPermissions) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
              <p className="text-gray-600">You don't have permission to access this page.</p>
            </div>
          </div>
        );
      }
    }

    return <WrappedComponent {...props} />;
  };
};

// Component for permission-based rendering
export const PermissionGuard = ({ 
  permission, 
  permissions = [], 
  requireAll = false, 
  fallback = null, 
  children 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else {
    hasAccess = true; // No specific permissions required
  }

  return hasAccess ? children : fallback;
};

export default AuthContext; 