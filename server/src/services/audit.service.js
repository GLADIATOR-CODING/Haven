import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';

export async function getAuditLogs(orgId, options = {}) {
  const limit = Math.min(Number(options.limit) || 50, 100);
  const skip = Math.max(Number(options.skip) || 0, 0);

  const filter = { orgId };
  if (options.targetType) {
    filter.targetType = options.targetType;
  }
  if (options.action) {
    filter.action = options.action;
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('actorId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return {
    logs: logs.map((l) => ({
      _id: l._id,
      action: l.action,
      targetType: l.targetType,
      targetId: l.targetId,
      actor: l.actorId
        ? { _id: l.actorId._id, name: l.actorId.name, email: l.actorId.email }
        : { name: 'System / Automated Policy', email: 'system@haven.local' },
      meta: l.meta || {},
      createdAt: l.createdAt,
    })),
    total,
    limit,
    skip,
  };
}

function escapeCsvField(val) {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function generateAuditCsv(orgId) {
  const logs = await AuditLog.find({ orgId })
    .populate('actorId', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  const headers = [
    'Log ID',
    'Timestamp (UTC)',
    'Event Action',
    'Actor Name',
    'Actor Email',
    'Target Entity',
    'Target ID',
    'Metadata & Context',
  ];

  const rows = [headers.join(',')];

  for (const log of logs) {
    const actorName = log.actorId?.name || 'System / Auto Engine';
    const actorEmail = log.actorId?.email || 'system@haven.local';
    const metaString = log.meta ? JSON.stringify(log.meta) : '';

    const row = [
      escapeCsvField(log._id),
      escapeCsvField(log.createdAt?.toISOString ? log.createdAt.toISOString() : new Date(log.createdAt).toISOString()),
      escapeCsvField(log.action),
      escapeCsvField(actorName),
      escapeCsvField(actorEmail),
      escapeCsvField(log.targetType),
      escapeCsvField(log.targetId),
      escapeCsvField(metaString),
    ];
    rows.push(row.join(','));
  }

  return rows.join('\r\n');
}
