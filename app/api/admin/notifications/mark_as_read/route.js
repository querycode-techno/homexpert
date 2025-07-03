import NotificationRecipient from "@/lib/models/notificationRecipient";
import connectDB from "@/lib/connnectDB";

// mark as read
export async function POST(req) {
    const { notificationId, userId } = await req.json();
    await connectDB();
    try {
      const notificationRecipient = await NotificationRecipient.findOne({ notificationId, userId });
      notificationRecipient.read = true;
      await notificationRecipient.save();
      return new Response(JSON.stringify({ success: true  }), { status: 200 });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, message: error.message }), { status: 400 });
    }
}