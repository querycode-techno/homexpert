import connectDB from '@/lib/connnectDB'
import User from '@/lib/models/user'
import Notification from '@/lib/models/notification'
import admin from '@/lib/firebase/admin'
import NotificationRecipient from '@/lib/models/notificationRecipient'
import { requireAdmin } from '@/lib/dal'
import mongoose from 'mongoose'

export async function POST(req) {
  await connectDB();
  
  try {
    await requireAdmin();
    
    const body = await req.json();
    const { 
      title, 
      message, 
      messageType, 
      targetType, // 'broad' or 'specific'
      targetUserRole, // for broad targeting: 'vendor', 'admin', etc.
      specificUserIds, // for specific targeting: array of user IDs
      userId // admin creating the notification
    } = body;

    // Basic validation
    if (!title || !message || !messageType || !targetType) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate targetType specific requirements
    if (targetType === 'broad' && !targetUserRole) {
      return new Response(
        JSON.stringify({ success: false, message: "Target user role is required for broad targeting." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (targetType === 'specific' && (!specificUserIds || !Array.isArray(specificUserIds) || specificUserIds.length === 0)) {
      return new Response(
        JSON.stringify({ success: false, message: "Specific user IDs array is required for specific targeting." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create the notification document
    const notification = new Notification({
      title,
      message,
      messageType,
      createdBy: userId,
      target: targetType === 'broad' ? targetUserRole : 'specific',
    });
    await notification.save();

    // Add notification to admin's notification collection
    const adminNotification = new NotificationRecipient({
      notificationId: notification._id,
      userId: userId,
      userType: "admin",
      deliveryStatus: "delivered",
      deliveryAttempts: 1,
      read: true,
    });
    await adminNotification.save();

    // Get target users based on targeting type
    let targetUsers = [];
    
    if (targetType === 'broad') {
      // Get all users of the specified type from User collection
      let users = await User.find({ type: targetUserRole }).select("_id fcmToken type");
      //console.log(`Found ${users.length} users in User collection for role: ${targetUserRole}`);
      
      // If targeting vendors, also check the vendors collection
      if (targetUserRole === 'vendor') {
        //console.log('Checking vendors collection for vendor users...');
        const vendorsCollection = mongoose.connection.collection('vendors');
        
        const vendors = await vendorsCollection.find({}).toArray();
        //console.log(`Found ${vendors.length} vendors in vendors collection`);
        
        // Debug: Check vendor document structure
        // if (vendors.length > 0) {
        //   //console.log('Debug - Sample vendor document structure:', {
        //     _id: vendors[0]._id,
        //     fcmToken: vendors[0].fcmToken,
        //     hasFcmToken: !!vendors[0].fcmToken,
        //     fcmTokenType: typeof vendors[0].fcmToken,
        //     allFields: Object.keys(vendors[0])
        //   });
        // }
        
        // Transform vendor data to match user format
        const transformedVendors = vendors.map(vendor => ({
          _id: vendor._id,
          fcmToken: vendor.fcmToken || null,
          type: 'vendor'
        }));
        
        // Debug: Check FCM tokens in vendors
        //const vendorsWithTokens = transformedVendors.filter(v => v.fcmToken && v.fcmToken.trim() !== '');
        // //console.log(`Debug - Vendors with FCM tokens: ${vendorsWithTokens.length}`);
        // //console.log(`Debug - Sample vendor FCM tokens:`, vendorsWithTokens.slice(0, 3).map(v => ({
        //   id: v._id,
        //   fcmToken: v.fcmToken ? v.fcmToken.substring(0, 20) + '...' : 'null'
        // })));
        
        // Combine users from both collections
        targetUsers = [...users, ...transformedVendors];
        //console.log(`Total target users (users + vendors): ${targetUsers.length}`);
      } else {
        targetUsers = users;
      }
    } else if (targetType === 'specific') {
      // Get specific users by their IDs
      let users = await User.find({ _id: { $in: specificUserIds } }).select("_id fcmToken type");
      
      // If we didn't find all users, check vendors collection
      if (users.length < specificUserIds.length) {
        const vendorsCollection = mongoose.connection.collection('vendors');
        
        const missingIds = specificUserIds.filter(id => !users.find(u => u._id.toString() === id.toString()));
        const vendors = await vendorsCollection.find({ _id: { $in: missingIds } }).toArray();
        
        const transformedVendors = vendors.map(vendor => ({
          _id: vendor._id,
          fcmToken: vendor.fcmToken || null,
          type: 'vendor'
        }));
        
        targetUsers = [...users, ...transformedVendors];
      } else {
        targetUsers = users;
      }
    }

    if (targetUsers.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No target users found." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Filter users with and without FCM tokens
    const usersWithTokens = targetUsers.filter(user => user.fcmToken && user.fcmToken.trim() !== '');
    const usersWithoutTokens = targetUsers.filter(user => !user.fcmToken || user.fcmToken.trim() === '');

    //console.log(`Total target users: ${targetUsers.length}`);
    //console.log(`Users with FCM tokens: ${usersWithTokens.length}`);
    //console.log(`Users without FCM tokens: ${usersWithoutTokens.length}`);
    
    // Debug: Check FCM token detection
    //console.log('Debug - Sample users with tokens:', usersWithTokens.slice(0, 3).map(u => ({
    //   id: u._id,
    //   type: u.type,
    //   fcmToken: u.fcmToken ? u.fcmToken.substring(0, 20) + '...' : 'null'
    // })));
    
    // //console.log('Debug - Sample users without tokens:', usersWithoutTokens.slice(0, 3).map(u => ({
    //   id: u._id,
    //   type: u.type,
    //   fcmToken: u.fcmToken ? u.fcmToken.substring(0, 20) + '...' : 'null'
    // })));

    // Create NotificationRecipient documents for all target users
    const recipientDocs = targetUsers.map(user => ({
      notificationId: notification._id,
      userId: user._id,
      userType: user.type,
      deliveryStatus: user.fcmToken ? "pending" : "failed",
      deliveryAttempts: user.fcmToken ? 0 : 1,
    }));
    await NotificationRecipient.insertMany(recipientDocs);

    // Send FCM notifications to users with tokens
    if (usersWithTokens.length > 0) {
      const tokens = usersWithTokens.map(user => user.fcmToken).filter(Boolean);
      const mesg = {
        notification: {
          title,
          body: message,
        },
      };

      let sendResult = null;
      if (tokens.length === 1) {
        try {
          sendResult = await admin.messaging().send({ ...mesg, token: tokens[0] });
          //console.log('Successfully sent message to single token:', sendResult);
          
          // Update delivery status for successful send
          const userWithToken = usersWithTokens.find(user => user.fcmToken === tokens[0]);
          if (userWithToken) {
            await NotificationRecipient.findOneAndUpdate(
              { notificationId: notification._id, userId: userWithToken._id },
              { deliveryStatus: "delivered", deliveryAttempts: 1 }
            );
          }
        } catch (error) {
          //console.log('Failed to send to single token:', error.message);
          // Remove invalid token from user
          const userWithInvalidToken = usersWithTokens.find(user => user.fcmToken === tokens[0]);
          if (userWithInvalidToken) {
            // Try to update in User collection first
            const userUpdate = await User.findByIdAndUpdate(userWithInvalidToken._id, { fcmToken: null });
            
            // If not found in User collection, try vendors collection
            if (!userUpdate) {
              const vendorsCollection = mongoose.connection.collection('vendors');
              await vendorsCollection.updateOne(
                { _id: userWithInvalidToken._id },
                { $set: { fcmToken: null } }
              );
            }
            
            await NotificationRecipient.findOneAndUpdate(
              { notificationId: notification._id, userId: userWithInvalidToken._id },
              { deliveryStatus: "failed", deliveryAttempts: 1 }
            );
            //console.log(`Removed invalid FCM token for user: ${userWithInvalidToken._id}`);
          }
        }
      } else if (tokens.length > 1) {
        try {
          sendResult = await admin.messaging().sendEachForMulticast({ ...mesg, tokens });
          //console.log('Sent messages to multiple tokens. Success count:', sendResult.successCount);
          //console.log('Failure count:', sendResult.failureCount);
          
          // Update delivery status for each token
          sendResult.responses.forEach((response, index) => {
            const token = tokens[index];
            const userWithToken = usersWithTokens.find(user => user.fcmToken === token);
            
            if (userWithToken) {
              const deliveryStatus = response.success ? "delivered" : "failed";
              const deliveryAttempts = 1;
              
              NotificationRecipient.findOneAndUpdate(
                { notificationId: notification._id, userId: userWithToken._id },
                { deliveryStatus, deliveryAttempts }
              );
            }
          });
          
          // Handle failed tokens
          if (sendResult.failureCount > 0) {
            const failedTokens = [];
            sendResult.responses.forEach((response, index) => {
              if (!response.success) {
                failedTokens.push({
                  token: tokens[index],
                  error: response.error
                });
              }
            });
            
            // Remove invalid tokens from database
            for (const failedToken of failedTokens) {
              if (failedToken.error.code === 'messaging/invalid-registration-token' || 
                  failedToken.error.code === 'messaging/registration-token-not-registered') {
                // Try to remove from User collection first
                const userUpdate = await User.findOneAndUpdate(
                  { fcmToken: failedToken.token },
                  { fcmToken: null }
                );
                
                // If not found in User collection, try vendors collection
                if (!userUpdate) {
                  const vendorsCollection = mongoose.connection.collection('vendors');
                  await vendorsCollection.updateOne(
                    { fcmToken: failedToken.token },
                    { $set: { fcmToken: null } }
                  );
                }
                
                //console.log(`Removed invalid FCM token: ${failedToken.token}`);
              }
            }
          }
        } catch (error) {
          //console.log('Failed to send multicast message:', error.message);
          // Mark all as failed
          for (const user of usersWithTokens) {
            await NotificationRecipient.findOneAndUpdate(
              { notificationId: notification._id, userId: user._id },
              { deliveryStatus: "failed", deliveryAttempts: 1 }
            );
          }
        }
      }
    } else {
      //console.log('No users with FCM tokens found. Notifications saved to database only.');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notification,
        targetCount: targetUsers.length,
        deliveredCount: usersWithTokens.length,
        failedCount: usersWithoutTokens.length
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 