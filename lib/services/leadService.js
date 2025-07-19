/**
 * Lead Service - Handles all lead-related API calls
 */

const API_BASE_URL = '/api/admin/leads';

class LeadService {
  /**
   * Fetch all leads with pagination and filtering
   */
  async getLeads(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        service = '',
        city = '',
        assignedStatus = '',
        dateFrom = '',
        dateTo = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = params;

      // Validate parameters
      const validatedPage = Math.max(1, parseInt(page) || 1);
      const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));

      const queryParams = new URLSearchParams({
        page: validatedPage.toString(),
        limit: validatedLimit.toString(),
        ...(search && search.trim() && { search: search.trim() }),
        ...(status && { status }),
        ...(service && { service }),
        ...(city && { city }),
        ...(assignedStatus && { assignedStatus }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        sortBy,
        sortOrder
      });

      const apiUrl = `${API_BASE_URL}?${queryParams}`;

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
          `HTTP ${response.status}: Failed to fetch leads`
        );
      }

      const data = await response.json();

      // Validate response structure
      if (!data.success || !data.data) {
        throw new Error('Invalid response format from server');
      }

      return {
        success: true,
        leads: Array.isArray(data.data.leads) ? data.data.leads : [],
        pagination: data.data.pagination || {
          currentPage: validatedPage,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: validatedLimit,
          hasNextPage: false,
          hasPrevPage: false
        },
        summary: data.data.summary || {}
      };
    } catch (error) {
      console.error('Error fetching leads:', error);
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        leads: [],
        pagination: {
          currentPage: Math.max(1, parseInt(params.page) || 1),
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: Math.max(1, parseInt(params.limit) || 10),
          hasNextPage: false,
          hasPrevPage: false
        },
        summary: {}
      };
    }
  }

  /**
   * Fetch a single lead by ID
   */
  async getLead(id) {
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
        throw new Error(data.error || data.details || 'Failed to fetch lead');
      }

      return {
        success: true,
        lead: data.data
      };
    } catch (error) {
      console.error('Error fetching lead:', error);
      return {
        success: false,
        error: error.message,
        lead: null
      };
    }
  }

  /**
   * Create a new lead
   */
  async createLead(leadData) {
    try {
      // Validate lead data
      if (!leadData || typeof leadData !== 'object') {
        throw new Error('Invalid lead data provided');
      }

      // Validate required fields
      const required = ['customerName', 'customerPhone'];
      const missing = required.filter(field => !leadData[field]);
      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
      }

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(leadData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          errorData.details || 
          `HTTP ${response.status}: Failed to create lead`
        );
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error('Invalid response format from server');
      }

      return {
        success: true,
        lead: data.data,
        message: data.message || 'Lead created successfully'
      };
    } catch (error) {
      console.error('Error creating lead:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        lead: null
      };
    }
  }

  /**
   * Update an existing lead
   */
  async updateLead(id, leadData) {
    try {
      // Validate inputs
      if (!id) {
        throw new Error('Lead ID is required');
      }

      if (!leadData || typeof leadData !== 'object') {
        throw new Error('Invalid lead data provided');
      }

      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(leadData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          errorData.details || 
          `HTTP ${response.status}: Failed to update lead`
        );
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error('Invalid response format from server');
      }

      return {
        success: true,
        lead: data.data,
        message: data.message || 'Lead updated successfully'
      };
    } catch (error) {
      console.error('Error updating lead:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        lead: null
      };
    }
  }

  /**
   * Delete a lead
   */
  async deleteLead(id, reason = 'Deleted by admin') {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to delete lead');
      }

      return {
        success: true,
        message: data.message,
        deletedLead: data.data
      };
    } catch (error) {
      console.error('Error deleting lead:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete multiple leads
   */
  async deleteLeads(leadIds, reason = 'Bulk delete by admin') {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ leadIds, reason })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to delete leads');
      }

      return {
        success: true,
        message: data.message,
        deletedCount: data.deletedCount
      };
    } catch (error) {
      console.error('Error deleting leads:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search leads
   */
  async searchLeads(searchTerm, options = {}) {
    return this.getLeads({
      search: searchTerm,
      page: 1,
      limit: 50,
      ...options
    });
  }

  /**
   * Export leads data
   */
  async exportLeads(format = 'csv') {
    try {
      // First get all leads
      const result = await this.getLeads({ limit: 1000 });
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Convert to CSV format
      if (format === 'csv') {
        const headers = [
          'Customer Name', 
          'Phone', 
          'Email', 
          'City', 
          'Address', 
          'Service', 
          'Sub Service',
          'Status', 
          'Assigned', 
          'Priority',
          'Description',
          'Created At'
        ];
        
        const csvContent = [
          headers.join(','),
          ...result.leads.map(lead => [
            `"${lead.customerName || ''}"`,
            `"${lead.customerPhone || ''}"`,
            `"${lead.customerEmail || ''}"`,
            `"${this.parseCity(lead.address) || ''}"`,
            `"${lead.address || ''}"`,
            `"${lead.selectedService || lead.service || ''}"`,
            `"${lead.selectedSubService || ''}"`,
            `"${lead.status || ''}"`,
            `"${lead.isAssigned ? 'Yes' : 'No'}"`,
            `"${lead.priority || 'Normal'}"`,
            `"${lead.description || ''}"`,
            `"${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : ''}"`
          ].join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `leads_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return { success: true, message: 'Export completed successfully' };
      }

      throw new Error('Unsupported export format');
    } catch (error) {
      console.error('Error exporting leads:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Import leads from CSV file
   */
  async importLeads(file) {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Only CSV files are supported');
      }

      // Parse CSV file
      const csvText = await this.readFileAsText(file);
      const lines = csvText.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain headers and at least one data row');
      }

      const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());
      const dataRows = lines.slice(1);

      // Validate headers
      const requiredHeaders = ['Customer Name', 'Phone'];
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      const importResults = {
        total: dataRows.length,
        successful: 0,
        failed: 0,
        errors: []
      };

      // Process each row
      for (let i = 0; i < dataRows.length; i++) {
        try {
          const row = dataRows[i].split(',').map(cell => cell.replace(/"/g, '').trim());
          const lead = {};
          
          headers.forEach((header, index) => {
            lead[header] = row[index] || '';
          });

          // Map CSV data to lead format
          const leadData = {
            customerName: lead['Customer Name'],
            customerPhone: lead['Phone'],
            customerEmail: lead['Email'] || '',
            address: lead['Address'] || '',
            selectedService: lead['Service'] || '',
            selectedSubService: lead['Sub Service'] || '',
            description: lead['Description'] || '',
            priority: lead['Priority'] || 'normal',
            status: lead['Status'] || 'pending'
          };

          // Create lead
          const result = await this.createLead(leadData);
          
          if (result.success) {
            importResults.successful++;
          } else {
            importResults.failed++;
            importResults.errors.push(`Row ${i + 2}: ${result.error}`);
          }
        } catch (rowError) {
          importResults.failed++;
          importResults.errors.push(`Row ${i + 2}: ${rowError.message}`);
        }
      }

      return {
        success: true,
        results: importResults,
        message: `Import completed: ${importResults.successful} successful, ${importResults.failed} failed`
      };
    } catch (error) {
      console.error('Error importing leads:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Download CSV template for lead import
   */
  downloadTemplate() {
    const headers = [
      'Customer Name', 
      'Phone', 
      'Email', 
      'Address', 
      'Service', 
      'Sub Service',
      'Description',
      'Priority',
      'Status'
    ];
    
    const sampleData = [
      [
        'John Smith',
        '+91-9876543210',
        'john@example.com',
        '123 Main Street, Mumbai, Maharashtra - 400001',
        'Plumbing',
        'Pipe Repair',
        'Kitchen sink pipe leaking',
        'high',
        'pending'
      ],
      [
        'Sarah Johnson',
        '+91-9876543211',
        'sarah@example.com',
        '456 Oak Avenue, Delhi, Delhi - 110001',
        'Electrical',
        'Wiring',
        'House rewiring needed',
        'normal',
        'pending'
      ]
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Create and download template file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'lead-import-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, message: 'Template downloaded successfully' };
  }

  /**
   * Read file as text (helper method)
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Parse city from address (helper method)
   */
  parseCity(address) {
    if (!address) return 'Unknown';
    
    try {
      // Remove pincode pattern (ends with - followed by numbers)
      const withoutPincode = address.replace(/\s*-\s*\d+\s*$/, '');
      
      // Split by comma and get the parts
      const parts = withoutPincode.split(',').map(part => part.trim());
      
      if (parts.length >= 2) {
        // Get the second-to-last part (city is usually before state)
        const cityPart = parts[parts.length - 2];
        
        // Handle cases like "Noida Sector 35/4, Noida, Uttar Pradesh"
        // where city might be repeated
        const lastPart = parts[parts.length - 1];
        
        // If last part doesn't look like a state (contains numbers or special chars)
        // then use the last part as city
        if (lastPart && /\d|\//.test(lastPart)) {
          return cityPart || 'Unknown';
        }
        
        // Otherwise use the second-to-last part
        return cityPart || 'Unknown';
      }
      
      // If only one part, return it as city
      return parts[0] || 'Unknown';
    } catch (error) {
      console.error('Error parsing city:', error);
      return 'Unknown';
    }
  }

  /**
   * Get lead statistics
   */
  async getLeadStats() {
    try {
      const result = await this.getLeads({ limit: 1000 });
      
      if (!result.success) {
        throw new Error(result.error);
      }

      const leads = result.leads;
      const total = leads.length;
      const assigned = leads.filter(lead => lead.isAssigned).length;
      const unassigned = total - assigned;
      
      const statusStats = leads.reduce((acc, lead) => {
        const status = lead.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const serviceStats = leads.reduce((acc, lead) => {
        const service = lead.selectedService || lead.service || 'Unknown';
        acc[service] = (acc[service] || 0) + 1;
        return acc;
      }, {});

      return {
        success: true,
        stats: {
          total,
          assigned,
          unassigned,
          statusDistribution: statusStats,
          serviceDistribution: serviceStats
        }
      };
    } catch (error) {
      console.error('Error getting lead stats:', error);
      return {
        success: false,
        error: error.message,
        stats: null
      };
    }
  }
}

// Create and export singleton instance
const leadService = new LeadService();
export default leadService; 