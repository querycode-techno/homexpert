import connectDB from '@/lib/connnectDB'
import User from '@/lib/models/user'
import Notification from '@/lib/models/notification'
import admin from '@/lib/firebase/admin'
import { NextResponse } from 'next/server'

export async function GET(req) {
  await connectDB();

  try {
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .lean();

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

  try {
    const body = await req.json();
    const { title, message, type, target, isBulkNotification, createdBy , date, time} = body;

    // Basic validation
    if (!title || !message || !type || !target ||  !createdBy) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

     // get all admins userId and fcmToken from users collection
     const admins = await User.find({ type: type }).select("_id fcmToken,type");



    const notification = new Notification({
      title,
      message,
      type,
      target,
      isBulkNotification:true,
      bulkRecipients: admins.map(admin => ({
        userId: admin._id,
        userType: admin.type,
        deliveryStatus: "pending",
      })),
      createdBy,
      date,
      time,
      read:true,
    });

    await notification.save();

      // send notification to all admins
      const tokens = admins.map(admin => admin.fcmToken).filter(Boolean);

     const mesg = {
      notification: {
          title,
          body: message,
      },
  };

  let sendResult = null;

  if (tokens.length === 1) {
      // Send to a Single Token
      sendResult = await admin.messaging().send({ ...mesg, token: tokens[0] });
      console.log('Successfully sent message to single token:', sendResult);
  } else if (tokens.length > 1) {
      // Send to Multiple Tokens
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