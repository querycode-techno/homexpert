import connectDB from '@/lib/connnectDB'
import Notification from '@/lib/models/notification'
import NotificationRecipient from '@/lib/models/notificationRecipient'
import { requireAdmin } from '@/lib/dal'

export async function DELETE(req) {
  await connectDB();
  
  try {
    await requireAdmin();
    
    const body = await req.json();
    const { userId } = body;

    // Basic validation
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: "User ID is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete all notifications created by this admin
    const deleteResult = await Notification.deleteMany({ createdBy: userId });
    
    // Delete all notification recipients for these notifications
    // Note: This will delete recipients for notifications that were just deleted
    // In a more robust implementation, you might want to delete recipients first
    const recipientDeleteResult = await NotificationRecipient.deleteMany({ 
      userId: userId,
      userType: "admin"
    });

    console.log(`Cleared ${deleteResult.deletedCount} notifications and ${recipientDeleteResult.deletedCount} recipients for user: ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "All notifications cleared successfully",
        deletedNotifications: deleteResult.deletedCount,
        deletedRecipients: recipientDeleteResult.deletedCount
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.log('Error clearing notifications:', error.message);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 