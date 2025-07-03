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
    const users = await User.find({ type: target }).select("_id fcmToken type");

    // Create the notification document
    const notification = new Notification({
      title,
      message,
      messageType,
      createdBy: userId,
      target:target,
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

    // Create NotificationRecipient documents for each user
    const recipientDocs = users.map(user => ({
      notificationId: notification._id,
      userId: user._id,
      userType: user.type,
      deliveryStatus: "pending",
      deliveryAttempts: 0,
    }));
    await NotificationRecipient.insertMany(recipientDocs);

    // Send notification to all users via FCM
    const tokens = users.map(user => user.fcmToken).filter(Boolean);
    const mesg = {
      notification: {
        title,
        body: message,
      },
    };

    let sendResult = null;
    if (tokens.length === 1) {
      sendResult = await admin.messaging().send({ ...mesg, token: tokens[0] });
      console.log('Successfully sent message to single token:', sendResult);
    } else if (tokens.length > 1) {
      sendResult = await admin.messaging().sendEachForMulticast({ ...mesg, tokens });
      console.log('Sent messages to multiple tokens. Success count:', sendResult.successCount);
      console.log('Failure count:', sendResult.failureCount);
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