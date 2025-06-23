import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/dal';
import { database } from '@/lib/database-utils';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const session = await requireAdmin();
    const adminUserId = session.user.id;

    const vendorsCollection = await database.getVendorsCollection();
    
    // Find vendors with inconsistencies
    const inconsistentVendors = await vendorsCollection.find({
      $or: [
        // Verified but status is pending
        { 
          'verified.isVerified': true, 
          'status': 'pending' 
        },
        // Verified but no verifiedBy
        { 
          'verified.isVerified': true, 
          'verified.verifiedBy': null 
        },
        // Has verification history without performedBy
        {
          'history': {
            $elemMatch: {
              'action': 'verified',
              'performedBy': null
            }
          }
        }
      ]
    }).toArray();

    const fixedVendors = [];

    for (const vendor of inconsistentVendors) {
      const updates = {};
      let needsUpdate = false;

      // Fix verified status and missing verifiedBy
      if (vendor.verified?.isVerified && !vendor.verified?.verifiedBy) {
        updates['verified.verifiedBy'] = new ObjectId(adminUserId);
        if (!vendor.verified.verifiedAt) {
          updates['verified.verifiedAt'] = new Date();
        }
        needsUpdate = true;
      }

      // Fix status if verified but still pending
      if (vendor.verified?.isVerified && vendor.status === 'pending') {
        updates.status = 'active';
        needsUpdate = true;
      }

      // Fix history entries with null performedBy
      if (vendor.history && vendor.history.length > 0) {
        const fixedHistory = vendor.history.map(entry => {
          if ((entry.action === 'verified' || entry.action === 'registered') && !entry.performedBy) {
            return {
              ...entry,
              performedBy: new ObjectId(adminUserId)
            };
          }
          return entry;
        });

        // Check if any changes were made
        const hasChanges = vendor.history.some((entry, index) => 
          !entry.performedBy && (entry.action === 'verified' || entry.action === 'registered')
        );

        if (hasChanges) {
          updates.history = fixedHistory;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        updates.updatedAt = new Date();
        
        await vendorsCollection.updateOne(
          { _id: vendor._id },
          { $set: updates }
        );

        fixedVendors.push({
          vendorId: vendor._id,
          businessName: vendor.businessName,
          fixes: Object.keys(updates)
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedVendors.length} vendors with inconsistencies`,
      fixedVendors
    });

  } catch (error) {
    console.error('Error fixing vendor inconsistencies:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fix vendor inconsistencies' 
      },
      { status: 500 }
    );
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 