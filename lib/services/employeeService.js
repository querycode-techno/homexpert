/**
 * Employee Service - Handles all employee-related API calls
 */

const API_BASE_URL = '/api/admin/employee';

class EmployeeService {
  /**
   * Fetch all employees with pagination and filtering
   */
  async getEmployees(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        role = '',
        status = ''
      } = params;

      // Validate parameters
      const validatedPage = Math.max(1, parseInt(page) || 1);
      const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));

      const queryParams = new URLSearchParams({
        page: validatedPage.toString(),
        limit: validatedLimit.toString(),
        ...(search && search.trim() && { search: search.trim() }),
        ...(role && { role }),
        ...(status && { status })
      });

      const apiUrl = `${API_BASE_URL}?${queryParams}`

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          errorData.details || 
          `HTTP ${response.status}: Failed to fetch employees`
        );
      }

      const data = await response.json();

      // Validate response structure
      if (!data.success || !data.data) {
        throw new Error('Invalid response format from server');
      }

      return {
        success: true,
        employees: Array.isArray(data.data.employees) ? data.data.employees : [],
        pagination: data.data.pagination || {
          currentPage: validatedPage,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: validatedLimit,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    } catch (error) {
      console.error('Error fetching employees:', error);
      
      // Return consistent error structure
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        employees: [],
        pagination: {
          currentPage: Math.max(1, parseInt(params.page) || 1),
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: Math.max(1, parseInt(params.limit) || 10),
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    }
  }

  /**
   * Fetch a single employee by ID
   */
  async getEmployee(id) {
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
        throw new Error(data.error || data.details || 'Failed to fetch employee');
      }

      return {
        success: true,
        employee: data.data
      };
    } catch (error) {
      console.error('Error fetching employee:', error);
      return {
        success: false,
        error: error.message,
        employee: null
      };
    }
  }

  /**
   * Create a new employee
   */
  async createEmployee(employeeData) {
    try {
      // Validate employee data
      if (!employeeData || typeof employeeData !== 'object') {
        throw new Error('Invalid employee data provided');
      }

      // Validate required fields
      const required = ['name', 'email', 'phone', 'password', 'role'];
      const missing = required.filter(field => !employeeData[field]);
      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
      }

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(employeeData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          errorData.details || 
          `HTTP ${response.status}: Failed to create employee`
        );
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error('Invalid response format from server');
      }

      return {
        success: true,
        employee: data.data,
        message: data.message || 'Employee created successfully'
      };
    } catch (error) {
      console.error('Error creating employee:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        employee: null
      };
    }
  }

  /**
   * Update an existing employee
   */
  async updateEmployee(id, employeeData) {
    try {
      // Validate inputs
      if (!id) {
        throw new Error('Employee ID is required');
      }

      if (!employeeData || typeof employeeData !== 'object') {
        throw new Error('Invalid employee data provided');
      }

      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(employeeData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          errorData.details || 
          `HTTP ${response.status}: Failed to update employee`
        );
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error('Invalid response format from server');
      }

      return {
        success: true,
        employee: data.data,
        message: data.message || 'Employee updated successfully'
      };
    } catch (error) {
      console.error('Error updating employee:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        employee: null
      };
    }
  }

  /**
   * Delete an employee
   */
  async deleteEmployee(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to delete employee');
      }

      return {
        success: true,
        message: data.message,
        deletedEmployee: data.data
      };
    } catch (error) {
      console.error('Error deleting employee:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search employees
   */
  async searchEmployees(searchTerm, options = {}) {
    return this.getEmployees({
      search: searchTerm,
      page: 1,
      limit: 50,
      ...options
    });
  }

  /**
   * Get available roles for filtering
   */
  async getRoles() {
    try {
      const response = await fetch('/api/roles?limit=100', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          errorData.details || 
          `HTTP ${response.status}: Failed to fetch roles`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data.roles)) {
        throw new Error('Invalid response format from server');
      }

      // Filter out vendor role from the dropdown options
      const nonVendorRoles = data.roles.filter(role => role.name !== 'vendor');

      return {
        success: true,
        roles: nonVendorRoles
      };
    } catch (error) {
      console.error('Error fetching roles:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        roles: []
      };
    }
  }

  /**
   * Export employees data
   */
  async exportEmployees(format = 'csv') {
    try {
      // First get all employees
      const result = await this.getEmployees({ limit: 1000 });
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Convert to CSV format
      if (format === 'csv') {
        const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Created At'];
        const csvContent = [
          headers.join(','),
          ...result.employees.map(emp => [
            `"${emp.name || ''}"`,
            `"${emp.email || ''}"`,
            `"${emp.phone || ''}"`,
            `"${emp.role?.name || emp.role || ''}"`,
            `"${emp.status || ''}"`,
            `"${emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : ''}"`
          ].join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return { success: true, message: 'Export completed successfully' };
      }

      throw new Error('Unsupported export format');
    } catch (error) {
      console.error('Error exporting employees:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Bulk operations helper
   */
  async bulkUpdateEmployees(updates) {
    const results = [];
    
    for (const update of updates) {
      const result = await this.updateEmployee(update.id, update.data);
      results.push({ id: update.id, ...result });
    }

    return results;
  }

  /**
   * Get employee statistics
   */
  async getEmployeeStats() {
    try {
      const result = await this.getEmployees({ limit: 1000 });
      
      if (!result.success) {
        throw new Error(result.error);
      }

      const employees = result.employees;
      const total = employees.length;
      const active = employees.filter(emp => emp.status === 'Active').length;
      const inactive = employees.filter(emp => emp.status === 'Inactive').length;
      
      const roleStats = employees.reduce((acc, emp) => {
        const roleName = emp.role?.name || emp.role || 'Unknown';
        acc[roleName] = (acc[roleName] || 0) + 1;
        return acc;
      }, {});

      return {
        success: true,
        stats: {
          total,
          active,
          inactive,
          roleDistribution: roleStats
        }
      };
    } catch (error) {
      console.error('Error getting employee stats:', error);
      return {
        success: false,
        error: error.message,
        stats: null
      };
    }
  }
}

// Create and export singleton instance
const employeeService = new EmployeeService();
export default employeeService; 