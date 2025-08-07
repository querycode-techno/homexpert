import connectDB from '@/lib/connnectDB'
import Notification from '@/lib/models/notification'
import NotificationRecipient from '@/lib/models/notificationRecipient'
import User from '@/lib/models/user'
import admin from '@/lib/firebase/admin'
import { requireAdmin } from '@/lib/dal'
import mongoose from 'mongoose'

export async function POST(req) {
  await connectDB();
  
  try {
    await requireAdmin();
    
    const body = await req.json();
    const { notificationId, userId } = body;

    // Basic validation
    if (!notificationId || !userId) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get the original notification
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return new Response(
        JSON.stringify({ success: false, message: "Notification not found." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get all recipients for this notification
    const recipients = await NotificationRecipient.find({ notificationId });
    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No recipients found for this notification." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get users with FCM tokens
    const recipientUserIds = recipients.map(r => r.userId);
    //console.log('Debug - Recipient user IDs:', recipientUserIds);
    
    // First try to find users in the User collection
    let users = await User.find({ _id: { $in: recipientUserIds } }).select("_id fcmToken type");
    //console.log('Debug - Users found in User collection:', users.length);
    
    // If we didn't find all users, check if they're in the vendors collection
    if (users.length < recipientUserIds.length) {
      //console.log('Debug - Some users not found in User collection, checking vendors collection...');
      const vendorsCollection = mongoose.connection.collection('vendors');
      
      const vendorUsers = await vendorsCollection.find({ 
        _id: { $in: recipientUserIds.filter(id => !users.find(u => u._id.toString() === id.toString())) }
      }).toArray();
      
      //console.log('Debug - Vendors found:', vendorUsers.length);
      
      // Transform vendor data to match user format
      const transformedVendors = vendorUsers.map(vendor => ({
        _id: vendor._id,
        fcmToken: vendor.fcmToken || null,
        type: 'vendor'
      }));
      
      users = [...users, ...transformedVendors];
    }
    
    //console.log('Debug - All users found:', users.map(u => ({ id: u._id, fcmToken: u.fcmToken ? 'present' : 'null', type: u.type })));
    
    const usersWithTokens = users.filter(user => user.fcmToken && user.fcmToken.trim() !== '');
    const usersWithoutTokens = users.filter(user => !user.fcmToken || user.fcmToken.trim() === '');
    
    //console.log('Debug - Users with tokens:', usersWithTokens.map(u => ({ id: u._id, fcmToken: u.fcmToken ? 'present' : 'null' })));
    //console.log('Debug - Users without tokens:', usersWithoutTokens.map(u => ({ id: u._id, fcmToken: u.fcmToken ? 'present' : 'null' })));

    //console.log(`Resending notification to ${users.length} users`);
    //console.log(`Users with FCM tokens: ${usersWithTokens.length}`);
    //console.log(`Users without FCM tokens: ${usersWithoutTokens.length}`);

    // Send FCM notifications to users with tokens
    let deliveredCount = 0;
    let failedCount = 0;

    if (usersWithTokens.length > 0) {
      const tokens = usersWithTokens.map(user => user.fcmToken).filter(Boolean);
      //console.log('Debug - Tokens to send:', tokens.length);
      
      const mesg = {
        notification: {
          title: notification.title,
          body: notification.message,
        },
      };

      if (tokens.length === 1) {
        try {
          //console.log('Debug - Sending to single token:', tokens[0].substring(0, 20) + '...');
          await admin.messaging().send({ ...mesg, token: tokens[0] });
          deliveredCount++;
          //console.log('Debug - Single token sent successfully');
          
          // Update delivery status
          const userWithToken = usersWithTokens.find(user => user.fcmToken === tokens[0]);
          if (userWithToken) {
            await NotificationRecipient.findOneAndUpdate(
              { notificationId: notification._id, userId: userWithToken._id },
              { 
                $set: { deliveryStatus: "delivered" },
                $inc: { deliveryAttempts: 1 }
              }
            );
            //console.log('Debug - Updated delivery status for user:', userWithToken._id);
          }
        } catch (error) {
          //console.log('Failed to resend to single token:', error.message);
          failedCount++;
          
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
              { 
                $set: { deliveryStatus: "failed" },
                $inc: { deliveryAttempts: 1 }
              }
            );
          }
        }
      } else if (tokens.length > 1) {
        try {
          //console.log('Debug - Sending to multiple tokens:', tokens.length);
          const sendResult = await admin.messaging().sendEachForMulticast({ ...mesg, tokens });
          deliveredCount += sendResult.successCount;
          failedCount += sendResult.failureCount;
          //console.log('Debug - Multicast result:', { successCount: sendResult.successCount, failureCount: sendResult.failureCount });
          
          // Update delivery status for each token
          sendResult.responses.forEach((response, index) => {
            const token = tokens[index];
            const userWithToken = usersWithTokens.find(user => user.fcmToken === token);
            
            if (userWithToken) {
              const deliveryStatus = response.success ? "delivered" : "failed";
              
              NotificationRecipient.findOneAndUpdate(
                { notificationId: notification._id, userId: userWithToken._id },
                { 
                  $set: { deliveryStatus },
                  $inc: { deliveryAttempts: 1 }
                }
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
              }
            }
          }
        } catch (error) {
          //console.log('Failed to resend multicast message:', error.message);
          failedCount += usersWithTokens.length;
          
          // Mark all as failed
          for (const user of usersWithTokens) {
            await NotificationRecipient.findOneAndUpdate(
              { notificationId: notification._id, userId: user._id },
              { 
                $set: { deliveryStatus: "failed" },
                $inc: { deliveryAttempts: 1 }
              }
            );
          }
        }
      }
    }

    // Update notification with resend timestamp
    await Notification.findByIdAndUpdate(notificationId, {
      $set: { lastResentAt: new Date() }
    });

    //console.log('Debug - Final counts:', { deliveredCount, failedCount, totalRecipients: users.length });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification resent successfully",
        deliveredCount,
        failedCount,
        totalRecipients: users.length
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    //console.log('Debug - Error in resend:', error.message);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 