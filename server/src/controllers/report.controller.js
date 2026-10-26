import * as reportService from '../services/reports/report.service.js';
import * as matchingService from '../services/matching/matching.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createReport = asyncHandler(async (req, res) => {
  // If multipart form data is used, parse JSON fields if sent as strings
  let payload = req.body;
  if (typeof payload.colors === 'string') {
    try {
      payload.colors = JSON.parse(payload.colors);
    } catch {
      payload.colors = [payload.colors];
    }
  }
  if (typeof payload.privateDetailsInput === 'string') {
    try {
      payload.privateDetailsInput = JSON.parse(payload.privateDetailsInput);
    } catch {
      payload.privateDetailsInput = [];
    }
  }
  if (typeof payload.geo === 'string') {
    try {
      payload.geo = JSON.parse(payload.geo);
    } catch {
      payload.geo = null;
    }
  }

  const fileBuffer = req.file?.buffer || null;
  const result = await reportService.createReport(req.org, req.user, payload, fileBuffer);
  res.status(201).json(result);
});

export const getMyReports = asyncHandler(async (req, res) => {
  const reports = await reportService.getMyReports(req.org._id, req.user._id, req.org);
  res.status(200).json({ reports });
});

export const getFoundReports = asyncHandler(async (req, res) => {
  const userRole = req.membership?.role || 'member';
  const reports = await reportService.getPublishedFoundReports(
    req.org._id,
    req.query,
    req.org,
    userRole
  );

  let pendingCount = 0;
  if (userRole === 'admin' || userRole === 'moderator') {
    const { Report } = await import('../models/Report.js');
    pendingCount = await Report.countDocuments({
      orgId: req.org._id,
      type: 'found',
      status: 'pending_review',
    });
  }

  res.status(200).json({ reports, pendingCount });
});

export const getReportById = asyncHandler(async (req, res) => {
  const report = await reportService.getReportById(
    req.org._id,
    req.params.id,
    req.user,
    req.membership.role,
    req.org
  );
  res.status(200).json({ report });
});

export const getReportMatches = asyncHandler(async (req, res) => {
  const matches = await matchingService.getMatchesForReport(
    req.org._id,
    req.params.id,
    req.user,
    req.membership.role,
    req.org
  );
  res.status(200).json({ matches });
});

export const dismissMatch = asyncHandler(async (req, res) => {
  const match = await matchingService.dismissMatch(
    req.org._id,
    req.params.matchId,
    req.user,
    req.membership.role
  );
  res.status(200).json({ match });
});

export const updateReportStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const report = await reportService.updateReportStatus(
    req.org._id,
    req.params.id,
    req.user,
    req.membership.role,
    status,
    req.org
  );
  res.status(200).json({ report });
});

export const reviewReport = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const report = await reportService.reviewReport(
    req.params.id,
    action,
    req.user._id,
    req.org
  );
  res.status(200).json({ report });
});

