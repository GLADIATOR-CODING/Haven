import { asyncHandler } from '../utils/asyncHandler.js';
import * as notificationService from '../services/notification.service.js';

export const getUserNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(
    req.org._id,
    req.user._id,
    req.query.limit
  );
  res.status(200).json(result);
});

export const markAsRead = asyncHandler(async (req, res) => {
  const updated = await notificationService.markNotificationRead(
    req.org._id,
    req.user._id,
    req.params.id
  );
  res.status(200).json({ notification: updated });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllNotificationsRead(
    req.org._id,
    req.user._id
  );
  res.status(200).json(result);
});
