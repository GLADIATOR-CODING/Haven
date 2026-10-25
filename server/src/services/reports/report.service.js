import { Report } from '../../models/Report.js';
import { ApiError } from '../../utils/ApiError.js';
import { hashSecret } from '../../utils/hmac.js';
import { publicView } from './serializer.js';
import { processAndSaveImage } from '../storage/storage.service.js';
import { runMatchingForReport } from '../matching/matching.service.js';
import { validateReportTransition } from './stateMachine.js';

export async function createReport(org, user, payload, fileBuffer = null) {
  const {
    type,
    category,
    title = '',
    description = '',
    colors = [],
    brand = '',
    location,
    locationNote = '',
    occurredFrom,
    occurredTo,
    geo = null,
    privateDetailsInput = [],
  } = payload;

  // 1. Verify category against org configuration
  const categoryConfig = org.categories.find((c) => c.key === category);
  if (!categoryConfig) {
    throw new ApiError(400, 'INVALID_CATEGORY', `Category '${category}' is not configured in this organization`);
  }

  // 2. Verify location against org configuration
  const locationConfig = org.locations.find((l) => l.key === location);
  if (!locationConfig) {
    throw new ApiError(400, 'INVALID_LOCATION', `Location '${location}' is not configured in this organization`);
  }

  // 3. Determine initial status based on type and sensitive flag
  let initialStatus;
  if (type === 'found') {
    initialStatus = categoryConfig.sensitive ? 'pending_review' : 'published';
  } else {
    initialStatus = 'open';
  }

  // 4. Expiration timestamp
  const expiryDays = org.expiryDays || 60;
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

  // 5. Process image upload if provided
  let photo = { url: '', publicId: '' };
  if (fileBuffer) {
    const uploaded = await processAndSaveImage(fileBuffer);
    if (uploaded) {
      photo = uploaded;
    }
  }

  // 6. Process private verification details (FOUND reports only)
  const processedPrivateDetails = [];
  if (type === 'found' && Array.isArray(privateDetailsInput)) {
    for (const item of privateDetailsInput) {
      const promptDef = categoryConfig.verificationPrompts.find((p) => p.key === item.key);
      const kind = promptDef ? promptDef.kind : item.kind || 'text';
      const label = promptDef ? promptDef.label : item.label || item.key;

      if (kind === 'secret') {
        processedPrivateDetails.push({
          key: item.key,
          label,
          kind: 'secret',
          valueHash: hashSecret(item.value || ''), // Store normalized HMAC hash only!
          value: '', // Never store plaintext secret
        });
      } else {
        processedPrivateDetails.push({
          key: item.key,
          label,
          kind: 'text',
          value: (item.value || '').trim(),
          valueHash: '',
        });
      }
    }
  }

  // 7. Dates handling
  const fromDate = occurredFrom ? new Date(occurredFrom) : new Date();
  const toDate = occurredTo ? new Date(occurredTo) : fromDate;

  // 8. Geo coordinates handling (if provided)
  let geoCoordinates = undefined;
  if (geo && typeof geo === 'object' && geo.lat != null && geo.lng != null) {
    geoCoordinates = {
      lat: Number(geo.lat),
      lng: Number(geo.lng),
      accuracy: geo.accuracy ? Number(geo.accuracy) : undefined,
    };
  }

  // 9. Create Report
  const report = await Report.create({
    orgId: org._id,
    type,
    status: initialStatus,
    reporterId: user._id,
    category,
    title,
    description,
    colors: Array.isArray(colors) ? colors : [colors].filter(Boolean),
    brand,
    location,
    locationNote,
    occurredFrom: fromDate,
    occurredTo: toDate,
    photo,
    geo: geoCoordinates,
    privateDetails: processedPrivateDetails,
    expiresAt,
  });

  // 10. Run deterministic inline matching engine
  let matches = [];
  try {
    matches = await runMatchingForReport(report, org);
  } catch (err) {
    console.error('Matching engine inline run failed:', err);
  }

  const serialized = publicView(report, categoryConfig, org.locations);
  return {
    ...serialized,
    report: serialized,
    matches,
  };
}

