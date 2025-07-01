import Notification from "@/lib/models/notification";
import connectDB from "@/lib/connnectDB";

// mark as read
export async function POST(req) {
    const { notificationId } = await req.json();
    await connectDB();
    try {
      const updated = await Notification.findById(notificationId);
      updated.read = true;
      await updated.save();
      return new Response(JSON.stringify({ success: true  }), { status: 200 });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, message: error.message }), { status: 400 });
    }
}