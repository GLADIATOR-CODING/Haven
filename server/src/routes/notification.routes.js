import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';

const router = Router({ mergeParams: true });

// Scoped notifications for authenticated member
router.get('/', notificationController.getUserNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.post('/mark-all-read', notificationController.markAllAsRead);

export default router;
