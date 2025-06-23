import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import servicesData from '@/lib/data/services.json'

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Utility functions for services data
 */
export const serviceUtils = {
  // Get all service names from all categories
  getAllServices: () => {
    const services = []
    servicesData.categories.forEach(category => {
      category.services.forEach(service => {
        services.push(service.name)
      })
    })
    return services
  },

  // Get all service categories
  getCategories: () => {
    return servicesData.categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon
    }))
  },

  // Get services by category
  getServicesByCategory: (categoryId) => {
    const category = servicesData.categories.find(cat => cat.id === categoryId)
    return category ? category.services : []
  },

  // Get all sub-services
  getAllSubServices: () => {
    const subServices = []
    servicesData.categories.forEach(category => {
      category.services.forEach(service => {
        service.subServices.forEach(subService => {
          subServices.push(subService.name)
        })
      })
    })
    return subServices
  },

  // Get primary services for homepage (first 5 categories)
  getPrimaryServices: () => {
    return servicesData.categories.slice(0, 5).map(category => ({
      title: category.name,
      description: `Professional ${category.name.toLowerCase()} services`,
      icon: category.icon,
      id: category.id
    }))
  },

  // Search services
  searchServices: (query) => {
    const results = []
    const lowerQuery = query.toLowerCase()
    
    servicesData.categories.forEach(category => {
      category.services.forEach(service => {
        if (service.name.toLowerCase().includes(lowerQuery) ||
            service.description.toLowerCase().includes(lowerQuery) ||
            service.subServices.some(sub => sub.name.toLowerCase().includes(lowerQuery))) {
          results.push({
            category: category.name,
            categoryId: category.id,
            service: service.name,
            serviceId: service.id,
            description: service.description
          })
        }
      })
    })
    
    return results
  }
}