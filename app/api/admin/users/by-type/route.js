import connectDB from '@/lib/connnectDB'
import User from '@/lib/models/user'
import { requireAdmin } from '@/lib/dal'
import { database } from '@/lib/db'

export async function GET(req) {
  await connectDB();
  
  try {
    await requireAdmin();
    
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const userType = searchParams.get('role'); // Keep 'role' as parameter name for compatibility
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit')) || 50;
    
    console.log('DEBUG VENDORS: Query params:', { userType, search, limit });
    
    // Build query
    let query = {};
    
    if (userType && userType !== 'all') {
      query.type = userType; // Use 'type' field instead of 'role'
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('DEBUG VENDORS: Final query:', query);
    
    let users = [];
    
    // Special handling for vendors - get from vendors collection like subscription form
    if (userType === 'vendor') {
      const vendorsCollection = await database.getVendorsCollection();
      const usersCollection = await database.getUsersCollection();
      
      // Build vendor query
      let vendorQuery = {};
      if (search) {
        vendorQuery.$or = [
          { businessName: { $regex: search, $options: 'i' } },
          { 'address.city': { $regex: search, $options: 'i' } },
          { services: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Get vendors with user data
      const vendors = await vendorsCollection.aggregate([
        { $match: vendorQuery },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userData',
            pipeline: [
              { $project: { password: 0 } }
            ]
          }
        },
        { $unwind: '$userData' },
        { $limit: limit },
        { $sort: { createdAt: -1 } }
      ]).toArray();
      
      // Transform to match expected format
      users = vendors.map(vendor => ({
        _id: vendor.userData._id,
        name: vendor.businessName || vendor.userData.name,
        email: vendor.userData.email,
        phone: vendor.userData.phone,
        type: 'vendor',
        fcmToken: vendor.userData.fcmToken,
        businessName: vendor.businessName,
        status: vendor.status
      }));
      
      console.log('DEBUG VENDORS: Found', users.length, 'vendors from vendors collection');
    } else {
      // For non-vendor users, use the original approach
      users = await User.find(query)
        .select('_id name email phone type fcmToken')
        .limit(limit)
        .sort({ name: 1 });
      
      console.log('DEBUG VENDORS: Found', users.length, 'users from users collection');
    }
    
    console.log('DEBUG VENDORS: Total users in collection:', users.length);
    
    return new Response(JSON.stringify({ 
      success: true, 
      users: users.map(user => ({
        id: user._id,
        name: user.name || 'Unknown',
        email: user.email || '',
        phone: user.phone || '',
        role: user.type, // Return 'type' as 'role' for compatibility
        hasFcmToken: !!user.fcmToken,
        businessName: user.businessName, // Include business name for vendors
        status: user.status // Include status for vendors
      }))
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error('DEBUG VENDORS: Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 