export async function getMyReports(orgId, userId, org) {
  const reports = await Report.find({ orgId, reporterId: userId }).sort({ createdAt: -1 });

  return reports.map((r) => {
    const cat = org.categories.find((c) => c.key === r.category);
    return publicView(r, cat, org.locations);
  });
}

export async function getPublishedFoundReports(orgId, filters = {}, org, userRole = 'member') {
  let targetStatus;
  const isPrivileged = userRole === 'admin' || userRole === 'moderator';

  if (isPrivileged && filters.status === 'pending_review') {
    targetStatus = 'pending_review';
  } else if (filters.status === 'published_only') {
    targetStatus = 'published';
  } else if (filters.status) {
    targetStatus = filters.status;
  } else {
    // Default public feed: includes both 'published' and 'claim_pending' (so items do not vanish when claimed)
    targetStatus = { $in: ['published', 'claim_pending'] };
  }

  const query = {
    orgId,
    type: 'found',
    status: targetStatus,
    expiresAt: { $gt: new Date() },
  };

  if (filters.category) {
    query.category = filters.category;
  }
  if (filters.location) {
    query.location = filters.location;
  }
  if (filters.color) {
    query.colors = filters.color;
  }

  // Text search query across title, description, and brand
  if (filters.q && typeof filters.q === 'string' && filters.q.trim()) {
    const term = filters.q.trim();
    query.$or = [
      { title: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } },
      { brand: { $regex: term, $options: 'i' } },
      { locationNote: { $regex: term, $options: 'i' } },
    ];
  }

  const reports = await Report.find(query).sort({ occurredFrom: -1 }).limit(100);

  return reports.map((r) => {
    const cat = org.categories.find((c) => c.key === r.category);
    return publicView(r, cat, org.locations);
  });
}

export async function reviewReport(reportId, action, reviewerId, org) {
  const report = await Report.findOne({ _id: reportId, orgId: org._id });
  if (!report) {
    throw new ApiError(404, 'REPORT_NOT_FOUND', 'Report not found');
  }

  if (report.status !== 'pending_review') {
    throw new ApiError(400, 'INVALID_STATUS', `Report status is '${report.status}', not pending_review`);
  }

  if (action === 'approve') {
    report.status = 'published';
  } else if (action === 'reject') {
    report.status = 'rejected';
  } else {
    throw new ApiError(400, 'INVALID_ACTION', 'Action must be approve or reject');
  }

  await report.save();

  if (action === 'approve') {
    try {
      const { runMatchingForReport } = await import('../matching/matching.service.js');
      await runMatchingForReport(report, org);
    } catch (err) {
      console.error('Matching on reviewed report failed:', err);
    }
  }

  const cat = org.categories.find((c) => c.key === report.category);
  return publicView(report, cat, org.locations);
}


export async function getReportById(orgId, reportId, user, role, org) {
  const isModOrAdmin = ['moderator', 'admin'].includes(role);

  // If mod or admin, include privateDetails for inspection
  const query = Report.findOne({ _id: reportId, orgId });
  if (isModOrAdmin) {
    query.select('+privateDetails');
  }

  const report = await query.exec();
  if (!report) {
    throw new ApiError(404, 'REPORT_NOT_FOUND', 'Report not found');
  }

  const categoryConfig = org.categories.find((c) => c.key === report.category);

  if (isModOrAdmin) {
    // Moderators/Admins see full report including verification details
    return report;
  }

  // Regular members see strictly serialized public view
  return publicView(report, categoryConfig, org.locations);
}

export async function updateReportStatus(orgId, reportId, user, role, toStatus, org) {
  const report = await Report.findOne({ _id: reportId, orgId });
  if (!report) {
    throw new ApiError(404, 'REPORT_NOT_FOUND', 'Report not found');
  }

  const isReporter = report.reporterId.toString() === user._id.toString();
  const isModOrAdmin = ['moderator', 'admin'].includes(role);

  if (!isReporter && !isModOrAdmin) {
    throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to update this report status');
  }

  validateReportTransition(report.type, report.status, toStatus);
  report.status = toStatus;
  await report.save();

  const categoryConfig = org.categories.find((c) => c.key === report.category);
  return publicView(report, categoryConfig, org.locations);
}
