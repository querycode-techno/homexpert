import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { requireAdmin } from '@/lib/dal';

export async function POST(request) {
  try {
    //await requireAdmin();

    const subscriptionPlansCollection = await database.getSubscriptionPlansCollection();

    // Update all existing plans to add missing fields
    const result = await subscriptionPlansCollection.updateMany(
      {
        $or: [
          { isCustom: { $exists: false } },
          { assignedToVendors: { $exists: false } }
        ]
      },
      {
        $set: {
          isCustom: false,
          assignedToVendors: []
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${result.modifiedCount} subscription plans`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error fixing subscription schema:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fix subscription schema'
    }, { status: 500 });
  }
}