// Subscription Plan API Service
const API_BASE_URL = '/api/admin/subscriptions'

class SubscriptionService {
  // Fetch all subscription plans with optional filters
  async getAllPlans(filters = {}) {
    try {
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value)
        }
      })

      const url = `${API_BASE_URL}${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch subscription plans')
      }

      return data
    } catch (error) {
      console.error('Error fetching subscription plans:', error)
      throw error
    }
  }

  // Fetch single subscription plan by ID
  async getPlanById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch subscription plan')
      }

      return data
    } catch (error) {
      console.error('Error fetching subscription plan:', error)
      throw error
    }
  }

  // Create new subscription plan
  async createPlan(planData) {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription plan')
      }

      return data
    } catch (error) {
      console.error('Error creating subscription plan:', error)
      throw error
    }
  }

  // Update subscription plan
  async updatePlan(id, planData) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subscription plan')
      }

      return data
    } catch (error) {
      console.error('Error updating subscription plan:', error)
      throw error
    }
  }

  // Delete subscription plan
  async deletePlan(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete subscription plan')
      }

      return data
    } catch (error) {
      console.error('Error deleting subscription plan:', error)
      throw error
    }
  }

  // Toggle subscription plan active status
  async togglePlanStatus(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle subscription plan status')
      }

      return data
    } catch (error) {
      console.error('Error toggling subscription plan status:', error)
      throw error
    }
  }

  // Export subscription plans to CSV
  async exportPlans(filters = {}) {
    try {
      const response = await this.getAllPlans(filters)
      const plans = response.data?.plans || response.data || []
      
      if (!plans || plans.length === 0) {
        throw new Error('No plans to export')
      }

      // Convert plans to CSV format
      const csvHeaders = [
        'Plan Name',
        'Description',
        'Duration',
        'Total Leads',
        'Leads Per Month',
        'Price (INR)',
        'Discounted Price (INR)',
        'Status',
        'Features Count',
        'Created Date',
        'Created By'
      ]

      const csvRows = plans.map(plan => [
        plan.planName,
        plan.description.replace(/,/g, ';'), // Replace commas to avoid CSV issues
        plan.duration,
        plan.totalLeads,
        plan.leadsPerMonth,
        `₹${plan.price}`,
        plan.discountedPrice ? `₹${plan.discountedPrice}` : '',
        plan.isActive ? 'Active' : 'Inactive',
        plan.features?.length || 0,
        new Date(plan.createdAt).toLocaleDateString(),
        plan.createdBy?.name || 'Unknown'
      ])

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `subscription-plans-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return { success: true, message: 'Plans exported successfully' }
    } catch (error) {
      console.error('Error exporting subscription plans:', error)
      throw error
    }
  }

  // Helper method to format currency
  formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Helper method to get duration display text
  getDurationDisplay(duration) {
    const durationMap = {
      '1-month': '1 Month',
      '3-month': '3 Months',
      '6-month': '6 Months',
      '12-month': '12 Months'
    }
    return durationMap[duration] || duration
  }

  // Helper method to validate plan data
  validatePlanData(planData) {
    const errors = []

    if (!planData.planName?.trim()) {
      errors.push('Plan name is required')
    }

    if (!planData.description?.trim()) {
      errors.push('Description is required')
    }

    if (!planData.duration) {
      errors.push('Duration is required')
    }

    if (!planData.totalLeads || planData.totalLeads < 1) {
      errors.push('Total leads must be at least 1')
    }

    if (!planData.price || planData.price < 0) {
      errors.push('Price (INR) must be a positive number')
    }

    if (planData.discountedPrice && planData.discountedPrice >= planData.price) {
      errors.push('Discounted price (INR) must be less than regular price')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Export singleton instance
export default new SubscriptionService() 