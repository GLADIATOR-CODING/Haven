import { Router } from 'express';
import * as auditController from '../controllers/audit.controller.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router({ mergeParams: true });

// Custody transfer log endpoints (Admin & Moderator staff only)
router.get('/logs', authorize('admin', 'moderator'), auditController.getAuditLogs);
router.get('/export', authorize('admin', 'moderator'), auditController.exportAuditCsv);

export default router;
