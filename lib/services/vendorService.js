/**
 * Vendor Service - Handles all vendor-related API calls
 */

const API_BASE_URL = '/api/admin/vendors';

class VendorService {
  /**
   * Fetch all vendors with pagination and filtering
   */
  async getVendors(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        city = '',
        service = '',
        verified = ''
      } = params;

      // Validate parameters
      const validatedPage = Math.max(1, parseInt(page) || 1);
      const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));

      const queryParams = new URLSearchParams({
        page: validatedPage.toString(),
        limit: validatedLimit.toString(),
        ...(search && search.trim() && { search: search.trim() }),
        ...(status && { status }),
        ...(city && { city }),
        ...(service && { service }),
        ...(verified && { verified })
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
          `HTTP ${response.status}: Failed to fetch vendors`
        );
      }

      const data = await response.json();

      // Validate response structure
      if (!data.success || !data.data) {
        throw new Error('Invalid response format from server');
      }

      return {
        success: true,
        vendors: Array.isArray(data.data.vendors) ? data.data.vendors : [],
        pagination: data.data.pagination || {
          currentPage: validatedPage,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: validatedLimit,
          hasNextPage: false,
          hasPrevPage: false
        },
        stats: data.data.stats || {}
      };
    } catch (error) {
      console.error('Error fetching vendors:', error);
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        vendors: [],
        pagination: {
          currentPage: Math.max(1, parseInt(params.page) || 1),
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: Math.max(1, parseInt(params.limit) || 10),
          hasNextPage: false,
          hasPrevPage: false
        },
        stats: {}
      };
    }
  }

  /**
   * Fetch a single vendor by ID
   */
  async getVendor(id) {
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
        throw new Error(data.error || data.details || 'Failed to fetch vendor');
      }

      return {
        success: true,
        vendor: data.data
      };
    } catch (error) {
      console.error('Error fetching vendor:', error);
      return {
        success: false,
        error: error.message,
        vendor: null
      };
    }
  }

  /**
   * Create a new vendor
   */
  async createVendor(vendorData) {
    try {
      // Validate vendor data
      if (!vendorData || typeof vendorData !== 'object') {
        throw new Error('Invalid vendor data provided');
      }

      // Validate required fields
      const required = ['name', 'email', 'phone', 'businessName', 'services', 'address'];
      const missing = required.filter(field => !vendorData[field]);
      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
      }

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(vendorData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          errorData.details || 
          `HTTP ${response.status}: Failed to create vendor`
        );
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error('Invalid response format from server');
      }

      return {
        success: true,
        vendor: data.data,
        message: data.message || 'Vendor created successfully'
      };
    } catch (error) {
      console.error('Error creating vendor:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        vendor: null
      };
    }
  }

  /**
   * Update an existing vendor
   */
  async updateVendor(id, vendorData) {
    try {
      // Validate inputs
      if (!id) {
        throw new Error('Vendor ID is required');
      }

      if (!vendorData || typeof vendorData !== 'object') {
        throw new Error('Invalid vendor data provided');
      }

      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(vendorData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          errorData.details || 
          `HTTP ${response.status}: Failed to update vendor`
        );
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error('Invalid response format from server');
      }

      return {
        success: true,
        vendor: data.data,
        message: data.message || 'Vendor updated successfully'
      };
    } catch (error) {
      console.error('Error updating vendor:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        vendor: null
      };
    }
  }

  /**
   * Delete a vendor
   */
  async deleteVendor(id) {
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
        throw new Error(data.error || data.details || 'Failed to delete vendor');
      }

      return {
        success: true,
        message: data.message,
        deletedVendor: data.data
      };
    } catch (error) {
      console.error('Error deleting vendor:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify a vendor
   */
  async verifyVendor(id, verificationNotes = 'Vendor verified by admin') {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          verified: {
            isVerified: true,
            verificationNotes
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to verify vendor');
      }

      return {
        success: true,
        vendor: data.data,
        message: data.message || 'Vendor verified successfully'
      };
    } catch (error) {
      console.error('Error verifying vendor:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search vendors
   */
  async searchVendors(searchTerm, options = {}) {
    return this.getVendors({
      search: searchTerm,
      page: 1,
      limit: 50,
      ...options
    });
  }

  /**
   * Export vendors data
   */
  async exportVendors(format = 'csv') {
    try {
      // First get all vendors
      const result = await this.getVendors({ limit: 1000 });
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Convert to CSV format
      if (format === 'csv') {
        const headers = [
          'Vendor Name', 
          'Business Name', 
          'Email', 
          'Phone', 
          'City', 
          'State', 
          'Services', 
          'Status', 
          'Verified', 
          'Rating', 
          'Total Jobs', 
          'Created At'
        ];
        
        const csvContent = [
          headers.join(','),
          ...result.vendors.map(vendor => [
            `"${vendor.userData?.name || ''}"`,
            `"${vendor.businessName || ''}"`,
            `"${vendor.userData?.email || ''}"`,
            `"${vendor.userData?.phone || ''}"`,
            `"${vendor.address?.city || ''}"`,
            `"${vendor.address?.state || ''}"`,
            `"${vendor.services?.join('; ') || ''}"`,
            `"${vendor.status || ''}"`,
            `"${vendor.verified?.isVerified ? 'Yes' : 'No'}"`,
            `"${vendor.rating || 0}"`,
            `"${vendor.totalJobs || 0}"`,
            `"${vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : ''}"`
          ].join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `vendors_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return { success: true, message: 'Export completed successfully' };
      }

      throw new Error('Unsupported export format');
    } catch (error) {
      console.error('Error exporting vendors:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Import vendors from CSV file
   */
  async importVendors(file) {
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
      const requiredHeaders = ['Vendor Name', 'Business Name', 'Email', 'Phone', 'Services'];
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
          const vendor = {};
          
          headers.forEach((header, index) => {
            vendor[header] = row[index] || '';
          });

          // Map CSV data to vendor format
          const vendorData = {
            name: vendor['Vendor Name'],
            email: vendor['Email'],
            phone: vendor['Phone'],
            businessName: vendor['Business Name'],
            services: vendor['Services'] ? vendor['Services'].split(';').map(s => s.trim()).filter(Boolean) : [],
            address: {
              street: vendor['Street'] || '',
              city: vendor['City'] || '',
              state: vendor['State'] || '',
              pincode: vendor['Pincode'] || ''
            },
            status: vendor['Status'] || 'pending',
            password: 'defaultPassword123' // This should be changed by the vendor
          };

          // Create vendor
          const result = await this.createVendor(vendorData);
          
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
      console.error('Error importing vendors:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Download CSV template for vendor import
   */
  downloadTemplate() {
    const headers = [
      'Vendor Name', 
      'Business Name', 
      'Email', 
      'Phone', 
      'Services', 
      'Street', 
      'City', 
      'State', 
      'Pincode', 
      'Status'
    ];
    
    const sampleData = [
      [
        'John Smith',
        'Smith Plumbing Services', 
        'john@smithplumbing.com',
        '+91-9876543210',
        'Plumbing; Pipe Repair',
        '123 Main Street',
        'Mumbai',
        'Maharashtra', 
        '400001',
        'pending'
      ],
      [
        'Sarah Johnson',
        'Johnson Electrical',
        'sarah@johnsonelectric.com',
        '+91-9876543211', 
        'Electrical; Wiring; Appliance Repair',
        '456 Oak Avenue',
        'Delhi',
        'Delhi',
        '110001',
        'active'
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
    link.setAttribute('download', 'vendor-import-template.csv');
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
   * Get vendor statistics
   */
  async getVendorStats() {
    try {
      const result = await this.getVendors({ limit: 1000 });
      
      if (!result.success) {
        throw new Error(result.error);
      }

      const vendors = result.vendors;
      const total = vendors.length;
      const active = vendors.filter(vendor => vendor.status === 'active').length;
      const pending = vendors.filter(vendor => vendor.status === 'pending').length;
      const suspended = vendors.filter(vendor => vendor.status === 'suspended').length;
      const verified = vendors.filter(vendor => vendor.verified?.isVerified).length;
      
      const cityStats = vendors.reduce((acc, vendor) => {
        const city = vendor.address?.city || 'Unknown';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {});

      const serviceStats = vendors.reduce((acc, vendor) => {
        if (vendor.services) {
          vendor.services.forEach(service => {
            acc[service] = (acc[service] || 0) + 1;
          });
        }
        return acc;
      }, {});

      return {
        success: true,
        stats: {
          total,
          active,
          pending,
          suspended,
          verified,
          unverified: total - verified,
          cityDistribution: cityStats,
          serviceDistribution: serviceStats
        }
      };
    } catch (error) {
      console.error('Error getting vendor stats:', error);
      return {
        success: false,
        error: error.message,
        stats: null
      };
    }
  }
}

// Create and export singleton instance
const vendorService = new VendorService();
export default vendorService; 