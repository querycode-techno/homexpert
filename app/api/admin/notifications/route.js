import connectDB from '@/lib/connnectDB'
import User from '@/lib/models/user'
import Notification from '@/lib/models/notification'
import admin from '@/lib/firebase/admin'
import NotificationRecipient from '@/lib/models/notificationRecipient'


export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const userId = searchParams.get('userId');

  console.log("userId", userId);

  const userType = "admin"; // as per your requirement

  try {
    // Find all notificationRecipient docs for this admin
    const recipientDocs = await NotificationRecipient.find({
      userId,
      userType,
    })
      .sort({ createdAt: -1 })
      .populate('notificationId');

    // Extract notifications
    const notifications = recipientDocs
    .filter(rec => rec.notificationId)
    .map(rec => ({
      ...rec.notificationId.toObject(), // all notification fields
      read: rec.read,                  // only 'read' from NotificationRecipient
    }));

    return new Response(JSON.stringify({ success: true, notifications }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}



export async function POST(req) {
  await connectDB();

  const userType = "admin"; // as per your requirement

  try {
    const body = await req.json();
    const { title, message, messageType, target, userId} = body;

    // Basic validation
    if (!title || !message || !messageType || !target ) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get all users of the target type (e.g., admin)
    const users = await User.find({ type: { $in: ['vendor', 'admin'] } }).select("_id fcmToken type");
    
    // Filter out users without FCM tokens
    const usersWithTokens = users.filter(user => user.fcmToken && user.fcmToken.trim() !== '');
    const usersWithoutTokens = users.filter(user => !user.fcmToken || user.fcmToken.trim() === '');
    
    console.log(`Total users found: ${users.length}`);
    console.log(`Users with FCM tokens: ${usersWithTokens.length}`);
    console.log(`Users without FCM tokens: ${usersWithoutTokens.length}`);

    // Create the notification document
    const notification = new Notification({
      title,
      message,
      messageType,
      createdBy: userId,
      target: target,
    });
    await notification.save();

    // addd this notification to admin notification collection
    const adminNotification = new NotificationRecipient({
      notificationId: notification._id,
      userId: userId,
      userType: userType,
      deliveryStatus: "delivered",
      deliveryAttempts: 1,
      read: true,
    });
    await adminNotification.save();

    // Create NotificationRecipient documents for ALL users (with or without tokens)
    const recipientDocs = users.map(user => ({
      notificationId: notification._id,
      userId: user._id,
      userType: user.type,
      deliveryStatus: user.fcmToken ? "pending" : "failed", 
      deliveryAttempts: user.fcmToken ? 0 : 1, // Set attempts to 1 for users without tokens
    }));
    await NotificationRecipient.insertMany(recipientDocs);

    // Send notification only to users with valid FCM tokens
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
          console.log('Successfully sent message to single token:', sendResult);
          
          // Update delivery status for successful send
          const userWithToken = usersWithTokens.find(user => user.fcmToken === tokens[0]);
          if (userWithToken) {
            await NotificationRecipient.findOneAndUpdate(
              { notificationId: notification._id, userId: userWithToken._id },
              { deliveryStatus: "delivered", deliveryAttempts: 1 }
            );
          }
        } catch (error) {
          console.log('Failed to send to single token:', error.message);
          // Remove invalid token from user
          const userWithInvalidToken = usersWithTokens.find(user => user.fcmToken === tokens[0]);
          if (userWithInvalidToken) {
            await User.findByIdAndUpdate(userWithInvalidToken._id, { fcmToken: null });
            await NotificationRecipient.findOneAndUpdate(
              { notificationId: notification._id, userId: userWithInvalidToken._id },
              { deliveryStatus: "failed", deliveryAttempts: 1 }
            );
            console.log(`Removed invalid FCM token for user: ${userWithInvalidToken._id}`);
          }
        }
      } else if (tokens.length > 1) {
        try {
          sendResult = await admin.messaging().sendEachForMulticast({ ...mesg, tokens });
          console.log('Sent messages to multiple tokens. Success count:', sendResult.successCount);
          console.log('Failure count:', sendResult.failureCount);
          
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
                await User.findOneAndUpdate(
                  { fcmToken: failedToken.token },
                  { fcmToken: null }
                );
                console.log(`Removed invalid FCM token: ${failedToken.token}`);
              }
            }
          }
        } catch (error) {
          console.log('Failed to send multicast message:', error.message);
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
      console.log('No users with FCM tokens found. Notifications saved to database only.');
    }

    return new Response(
      JSON.stringify({ success: true, notification }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// delete notification by id
export async function DELETE(req) {
  await connectDB();

  try {
    const { id } = await req.json();

    const notification = await Notification.findByIdAndDelete(id);

    return new Response(JSON.stringify({ success: true, notification }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 