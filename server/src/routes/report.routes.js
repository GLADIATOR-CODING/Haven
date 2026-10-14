import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';
import { uploadMiddleware } from '../services/storage/storage.service.js';
import { authorize } from '../middlewares/authorize.js';

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

// 4. Get matches for a report
router.get('/:id/matches', reportController.getReportMatches);

// 5. Dismiss a match
router.post('/matches/:matchId/dismiss', reportController.dismissMatch);

// 6. Review sensitive report (Admin or Moderator only)
router.post('/:id/review', authorize('admin', 'moderator'), reportController.reviewReport);

// 7. Update report status (resolve or cancel)
router.patch('/:id/status', reportController.updateReportStatus);

// 8. View single report
router.get('/:id', reportController.getReportById);

export default router;

