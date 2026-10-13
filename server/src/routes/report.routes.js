import { Router } from 'express';
import { z } from 'zod';
import * as reportController from '../controllers/report.controller.js';
import { uploadMiddleware } from '../services/storage/storage.service.js';

const router = Router({ mergeParams: true });

// Note: req.org and req.membership are already attached via orgScope on /api/o/:slug

// 1. Create Lost or Found Report (supports multipart for image upload)
router.post(
  '/',
  uploadMiddleware.single('photo'),
  reportController.createReport
);

// 2. Member's own reports
router.get('/mine', reportController.getMyReports);

// 3. Published found items feed
router.get('/found', reportController.getFoundReports);

// 4. View single report
router.get('/:id', reportController.getReportById);

export default router;
