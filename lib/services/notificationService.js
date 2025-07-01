

const API_URL = "/api/admin/notifications"

// Fetch all notifications (GET)
export async function fetchNotifications() {
  const res = await fetch(API_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch notifications");
  }

  const data = await res.json();
  return data.notifications;
}

// Create a new notification (POST)
export async function createNotification({ title, message, type, target, isBulkNotification, createdBy , date, time}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, message, type, target, isBulkNotification, createdBy, date, time


     }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to create notification");
  }

  const data = await res.json();
  return data.notification;
}

// mark as read method
export async function markAsRead(notificationId) {
  const res = await fetch(`${API_URL}/mark_as_read`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ notificationId }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to mark as read");
  }

  const data = await res.json();
  return data.notification;
}

// delete notification by id
export async function deleteNotification(id) {
 try {
    const res = await fetch(`${API_URL}`, {
        body: JSON.stringify({ id: id }),
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to delete notification");
    }
    const data = await res.json();
    return data.notification;
 } catch (error) {
  console.log(error);
 }
}