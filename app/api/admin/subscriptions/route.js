import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { requireAdmin } from '@/lib/dal';
import { ObjectId } from 'mongodb';

// Helper function to add virtual fields to plan objects
function addVirtualFields(plan) {
  plan.effectivePrice = plan.discountedPrice || plan.price;
  plan.isDiscounted = plan.discountedPrice && plan.discountedPrice < plan.price;
  plan.discountPercentage = plan.isDiscounted 
    ? Math.round(((plan.price - plan.discountedPrice) / plan.price) * 100)
    : 0;
  plan.pricePerLead = Math.round(plan.effectivePrice / plan.totalLeads);

  // Calculate monthly equivalent
  const durationMap = {
    '1-month': 1,
    '3-month': 3,
    '6-month': 6,
    '12-month': 12
  };
  const months = durationMap[plan.duration] || 1;
  plan.monthlyEquivalent = Math.round(plan.effectivePrice / months);
  
  return plan;
}

// GET - Fetch all subscription plans with optional filtering
export async function GET(request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const duration = searchParams.get('duration') || '';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'createdAt';

    const subscriptionsCollection = await database.getCollection('subscriptionplans');
    const usersCollection = await database.getUsersCollection();

    // Build query
    let query = {};
    
    // Search across multiple fields
    if (search) {
      query.$or = [
        { planName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Filter by status if specified
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Filter by duration if specified
    if (duration) {
      query.duration = duration;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await subscriptionsCollection.countDocuments(query);

    // Sort options
    const sortOptions = {
      price: { price: 1 },
      duration: { durationInDays: 1 },
      name: { planName: 1 },
      leads: { totalLeads: 1 },
      createdAt: { createdAt: -1 }
    };

    // Get subscription plans
    const plans = await subscriptionsCollection
      .find(query)
      .sort(sortOptions[sortBy] || sortOptions.createdAt)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Populate creator information and add virtual fields
    for (let plan of plans) {
      // Populate creator information
      if (plan.createdBy) {
        const creator = await usersCollection.findOne(
          { _id: plan.createdBy },
          { projection: { name: 1, email: 1 } }
        );
        plan.createdBy = creator;
      }
      if (plan.lastModifiedBy) {
        const modifier = await usersCollection.findOne(
          { _id: plan.lastModifiedBy },
          { projection: { name: 1, email: 1 } }
        );
        plan.lastModifiedBy = modifier;
      }
      // Add virtual fields (equivalent to Mongoose virtuals)
      addVirtualFields(plan);
    }

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        plans,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch subscription plans',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST - Create new subscription plan
export async function POST(request) {
  try {
    const adminUser = await requireAdmin();

    const body = await request.json();
    const {
      planName,
      description,
      duration,
      totalLeads,
      price,
      discountedPrice,
      features = [],
      limitations = {},
      tags = [],
      notes,
      tncLink,
      isCustom = false,
      assignedToVendors = []
    } = body;

    // Validation
    if (!planName || !description || !duration || !totalLeads || !price) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: planName, description, duration, totalLeads, price' 
        },
        { status: 400 }
      );
    }

    // Validate duration
    const validDurations = ['1-month', '3-month', '6-month', '12-month'];
    if (!validDurations.includes(duration)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid duration. Must be one of: ' + validDurations.join(', ')
        },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (totalLeads < 1) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Total leads must be at least 1' 
        },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Price must be 0 or greater' 
        },
        { status: 400 }
      );
    }

    if (discountedPrice && discountedPrice >= price) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Discounted price must be less than regular price' 
        },
        { status: 400 }
      );
    }

    const subscriptionsCollection = await database.getCollection('subscriptionplans');

    // Check if plan name already exists
    const existingPlan = await subscriptionsCollection.findOne({ 
      planName: planName.trim() 
    });
    if (existingPlan) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'A plan with this name already exists' 
        },
        { status: 409 }
      );
    }

    // Calculate duration in days and leads per month
    const durationMap = {
      '1-month': 30,
      '3-month': 90,
      '6-month': 180,
      '12-month': 365
    };
    const durationInDays = durationMap[duration];
    const leadsPerMonth = Math.ceil(totalLeads / (durationInDays / 30));

    // Create subscription plan data
    const planData = {
      planName: planName.trim(),
      description: description.trim(),
      duration,
      durationInDays,
      totalLeads: parseInt(totalLeads),
      leadsPerMonth,
      price: parseFloat(price),
      discountedPrice: discountedPrice ? parseFloat(discountedPrice) : null,
      currency: 'INR',
      isActive: true,
      isCustom: Boolean(isCustom),
      assignedToVendors: assignedToVendors.map(id => new ObjectId(String(id))),
      features,
      limitations,
      tags,
      notes: notes || '',
      tncLink: tncLink || '',
      createdBy: new ObjectId(String(adminUser.user.id)),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create new subscription plan
    const result = await subscriptionsCollection.insertOne(planData);

    // Fetch the created plan with creator information
    const newPlan = await subscriptionsCollection.findOne({ _id: result.insertedId });
    
    // Populate creator information and add virtual fields
    const usersCollection = await database.getUsersCollection();
    if (newPlan.createdBy) {
      const creator = await usersCollection.findOne(
        { _id: newPlan.createdBy },
        { projection: { name: 1, email: 1 } }
      );
      newPlan.createdBy = creator;
    }

    // Add virtual fields (equivalent to Mongoose virtuals)
    addVirtualFields(newPlan);

    return NextResponse.json({
      success: true,
      message: 'Subscription plan created successfully',
      data: newPlan
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating subscription plan:', error);

    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return NextResponse.json(
        { 
          success: false, 
          error: `${field} already exists` 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create subscription plan',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 