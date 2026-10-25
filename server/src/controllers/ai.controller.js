import { asyncHandler } from '../utils/asyncHandler.js';
import * as queryParserService from '../services/ai/queryParser.service.js';
import * as imageAnalyzerService from '../services/ai/imageAnalyzer.service.js';
import * as analyticsDigestService from '../services/ai/analyticsDigest.service.js';

export const parseQuery = asyncHandler(async (req, res) => {
  const { sentence = '' } = req.body;
  const parsed = await queryParserService.parseQuery(sentence, req.org);
  res.status(200).json({ parsed });
});

export const analyzeImage = asyncHandler(async (req, res) => {
  if (!req.file?.buffer) {
    return res.status(400).json({ error: { message: 'Image file is required.' } });
  }

  const analysis = await imageAnalyzerService.analyzeItemImage(
    req.file.buffer,
    req.file.mimetype,
    req.org
  );

  res.status(200).json({ analysis });
});

export const getAnalyticsDigest = asyncHandler(async (req, res) => {
  const isStaff = req.membership?.role === 'admin' || req.membership?.role === 'moderator';
  const digest = await analyticsDigestService.generateAnalyticsDigest(req.org, {
    isStaff,
    userRole: req.membership?.role || 'member',
  });
  res.status(200).json({ digest });
});

