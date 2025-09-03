import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { verifyVendorToken, createAuthErrorResponse } from '@/lib/middleware/vendorAuth';
import { ObjectId } from 'mongodb';
import connectDB from '@/lib/connnectDB';
import User from '@/lib/models/user';
import admin from '@/lib/firebase/admin';

// Helper function to send notification to all admins
async function sendNotificationToAdmins(title, message) {
  try {
    await connectDB();
    
    // Fetch all admin users with FCM tokens
    const adminUsers = await User.find({ 
      type: 'admin',
      fcmToken: { $exists: true, $ne: null, $ne: '' }
    }).select('_id fcmToken');
    
    if (adminUsers.length === 0) {
      console.log('No admin users with FCM tokens found');
      return;
    }
    
    // Extract FCM tokens
    const tokens = adminUsers.map(user => user.fcmToken).filter(Boolean);
    
    if (tokens.length === 0) {
      console.log('No valid FCM tokens found for admin users');
      return;
    }
    
    // Prepare notification message
    const notificationMessage = {
      notification: {
        title,
        body: message,
      },
    };
    
    // Send notification based on number of tokens
    if (tokens.length === 1) {
      try {
        const result = await admin.messaging().send({ 
          ...notificationMessage, 
          token: tokens[0] 
        });
        console.log('Successfully sent notification to single admin:', result);
      } catch (error) {
        console.log('Failed to send notification to single admin:', error.message);
        // Remove invalid token
        const userWithInvalidToken = adminUsers.find(user => user.fcmToken === tokens[0]);
        if (userWithInvalidToken) {
          await User.findByIdAndUpdate(userWithInvalidToken._id, { fcmToken: null });
        }
      }
    } else {
      try {
        const result = await admin.messaging().sendEachForMulticast({ 
          ...notificationMessage, 
          tokens 
        });
        console.log(`Sent notifications to ${result.successCount} admins, ${result.failureCount} failed`);
        
        // Handle failed tokens
        if (result.failureCount > 0) {
          const failedTokens = [];
          result.responses.forEach((response, index) => {
            if (!response.success) {
              failedTokens.push({
                token: tokens[index],
                error: response.error
              });
            }
          });
          
          // Remove invalid tokens
          for (const failedToken of failedTokens) {
            if (failedToken.error.code === 'messaging/invalid-registration-token' || 
                failedToken.error.code === 'messaging/registration-token-not-registered') {
              await User.findOneAndUpdate(
                { fcmToken: failedToken.token },
                { fcmToken: null }
              );
            }
          }
        }
      } catch (error) {
        console.log('Failed to send multicast notification to admins:', error.message);
      }
    }
  } catch (error) {
    console.error('Error sending notification to admins:', error);
  }
}

// POST /api/vendors/logs - Create a new vendor log entry
export async function POST(request) {
  // Verify authentication
  // const authResult = verifyVendorToken(request);
  // if (!authResult.success) {
  //   return createAuthErrorResponse(authResult.error, authResult.status);
  // }

  try {
    // const { userId } = authResult.user;

    const body = await request.json();
    const { type, leadId, subscriptionId, notificationTitle, notificationMessage, userId } = body;

    // Validate required fields
    if (!type || !['lead', 'subscription'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid log type. Must be either "lead" or "subscription"' },
        { status: 400 }
      );
    }

    // Validate that appropriate ID is provided based on type
    if (type === 'lead' && !leadId) {
      return NextResponse.json(
        { error: 'leadId is required when type is "lead"' },
        { status: 400 }
      );
    }

    if (type === 'subscription' && !subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId is required when type is "subscription"' },
        { status: 400 }
      );
    }

    // Get vendor logs collection
    const vendorLogsCollection = await database.getVendorLogsCollection();

    // Create log entry
    const logEntry = {
      userId: new ObjectId(userId),
      type,
      time: new Date(),
      ...(leadId && { leadId: new ObjectId(leadId) }),
      ...(subscriptionId && { subscriptionId: new ObjectId(subscriptionId) })
    };

    // Insert the log entry
    const result = await vendorLogsCollection.insertOne(logEntry);

    // send notification to all admin
    if (notificationTitle && notificationMessage) {
      // Send notification to all admins (non-blocking)
      sendNotificationToAdmins(notificationTitle, notificationMessage).catch(error => {
        console.error('Failed to send notification to admins:', error);
      });
    }
    

    return NextResponse.json({
      success: true,
      message: 'Log entry created successfully',
      logId: result.insertedId.toString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating vendor log:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
