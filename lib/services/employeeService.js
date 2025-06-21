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

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(role && { role }),
        ...(status && { status })
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
        throw new Error(data.error || data.details || 'Failed to fetch employees');
      }

      return {
        success: true,
        employees: data.data.employees || [],
        pagination: data.data.pagination || {}
      };
    } catch (error) {
      console.error('Error fetching employees:', error);
      return {
        success: false,
        error: error.message,
        employees: [],
        pagination: {}
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
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(employeeData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to create employee');
      }

      return {
        success: true,
        employee: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error creating employee:', error);
      return {
        success: false,
        error: error.message,
        employee: null
      };
    }
  }

  /**
   * Update an existing employee
   */
  async updateEmployee(id, employeeData) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(employeeData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to update employee');
      }

      return {
        success: true,
        employee: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error updating employee:', error);
      return {
        success: false,
        error: error.message,
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