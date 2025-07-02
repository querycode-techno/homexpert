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

    // Get vendor details
    const vendor = await vendorsCollection.findOne({ _id: new ObjectId(vendorId) });

    // Build query for pending leads (not assigned to any vendor yet)
    const query = {
      status: 'pending', // Only pending leads that haven't been assigned
      $or: [
        { 'availableToVendors.vendor': { $size: 0 } },
        { 'availableToVendors.vendor': { $exists: false } }
      ]
    };

    // Add service filter
    if (service) {
      query.service = new RegExp(service, 'i');
    }

    // Add location filter (broad area)
    if (location) {
      query.address = new RegExp(location, 'i');
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
    const formattedLeads = leads.map(lead => {
      const now = new Date();
      const hoursAgo = Math.floor((now - lead.createdAt) / (1000 * 60 * 60));
      const isUrgent = hoursAgo >= 24;

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

    // Get statistics about available leads
    const totalPendingLeads = await leadsCollection.countDocuments({ status: 'pending' });
    const totalValuePending = await leadsCollection.aggregate([
      { $match: { status: 'pending', price: { $exists: true, $ne: null } } },
      { $group: { _id: null, totalValue: { $sum: '$price' } } }
    ]);

    const estimatedValue = totalValuePending[0]?.totalValue || 0;

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

    // Pagination info
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasNextPage: page < Math.ceil(totalCount / limit),
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
        marketOverview: {
          totalPendingLeads,
          estimatedTotalValue: estimatedValue,
          averageLeadValue: totalPendingLeads > 0 ? Math.round(estimatedValue / totalPendingLeads) : 0,
          newLeadsToday: await leadsCollection.countDocuments({
            status: 'pending',
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          })
        },
        callToAction: {
          title: activeSubscription ? 
            'You have an active subscription!' : 
            'Subscribe now to access full lead details!',
          message: activeSubscription ?
            'Start taking leads and grow your business.' :
            'Join thousands of vendors earning more with our premium lead service.',
          benefits: [
            'View complete customer contact information',
            'Access exact addresses and locations',
            'See full project descriptions and requirements',
            'Direct customer communication',
            'Lead management and follow-up tools',
            'Priority customer support',
            'Performance analytics and insights'
          ],
          urgencyMessage: `${totalPendingLeads} leads worth ₹${estimatedValue.toLocaleString()} waiting for vendors like you!`
        },
        availablePlans: formattedPlans,
        filters: {
          appliedFilters: {
            service: service || null,
            location: location || null,
            maxPrice: maxPrice || null
          },
          availableServices: vendor?.services || []
        },
        pagination
      },
      meta: {
        requiresSubscription: !activeSubscription,
        leadPreviewMode: true,
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