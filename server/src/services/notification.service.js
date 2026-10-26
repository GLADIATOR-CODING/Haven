import { Notification } from '../models/Notification.js';

export async function createNotification({ orgId, userId, type, title, message, link = '', meta = {} }) {
  if (!orgId || !userId || !type || !title || !message) {
    return null;
  }
  return Notification.create({
    orgId,
    userId,
    type,
    title,
    message,
    link,
    meta,
  });
}

export async function getUserNotifications(orgId, userId, limit = 25) {
  const boundedLimit = Math.min(Number(limit) || 25, 50);

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ orgId, userId })
      .sort({ createdAt: -1 })
      .limit(boundedLimit)
      .lean(),
    Notification.countDocuments({ orgId, userId, read: false }),
  ]);

  return {
    notifications,
    unreadCount,
  };
}

export async function markNotificationRead(orgId, userId, notificationId) {
  const updated = await Notification.findOneAndUpdate(
    { _id: notificationId, orgId, userId },
    { $set: { read: true } },
    { new: true }
  );
  return updated;
}

export async function markAllNotificationsRead(orgId, userId) {
  const result = await Notification.updateMany(
    { orgId, userId, read: false },
    { $set: { read: true } }
  );
  return { modifiedCount: result.modifiedCount };
}
