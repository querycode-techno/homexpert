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

// PATCH - Toggle subscription plan active status
export async function PATCH(request, { params }) {
  try {
    const adminUser = await requireAdmin();

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

    // Toggle the active status
    const newStatus = !plan.isActive;
    
    await subscriptionsCollection.updateOne(
      { _id: new ObjectId(String(id)) },
      { 
        $set: { 
          isActive: newStatus,
                     lastModifiedBy: new ObjectId(String(adminUser.user.id)),
          updatedAt: new Date()
        }
      }
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

    const action = newStatus ? 'activated' : 'deactivated';

    return NextResponse.json({
      success: true,
      data: updatedPlan,
      message: `Subscription plan ${action} successfully`
    });

  } catch (error) {
    console.error('Error toggling subscription plan status:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to toggle subscription plan status',
        details: error.message
      },
      { status: 500 }
    );
  }
} 