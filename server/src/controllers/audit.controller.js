import { asyncHandler } from '../utils/asyncHandler.js';
import * as auditService from '../services/audit.service.js';

export const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await auditService.getAuditLogs(req.org._id, req.query);
  res.status(200).json(result);
});

export const exportAuditCsv = asyncHandler(async (req, res) => {
  const csvData = await auditService.generateAuditCsv(req.org._id);
  const orgSlug = req.org?.slug || 'workspace';
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `haven-custody-audit-${orgSlug}-${timestamp}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csvData);
});
