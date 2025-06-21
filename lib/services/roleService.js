/**
 * Role Service - Handles role-related API calls
 */

const API_BASE_URL = '/api/roles';

class RoleService {
  /**
   * Fetch all roles
   */
  async getRoles(params = {}) {
    try {
      const {
        page = 1,
        limit = 100,
        search = '',
        includePermissions = false
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        includePermissions: includePermissions.toString(),
        ...(search && { search })
      });

      const response = await fetch(`${API_BASE_URL}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch roles');
      }

      return {
        success: true,
        roles: data.roles || [],
        pagination: data.pagination || {}
      };
    } catch (error) {
      console.error('Error fetching roles:', error);
      return {
        success: false,
        error: error.message,
        roles: [],
        pagination: {}
      };
    }
  }

  /**
   * Fetch a single role by ID
   */
  async getRole(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch role');
      }

      return {
        success: true,
        role: data.role
      };
    } catch (error) {
      console.error('Error fetching role:', error);
      return {
        success: false,
        error: error.message,
        role: null
      };
    }
  }
}

// Create and export singleton instance
const roleService = new RoleService();
export default roleService; 