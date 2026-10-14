import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { uploadMiddleware } from '../services/storage/storage.service.js';

const router = Router({ mergeParams: true });

// POST /api/o/:slug/ai/parse-query (Describe-it sentence parser)
router.post('/parse-query', aiController.parseQuery);

// POST /api/o/:slug/ai/analyze-image (Multimodal item classification & PII detection)
router.post('/analyze-image', uploadMiddleware.single('image'), aiController.analyzeImage);

// GET /api/o/:slug/ai/analytics-digest (Operational intelligence summary)
router.get('/analytics-digest', aiController.getAnalyticsDigest);

export default router;
