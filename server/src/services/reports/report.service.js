import { Report } from '../../models/Report.js';
import { ApiError } from '../../utils/ApiError.js';
import { hashSecret } from '../../utils/hmac.js';
import { publicView } from './serializer.js';
import { processAndSaveImage } from '../storage/storage.service.js';

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

  // 8. Create Report
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
    privateDetails: processedPrivateDetails,
    expiresAt,
  });

  return publicView(report, categoryConfig);
}

export async function getMyReports(orgId, userId, org) {
  const reports = await Report.find({ orgId, reporterId: userId }).sort({ createdAt: -1 });

  return reports.map((r) => {
    const cat = org.categories.find((c) => c.key === r.category);
    return publicView(r, cat);
  });
}

export async function getPublishedFoundReports(orgId, filters = {}, org) {
  const query = {
    orgId,
    type: 'found',
    status: 'published',
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

  const reports = await Report.find(query).sort({ occurredFrom: -1 }).limit(100);

  return reports.map((r) => {
    const cat = org.categories.find((c) => c.key === r.category);
    return publicView(r, cat);
  });
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
  return publicView(report, categoryConfig);
}
