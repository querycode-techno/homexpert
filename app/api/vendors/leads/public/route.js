// /api/vendors/leads/public

import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import { ObjectId } from 'mongodb';

// GET /api/vendors/leads/public - Get public leads (sensitive data masked) to attract subscription purchase
export async function GET(request) {
  // Verify authentication (but don't require active subscription)
  const authResult = verifyVendorToken(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error, authResult.status);
  }

  try {
    const { vendorId, userId } = authResult.user;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const service = searchParams.get('service');
    const location = searchParams.get('location');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const skip = (page - 1) * limit;

    // Get database collections
    const leadsCollection = await database.getLeadsCollection();
    const subscriptionHistoryCollection = await database.getSubscriptionHistoryCollection();
    const vendorsCollection = await database.getVendorsCollection();

    // Check if vendor has active subscription
    const activeSubscription = await subscriptionHistoryCollection.findOne({
      user: new ObjectId(userId),
      status: 'active',
      isActive: true
    });

    // Get vendor details including their services
    const vendor = await vendorsCollection.findOne({ _id: new ObjectId(vendorId) });

    if (!vendor) {
      return NextResponse.json({
        success: false,
        error: 'Vendor not found'
      }, { status: 404 });
    }

    // Helper function to check if lead service matches vendor services
    const isServiceMatch = (leadService, leadSelectedService, leadSelectedSubService, vendorServices) => {
      if (!vendorServices || vendorServices.length === 0) return false;
      
      // Convert vendor services to lowercase for case-insensitive comparison
      const vendorServicesLower = vendorServices.map(s => s.toLowerCase().trim());
      
      // Check exact matches first
      const leadServiceLower = leadService?.toLowerCase().trim();
      const leadSelectedServiceLower = leadSelectedService?.toLowerCase().trim();
      const leadSelectedSubServiceLower = leadSelectedSubService?.toLowerCase().trim();
      
      // 1. Exact match with vendor service
      if (leadServiceLower && vendorServicesLower.includes(leadServiceLower)) {
        return true;
      }
      
      // 2. Exact match with selected service
      if (leadSelectedServiceLower && vendorServicesLower.includes(leadSelectedServiceLower)) {
        return true;
      }
      
      // 3. Exact match with selected sub-service
      if (leadSelectedSubServiceLower && vendorServicesLower.includes(leadSelectedSubServiceLower)) {
        return true;
      }
      
      // 4. Partial match - check if vendor service is contained in lead service
      for (const vendorService of vendorServicesLower) {
        if (leadServiceLower && leadServiceLower.includes(vendorService)) {
          return true;
        }
        if (leadSelectedServiceLower && leadSelectedServiceLower.includes(vendorService)) {
          return true;
        }
        if (leadSelectedSubServiceLower && leadSelectedSubServiceLower.includes(vendorService)) {
          return true;
        }
      }
      
      // 5. Reverse partial match - check if lead service is contained in vendor service
      for (const vendorService of vendorServicesLower) {
        if (leadServiceLower && vendorService.includes(leadServiceLower)) {
          return true;
        }
        if (leadSelectedServiceLower && vendorService.includes(leadSelectedServiceLower)) {
          return true;
        }
        if (leadSelectedSubServiceLower && vendorService.includes(leadSelectedSubServiceLower)) {
          return true;
        }
      }
      
      return false;
    };

    // Helper function to check if lead location matches vendor's service areas
    const isLocationMatch = (leadAddress, vendorAddress, vendorServiceAreas) => {
      if (!leadAddress) return false;
      
      const leadAddressLower = leadAddress.toLowerCase().trim();
      
      // 1. Check vendor's primary city
      if (vendorAddress?.city) {
        const vendorCityLower = vendorAddress.city.toLowerCase().trim();
        if (leadAddressLower.includes(vendorCityLower)) {
          return { match: true, type: 'primary_city', area: vendorAddress.city };
        }
      }
      
      // 2. Check vendor's state (broader match)
      if (vendorAddress?.state) {
        const vendorStateLower = vendorAddress.state.toLowerCase().trim();
        if (leadAddressLower.includes(vendorStateLower)) {
          return { match: true, type: 'same_state', area: vendorAddress.state };
        }
      }
      
      // 3. Check service areas if defined
      if (vendorServiceAreas && vendorServiceAreas.length > 0) {
        for (const serviceArea of vendorServiceAreas) {
          // Check service area city
          if (serviceArea.city) {
            const serviceAreaCityLower = serviceArea.city.toLowerCase().trim();
            if (leadAddressLower.includes(serviceAreaCityLower)) {
              return { match: true, type: 'service_area_city', area: serviceArea.city };
            }
          }
          
          // Check specific areas within service area
          if (serviceArea.areas && serviceArea.areas.length > 0) {
            for (const area of serviceArea.areas) {
              const areaLower = area.toLowerCase().trim();
              if (leadAddressLower.includes(areaLower)) {
                return { match: true, type: 'service_area_specific', area: area };
              }
            }
          }
        }
      }
      
      return { match: false, type: 'no_match', area: null };
    };

    // Build query for pending leads (not assigned to any vendor yet)
    const query = {
      status: 'pending', // Only pending leads that haven't been assigned
      $or: [
        { 'availableToVendors.vendor': { $size: 0 } },
        { 'availableToVendors.vendor': { $exists: false } }
      ]
    };

    // Add location filter based on vendor's city and service areas
    if (vendor.address?.city || (vendor.address?.serviceAreas && vendor.address.serviceAreas.length > 0)) {
      const locationConditions = [];
      
      // Add vendor's primary city
      if (vendor.address.city) {
        const cityRegex = new RegExp(vendor.address.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        locationConditions.push({ address: cityRegex });
      }
      
      // Add vendor's state for broader coverage
      if (vendor.address.state) {
        const stateRegex = new RegExp(vendor.address.state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        locationConditions.push({ address: stateRegex });
      }
      
      // Add service areas if defined
      if (vendor.address.serviceAreas && vendor.address.serviceAreas.length > 0) {
        for (const serviceArea of vendor.address.serviceAreas) {
          if (serviceArea.city) {
            const serviceAreaCityRegex = new RegExp(serviceArea.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            locationConditions.push({ address: serviceAreaCityRegex });
          }
          
          if (serviceArea.areas && serviceArea.areas.length > 0) {
            for (const area of serviceArea.areas) {
              const areaRegex = new RegExp(area.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
              locationConditions.push({ address: areaRegex });
            }
          }
        }
      }
      
      // Add location filtering to main query
      if (locationConditions.length > 0) {
        query.$and = query.$and || [];
        query.$and.push({ $or: locationConditions });
      }
    }

    // Add service filter based on vendor's services
    if (vendor.services && vendor.services.length > 0) {
      // Create service filter conditions
      const serviceConditions = [];
      
      for (const vendorService of vendor.services) {
        const serviceRegex = new RegExp(vendorService.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        serviceConditions.push(
          { service: serviceRegex },
          { selectedService: serviceRegex },
          { selectedSubService: serviceRegex }
        );
      }
      
      // Add service filtering to main query
      query.$and = query.$and || [];
      query.$and.push({ $or: serviceConditions });
    }

    // Add additional service filter from query params
    if (service) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { service: new RegExp(service, 'i') },
          { selectedService: new RegExp(service, 'i') },
          { selectedSubService: new RegExp(service, 'i') }
        ]
      });
    }

    // Add additional location filter from query params
    if (location) {
      query.$and = query.$and || [];
      query.$and.push({ address: new RegExp(location, 'i') });
    }

    // Add price filter
    if (maxPrice) {
      query.price = { $lte: parseInt(maxPrice) };
    }

    // Get total count for pagination
    const totalCount = await leadsCollection.countDocuments(query);

    // Build sort options
    const sortOptions = {};
    switch (sortBy) {
      case 'price':
        sortOptions.price = sortOrder === 'asc' ? 1 : -1;
        break;
      default:
        sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;
    }

    // Get leads with pagination
    const leads = await leadsCollection
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Filter leads on application level for more precise matching
    const relevantLeads = leads.filter(lead => {
      const serviceMatch = isServiceMatch(lead.service, lead.selectedService, lead.selectedSubService, vendor.services);
      const locationMatch = isLocationMatch(lead.address, vendor.address, vendor.address?.serviceAreas);
      return serviceMatch && locationMatch.match;
    });

    // Helper function to mask sensitive data
    const maskSensitiveData = (text, visibleChars = 2) => {
      if (!text) return '****';
      if (text.length <= visibleChars) return '****';
      return text.substring(0, visibleChars) + '****';
    };

    const maskPhone = (phone) => {
      if (!phone) return '****';
      return phone.substring(0, 3) + '****' + phone.substring(phone.length - 2);
    };

    const maskEmail = (email) => {
      if (!email) return '****';
      const [username, domain] = email.split('@');
      if (!domain) return '****';
      return username.substring(0, 2) + '****@' + domain;
    };

    const maskAddress = (address) => {
      if (!address) return '****';
      const words = address.split(' ');
      if (words.length <= 2) return words[0] + ' ****';
      return words.slice(0, 2).join(' ') + ' ****';
    };

    // Format leads data with masked sensitive information
    const formattedLeads = relevantLeads.map(lead => {
      const now = new Date();
      const hoursAgo = Math.floor((now - lead.createdAt) / (1000 * 60 * 60));
      const isUrgent = hoursAgo >= 24;

      // Calculate service relevance score
      const vendorServicesLower = vendor.services.map(s => s.toLowerCase().trim());
      const leadServiceLower = lead.service?.toLowerCase().trim();
      const leadSelectedServiceLower = lead.selectedService?.toLowerCase().trim();
      const leadSelectedSubServiceLower = lead.selectedSubService?.toLowerCase().trim();
      
      let relevanceScore = 0;
      let matchType = 'partial';
      
      // Exact matches get higher scores
      if (vendorServicesLower.includes(leadServiceLower)) {
        relevanceScore = 100;
        matchType = 'exact';
      } else if (vendorServicesLower.includes(leadSelectedServiceLower)) {
        relevanceScore = 90;
        matchType = 'exact';
      } else if (vendorServicesLower.includes(leadSelectedSubServiceLower)) {
        relevanceScore = 85;
        matchType = 'exact';
      } else {
        // Partial matches get lower scores
        relevanceScore = 60;
        matchType = 'partial';
      }

      // Calculate location relevance
      const locationMatch = isLocationMatch(lead.address, vendor.address, vendor.address?.serviceAreas);
      let locationRelevanceScore = 0;
      
      if (locationMatch.match) {
        switch (locationMatch.type) {
          case 'primary_city':
            locationRelevanceScore = 100;
            break;
          case 'service_area_city':
            locationRelevanceScore = 90;
            break;
          case 'service_area_specific':
            locationRelevanceScore = 85;
            break;
          case 'same_state':
            locationRelevanceScore = 60;
            break;
          default:
            locationRelevanceScore = 50;
        }
      }

      // Combined relevance score (service 70% + location 30%)
      const combinedRelevanceScore = Math.round((relevanceScore * 0.7) + (locationRelevanceScore * 0.3));

      return {
        id: lead._id.toString(),
        
        // Customer info - MASKED
        customerName: maskSensitiveData(lead.customerName, 3),
        customerPhone: maskPhone(lead.customerPhone),
        customerEmail: maskEmail(lead.customerEmail),
        
        // Service details - VISIBLE (to attract vendors)
        service: lead.service,
        selectedService: lead.selectedService,
        selectedSubService: lead.selectedSubService,
        description: lead.description.length > 100 ? 
          lead.description.substring(0, 100) + '... [Subscribe to view full details]' : 
          lead.description,
        
        // Service relevance information
        serviceRelevance: {
          score: relevanceScore,
          matchType: matchType,
          matchedService: vendorServicesLower.find(vs => 
            leadServiceLower?.includes(vs) || 
            leadSelectedServiceLower?.includes(vs) || 
            leadSelectedSubServiceLower?.includes(vs) ||
            vs === leadServiceLower ||
            vs === leadSelectedServiceLower ||
            vs === leadSelectedSubServiceLower
          )
        },

        // Location relevance information
        locationRelevance: {
          score: locationRelevanceScore,
          matchType: locationMatch.type,
          matchedArea: locationMatch.area,
          isLocalArea: locationMatch.type === 'primary_city' || locationMatch.type === 'service_area_specific'
        },

        // Combined relevance score
        overallRelevance: {
          score: combinedRelevanceScore,
          serviceWeight: 70,
          locationWeight: 30
        },
        
        // Location - PARTIALLY MASKED
        address: maskAddress(lead.address),
        area: lead.address.split(',')[0] || 'Area ****', // Show general area only
        
        // Pricing - VISIBLE (to attract vendors)
        price: lead.price,
        getQuote: lead.getQuote,
        priceRange: lead.price ? `₹${lead.price}` : 'Quote Required',
        
        // Scheduling - VISIBLE
        preferredDate: lead.preferredDate,
        preferredTime: lead.preferredTime,
        
        // Status and timing
        status: 'available', // Show as available to encourage subscription
        createdAt: lead.createdAt,
        hoursAgo,
        isUrgent,
        urgency: isUrgent ? 'urgent' : 'normal',
        
        // Lead attractiveness indicators
        estimatedValue: lead.price || 0,
        hasExactPrice: !!lead.price && !lead.getQuote,
        requiresQuote: lead.getQuote,
        
        // Masked additional info
        additionalNotes: lead.additionalNotes ? 
          'Additional requirements available [Subscribe to view]' : null,
        
        // Premium content indicators
        isPremiumLead: true,
        subscriberBenefits: [
          'View complete customer contact details',
          'Access full address and location',
          'See complete project description',
          'Contact customer directly',
          'Get follow-up reminders'
        ]
      };
    });

    // Sort by combined relevance score (highest first) then by creation date
    formattedLeads.sort((a, b) => {
      if (a.overallRelevance.score !== b.overallRelevance.score) {
        return b.overallRelevance.score - a.overallRelevance.score;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Get statistics about available leads for this vendor
    const vendorRelevantLeadsQuery = {
      status: 'pending',
      $and: []
    };

    // Add location filtering for stats
    if (vendor.address?.city || (vendor.address?.serviceAreas && vendor.address.serviceAreas.length > 0)) {
      const locationConditions = [];
      
      // Add vendor's primary city
      if (vendor.address.city) {
        const cityRegex = new RegExp(vendor.address.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        locationConditions.push({ address: cityRegex });
      }
      
      // Add vendor's state for broader coverage
      if (vendor.address.state) {
        const stateRegex = new RegExp(vendor.address.state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        locationConditions.push({ address: stateRegex });
      }
      
      // Add service areas if defined
      if (vendor.address.serviceAreas && vendor.address.serviceAreas.length > 0) {
        for (const serviceArea of vendor.address.serviceAreas) {
          if (serviceArea.city) {
            const serviceAreaCityRegex = new RegExp(serviceArea.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            locationConditions.push({ address: serviceAreaCityRegex });
          }
          
          if (serviceArea.areas && serviceArea.areas.length > 0) {
            for (const area of serviceArea.areas) {
              const areaRegex = new RegExp(area.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
              locationConditions.push({ address: areaRegex });
            }
          }
        }
      }
      
      if (locationConditions.length > 0) {
        vendorRelevantLeadsQuery.$and.push({ $or: locationConditions });
      }
    }

    // Add service filtering for stats
    if (vendor.services && vendor.services.length > 0) {
      const serviceConditions = [];
      for (const vendorService of vendor.services) {
        const serviceRegex = new RegExp(vendorService.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        serviceConditions.push(
          { service: serviceRegex },
          { selectedService: serviceRegex },
          { selectedSubService: serviceRegex }
        );
      }
      vendorRelevantLeadsQuery.$and.push({ $or: serviceConditions });
    }

    const totalRelevantLeads = await leadsCollection.countDocuments(vendorRelevantLeadsQuery);
    const totalValueRelevant = await leadsCollection.aggregate([
      { $match: { ...vendorRelevantLeadsQuery, price: { $exists: true, $ne: null } } },
      { $group: { _id: null, totalValue: { $sum: '$price' } } }
    ]);

    const estimatedValue = totalValueRelevant[0]?.totalValue || 0;

    // Subscription plans for call-to-action
    const subscriptionPlansCollection = await database.getSubscriptionPlansCollection();
    const plans = await subscriptionPlansCollection
      .find({ isActive: true })
      .sort({ price: 1 })
      .limit(3)
      .toArray();

    const formattedPlans = plans.map(plan => ({
      id: plan._id.toString(),
      planName: plan.planName,
      duration: plan.duration,
      totalLeads: plan.totalLeads,
      price: plan.price,
      discountedPrice: plan.discountedPrice,
      effectivePrice: plan.discountedPrice || plan.price,
      pricePerLead: Math.round((plan.discountedPrice || plan.price) / plan.totalLeads)
    }));

    // Pagination info (based on filtered results)
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(formattedLeads.length / limit),
      totalCount: formattedLeads.length,
      hasNextPage: page < Math.ceil(formattedLeads.length / limit),
      hasPrevPage: page > 1
    };

    return NextResponse.json({
      success: true,
      data: {
        leads: formattedLeads,
        subscriptionRequired: !activeSubscription,
        subscription: activeSubscription ? {
          id: activeSubscription._id.toString(),
          planName: activeSubscription.planSnapshot.planName,
          leadsRemaining: activeSubscription.usage.leadsRemaining,
          status: 'active'
        } : null,
        vendorServices: vendor.services, // Show vendor's services for reference
        vendorLocation: {
          city: vendor.address?.city,
          state: vendor.address?.state,
          serviceAreas: vendor.address?.serviceAreas || []
        },
        serviceFiltering: {
          enabled: true,
          message: `Showing leads relevant to your services: ${vendor.services.join(', ')}`,
          totalRelevantLeads,
          exactMatches: formattedLeads.filter(l => l.serviceRelevance.matchType === 'exact').length,
          partialMatches: formattedLeads.filter(l => l.serviceRelevance.matchType === 'partial').length
        },
        locationFiltering: {
          enabled: true,
          message: `Filtered by location: ${vendor.address?.city}${vendor.address?.state ? ', ' + vendor.address.state : ''}`,
          primaryCity: vendor.address?.city,
          state: vendor.address?.state,
          serviceAreas: vendor.address?.serviceAreas || [],
          localLeads: formattedLeads.filter(l => l.locationRelevance.isLocalArea).length,
          nearbyLeads: formattedLeads.filter(l => !l.locationRelevance.isLocalArea).length
        },
        marketOverview: {
          totalRelevantLeads,
          estimatedTotalValue: estimatedValue,
          averageLeadValue: totalRelevantLeads > 0 ? Math.round(estimatedValue / totalRelevantLeads) : 0,
          newRelevantLeadsToday: await leadsCollection.countDocuments({
            ...vendorRelevantLeadsQuery,
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          })
        },
        callToAction: {
          title: activeSubscription ? 
            'You have an active subscription!' : 
            'Subscribe now to access relevant leads for your services!',
          message: activeSubscription ?
            'Start taking leads that match your expertise and grow your business.' :
            `Join thousands of vendors earning more with leads specifically filtered for your services (${vendor.services.join(', ')}) in ${vendor.address?.city || 'your area'}`,
          benefits: [
            'View complete customer contact information',
            'Access exact addresses and locations',
            'See full project descriptions and requirements',
            'Direct customer communication',
            'Lead management and follow-up tools',
            'Priority customer support',
            'Performance analytics and insights'
          ],
          urgencyMessage: `${totalRelevantLeads} relevant leads worth ₹${estimatedValue.toLocaleString()} waiting for vendors like you!`
        },
        availablePlans: formattedPlans,
        filters: {
          appliedFilters: {
            service: service || null,
            location: location || null,
            maxPrice: maxPrice || null,
            vendorServices: vendor.services,
            vendorCity: vendor.address?.city,
            vendorState: vendor.address?.state
          },
          availableServices: vendor.services
        },
        pagination
      },
      meta: {
        requiresSubscription: !activeSubscription,
        leadPreviewMode: true,
        serviceFilteringEnabled: true,
        locationFilteringEnabled: true,
        upgradeUrl: '/api/vendors/subscriptions'
      }
    });

  } catch (error) {
    console.error('Get public leads error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch public leads'
    }, { status: 500 });
  }
}