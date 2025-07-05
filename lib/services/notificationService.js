

export async function fetchAdminNotifications(userId) {
  console.log("userId", userId);
  const res = await fetch(`/api/admin/notifications?userId=${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch notifications');
  }
  const data = await res.json();
  return data.notifications;
}

// Create a new notification (POST)
export async function createNotification({ title, message, messageType, target, userId }) {
  const res = await fetch('/api/admin/notifications', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, message, messageType, target, userId }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to create notification");
  }

  const data = await res.json();
  return data.notification;
}

// mark as read method
export async function markAsRead(notificationId, userId) {
  const res = await fetch('/api/admin/notifications/mark_as_read', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ notificationId, userId }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to mark as read");
  }

  const data = await res.json();
  return data;
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

export async function userCreateLeadsNotificationFromUserSide({title, message}){
  try{
    const res = await fetch('/api/notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, message }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to create notification");
    }

    const data = await res.json();
    return data.notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}