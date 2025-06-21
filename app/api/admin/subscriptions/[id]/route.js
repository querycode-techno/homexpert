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

// GET - Fetch single subscription plan by ID
export async function GET(request, { params }) {
  try {
    await requireAdmin();

    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid plan ID format' 
        },
        { status: 400 }
      );
    }

    const subscriptionsCollection = await database.getCollection('subscriptionplans');
    const usersCollection = await database.getUsersCollection();

    const plan = await subscriptionsCollection.findOne({ 
      _id: new ObjectId(String(id)) 
    });

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subscription plan not found'
        }, 
        { status: 404 }
      );
    }

    // Populate creator and modifier information
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

    return NextResponse.json({
      success: true,
      data: plan
    });

  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch subscription plan',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// PUT - Update subscription plan
export async function PUT(request, { params }) {
  try {
    const adminUser = await requireAdmin();

    const { id } = params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid plan ID format' 
        },
        { status: 400 }
      );
    }

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
      isActive
    } = body;

    // Validation
    if (planName && !planName.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Plan name cannot be empty' 
        },
        { status: 400 }
      );
    }

    if (totalLeads && totalLeads < 1) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Total leads must be at least 1' 
        },
        { status: 400 }
      );
    }

    if (price && price < 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Price must be 0 or greater' 
        },
        { status: 400 }
      );
    }

    if (discountedPrice && price && discountedPrice >= price) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Discounted price must be less than regular price' 
        },
        { status: 400 }
      );
    }

    const subscriptionsCollection = await database.getCollection('subscriptionplans');
    const usersCollection = await database.getUsersCollection();

    // Check if plan exists
    const existingPlan = await subscriptionsCollection.findOne({ 
      _id: new ObjectId(String(id)) 
    });
    
    if (!existingPlan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subscription plan not found'
        }, 
        { status: 404 }
      );
    }

    // Check if planName is being changed and if it conflicts with existing plans
    if (planName && planName.trim() !== existingPlan.planName) {
      const duplicatePlan = await subscriptionsCollection.findOne({ 
        planName: planName.trim(),
        _id: { $ne: new ObjectId(String(id)) }
      });
      
      if (duplicatePlan) {
        return NextResponse.json(
          {
            success: false,
            error: 'A plan with this name already exists'
          }, 
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date(),
      lastModifiedBy: new ObjectId(String(adminUser.user.id))
    };

    // Only update fields that are provided
    if (planName !== undefined) updateData.planName = planName.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (duration !== undefined) {
      updateData.duration = duration;
      // Recalculate duration in days and leads per month
      const durationMap = {
        '1-month': 30,
        '3-month': 90,
        '6-month': 180,
        '12-month': 365
      };
      updateData.durationInDays = durationMap[duration];
      if (totalLeads !== undefined) {
        updateData.leadsPerMonth = Math.ceil(totalLeads / (updateData.durationInDays / 30));
      } else {
        updateData.leadsPerMonth = Math.ceil(existingPlan.totalLeads / (updateData.durationInDays / 30));
      }
    }
    if (totalLeads !== undefined) {
      updateData.totalLeads = parseInt(totalLeads);
      // Recalculate leads per month if duration hasn't changed
      if (duration === undefined) {
        updateData.leadsPerMonth = Math.ceil(totalLeads / (existingPlan.durationInDays / 30));
      }
    }
    if (price !== undefined) updateData.price = parseFloat(price);
    if (discountedPrice !== undefined) {
      updateData.discountedPrice = discountedPrice ? parseFloat(discountedPrice) : null;
    }
    if (features !== undefined) updateData.features = features;
    if (limitations !== undefined) updateData.limitations = limitations;
    if (tags !== undefined) updateData.tags = tags;
    if (notes !== undefined) updateData.notes = notes || '';
    if (tncLink !== undefined) updateData.tncLink = tncLink || '';
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update the plan
    await subscriptionsCollection.updateOne(
      { _id: new ObjectId(String(id)) },
      { $set: updateData }
    );

    // Fetch updated plan with populated fields
    const updatedPlan = await subscriptionsCollection.findOne({ 
      _id: new ObjectId(String(id)) 
    });

    // Populate creator and modifier information
    if (updatedPlan.createdBy) {
      const creator = await usersCollection.findOne(
        { _id: updatedPlan.createdBy },
        { projection: { name: 1, email: 1 } }
      );
      updatedPlan.createdBy = creator;
    }

    if (updatedPlan.lastModifiedBy) {
      const modifier = await usersCollection.findOne(
        { _id: updatedPlan.lastModifiedBy },
        { projection: { name: 1, email: 1 } }
      );
      updatedPlan.lastModifiedBy = modifier;
    }

    // Add virtual fields (equivalent to Mongoose virtuals)
    addVirtualFields(updatedPlan);

    return NextResponse.json({
      success: true,
      data: updatedPlan,
      message: 'Subscription plan updated successfully'
    });

  } catch (error) {
    console.error('Error updating subscription plan:', error);
    
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
        error: 'Failed to update subscription plan',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete subscription plan
export async function DELETE(request, { params }) {
  try {
    await requireAdmin();

    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid plan ID format' 
        },
        { status: 400 }
      );
    }

    const subscriptionsCollection = await database.getCollection('subscriptionplans');

    const plan = await subscriptionsCollection.findOne({ 
      _id: new ObjectId(String(id)) 
    });
    
    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subscription plan not found'
        }, 
        { status: 404 }
      );
    }

    // TODO: Add check for active subscriptions using this plan
    // For now, we'll allow deletion but in production you might want to prevent
    // deletion of plans that have active subscribers

    await subscriptionsCollection.deleteOne({ 
      _id: new ObjectId(String(id)) 
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription plan deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete subscription plan',
        details: error.message
      },
      { status: 500 }
    );
  }
} 