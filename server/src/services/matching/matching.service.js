import { Match } from '../../models/Match.js';
import { Report } from '../../models/Report.js';
import { scorePair, scorePairAsync } from './scorer.js';
import { generateExplanation } from './explainer.js';
import { publicView } from '../reports/serializer.js';
import { ApiError } from '../../utils/ApiError.js';
import { createNotification } from '../notification.service.js';

/**
 * Inline matching service: Triggered right after a report is created or updated.
 * Connects lost reports with published found reports deterministically.
 */
export async function runMatchingForReport(report, org) {
  const isLost = report.type === 'lost';
  const targetType = isLost ? 'found' : 'lost';
  const targetStatus = isLost ? 'published' : { $in: ['open', 'matched'] };

  const timeWindowHours = org.timeWindowHours || 72;
  const timeThreshold = new Date(Date.now() - timeWindowHours * 3600000);

  // Step 1: Candidate filter query (capped at 50 candidates)
  const candidates = await Report.find({
    orgId: org._id,
    type: targetType,
    status: targetStatus,
    category: report.category,
    occurredFrom: { $gte: timeThreshold },
    expiresAt: { $gt: new Date() },
  })
    .limit(50)
    .sort({ occurredFrom: -1 });

  const createdMatches = [];
  let foundHighMatch = false;

  // Step 2: Deterministic scoring & explanation for each candidate
  for (const candidate of candidates) {
    const lostReport = isLost ? report : candidate;
    const foundReport = isLost ? candidate : report;

    const scoreResult = await scorePairAsync(lostReport, foundReport, org);

    // If score meets or exceeds sensitivity threshold
    if (scoreResult.isMatch) {
      if (scoreResult.band === 'high') {
        foundHighMatch = true;
      }

      const explanation = generateExplanation(lostReport, foundReport, scoreResult, org);

      const matchDoc = await Match.findOneAndUpdate(
        { lostId: lostReport._id, foundId: foundReport._id },
        {
          orgId: org._id,
          lostId: lostReport._id,
          foundId: foundReport._id,
          score: scoreResult.score,
          band: scoreResult.band,
          breakdown: scoreResult.breakdown,
          explanation,
          status: 'suggested',
        },
        { upsert: true, new: true }
      );

      if (lostReport.userId) {
        await createNotification({
          orgId: org._id,
          userId: lostReport.userId,
          type: 'match_found',
          title: 'New Match Found',
          message: `A found item closely matches your lost item with ${(scoreResult.score * 100).toFixed(0)}% confidence: ${explanation.headline}`,
          link: `/o/${org.slug || ''}/activity`,
          meta: { lostId: lostReport._id, foundId: foundReport._id, score: scoreResult.score },
        });
      }

      const categoryConfig = org.categories?.find((c) => c.key === report.category);
      const pairedReport = isLost ? foundReport : lostReport;

      createdMatches.push({
        id: matchDoc._id,
        score: matchDoc.score,
        band: matchDoc.band,
        breakdown: matchDoc.breakdown,
        explanation: matchDoc.explanation,
        status: matchDoc.status,
        createdAt: matchDoc.createdAt,
        pairedReport: publicView(pairedReport, categoryConfig, org.locations),
      });
    }
  }

  // If lost report has high match, update status to 'matched'
  if (isLost && foundHighMatch && report.status === 'open') {
    report.status = 'matched';
    await report.save();
  }

  return createdMatches;
}

/**
 * Get matches for a specific report (sanitized via publicView).
 */
export async function getMatchesForReport(orgId, reportId, user, role, org) {
  const report = await Report.findOne({ _id: reportId, orgId }).select('reporterId');
  if (!report) {
    throw new ApiError(404, 'REPORT_NOT_FOUND', 'Report not found');
  }

  const isStaff = role === 'admin' || role === 'moderator';
  if (!isStaff && report.reporterId.toString() !== user._id.toString()) {
    throw new ApiError(404, 'REPORT_NOT_FOUND', 'Report not found');
  }

  const matches = await Match.find({
    orgId,
    $or: [{ lostId: reportId }, { foundId: reportId }],
    status: { $ne: 'dismissed' },
  })
    .populate('lostId')
    .populate('foundId')
    .sort({ score: -1 });

  return matches
    .filter((m) => m.lostId && m.foundId)
    .map((m) => {
      const isLostReport = m.lostId._id.toString() === reportId.toString();
      const pairedDoc = isLostReport ? m.foundId : m.lostId;
      const categoryConfig = org.categories?.find((c) => c.key === pairedDoc.category);

      return {
        id: m._id,
        score: m.score,
        band: m.band,
        breakdown: m.breakdown,
        explanation: m.explanation,
        status: m.status,
        createdAt: m.createdAt,
        lostId: m.lostId._id,
        foundId: m.foundId._id,
        pairedReport: publicView(pairedDoc, categoryConfig, org.locations),
      };
    });
}

/**
 * Dismiss a suggested match.
 */
export async function dismissMatch(orgId, matchId, user, role) {
  const match = await Match.findOne({ _id: matchId, orgId }).populate('lostId', 'reporterId');

  if (!match) {
    throw new ApiError(404, 'MATCH_NOT_FOUND', 'Match not found');
  }

  const isStaff = role === 'admin' || role === 'moderator';
  if (!isStaff && match.lostId?.reporterId?.toString() !== user._id.toString()) {
    throw new ApiError(404, 'MATCH_NOT_FOUND', 'Match not found');
  }

  match.status = 'dismissed';
  await match.save();

  return match;
}
