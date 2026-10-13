import * as reportService from '../services/reports/report.service.js';
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

  const fileBuffer = req.file?.buffer || null;
  const result = await reportService.createReport(req.org, req.user, payload, fileBuffer);
  res.status(201).json(result);
});

export const getMyReports = asyncHandler(async (req, res) => {
  const reports = await reportService.getMyReports(req.org._id, req.user._id, req.org);
  res.status(200).json({ reports });
});

export const getFoundReports = asyncHandler(async (req, res) => {
  const reports = await reportService.getPublishedFoundReports(req.org._id, req.query, req.org);
  res.status(200).json({ reports });
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
