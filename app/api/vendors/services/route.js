import { NextResponse } from 'next/server';
import servicesData from '@/lib/data/services.json';

/**
 * GET /api/vendors/services
 * Returns all available services for vendor registration
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let services = [];

    // Extract all services from categories
    servicesData.categories.forEach(category => {
      category.services.forEach(service => {
        services.push({
          id: service.id,
          name: service.name,
          description: service.description,
          category: {
            id: category.id,
            name: category.name,
            icon: category.icon
          },
          subServices: service.subServices.map(sub => ({
            name: sub.name,
            price: sub.price,
            note: sub.note || null
          }))
        });
      });
    });

    // Filter by category if specified
    if (category && category !== 'all') {
      services = services.filter(service => service.category.id === category);
    }

    // Filter by search term if specified
    if (search) {
      const searchTerm = search.toLowerCase();
      services = services.filter(service => 
        service.name.toLowerCase().includes(searchTerm) ||
        service.description.toLowerCase().includes(searchTerm) ||
        service.category.name.toLowerCase().includes(searchTerm)
      );
    }

    // Get unique categories for filter options
    const categories = servicesData.categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      serviceCount: cat.services.length
    }));

    return NextResponse.json({
      success: true,
      data: {
        services,
        categories,
        total: services.length,
        filters: {
          category: category || null,
          search: search || null
        }
      }
    });

  } catch (error) {
    console.error('Get vendor services error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch services'
    }, { status: 500 });
  }
}

/**
 * GET /api/vendors/services/categories
 * Returns only categories for quick selection
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { serviceIds } = body;

    if (!serviceIds || !Array.isArray(serviceIds)) {
      return NextResponse.json({
        success: false,
        error: 'Service IDs array is required'
      }, { status: 400 });
    }

    // Get detailed service information for selected services
    const selectedServices = [];
    
    servicesData.categories.forEach(category => {
      category.services.forEach(service => {
        if (serviceIds.includes(service.id)) {
          selectedServices.push({
            id: service.id,
            name: service.name,
            description: service.description,
            category: {
              id: category.id,
              name: category.name,
              icon: category.icon
            },
            subServices: service.subServices.map(sub => ({
              name: sub.name,
              price: sub.price,
              note: sub.note || null
            }))
          });
        }
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        services: selectedServices,
        total: selectedServices.length
      }
    });

  } catch (error) {
    console.error('Get selected services error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch selected services'
    }, { status: 500 });
  }
} 