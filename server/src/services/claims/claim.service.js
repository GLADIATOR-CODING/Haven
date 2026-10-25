import { Claim } from '../../models/Claim.js';
import { Report } from '../../models/Report.js';
import { AuditLog } from '../../models/AuditLog.js';
import { ApiError } from '../../utils/ApiError.js';
import { evaluateClaimAnswers } from './verify.js';
import { publicView } from '../reports/serializer.js';

export async function createClaim(org, user, payload) {
  const { foundId, lostId = null, answers = [] } = payload;

  if (!foundId) {
    throw new ApiError(400, 'MISSING_FOUND_ID', 'Found item identifier is required.');
  }

  // 1. Abuse Protection: check max attempts per user per item
  const maxAttempts = org.claimPolicy?.maxAttempts || 3;
  const attemptsCount = await Claim.countDocuments({
    orgId: org._id,
    foundId,
    claimantId: user._id,
  });

  if (attemptsCount >= maxAttempts) {
    throw new ApiError(
      429,
      'MAX_ATTEMPTS_EXCEEDED',
      `You have reached the maximum allowed verification attempts (${maxAttempts}) for this item.`
    );
  }

  // 2. Check for active existing claim by this user
  const existingActiveClaim = await Claim.findOne({
    orgId: org._id,
    foundId,
    claimantId: user._id,
    status: { $in: ['submitted', 'needs_info', 'approved'] },
  });

  if (existingActiveClaim) {
    throw new ApiError(
      400,
      'CLAIM_ALREADY_EXISTS',
      'You already have an active claim on this item. Track it in your Activity dashboard.'
    );
  }

  // 3. Atomic race-condition lock: Transition status from 'published' to 'claim_pending'
  const lockedReport = await Report.findOneAndUpdate(
    { _id: foundId, orgId: org._id, status: 'published' },
    { status: 'claim_pending' },
    { new: true }
  ).select('+privateDetails');

  if (!lockedReport) {
    throw new ApiError(
      409,
      'ALREADY_CLAIMING',
      'Someone else is claiming this item right now, or it is no longer published.'
    );
  }

  // 4. Sensitivity and Auto-approval logic:
  // Non-sensitive items are auto-approved immediately.
  // Sensitive categories require desk moderator/admin approval.
  const categoryConfig = org.categories?.find((c) => c.key === lockedReport.category);
  const isCategorySensitive = categoryConfig?.sensitive ?? false;
  const isReportSensitive = lockedReport.isSensitive ?? false;
  const isSensitive = isCategorySensitive || isReportSensitive;

  let claimStatus = 'submitted';
  let handoverCode = '';
  let decidedAt = undefined;
  let decisionNote = '';
  let autoCheck = [];

  if (!isSensitive) {
    // Standard non-sensitive item: ALWAYS AUTO-APPROVE IMMEDIATELY
    claimStatus = 'approved';
    handoverCode = Math.floor(100000 + Math.random() * 900000).toString();
    decidedAt = new Date();
    decisionNote = 'Auto-approved for standard custody item';
  } else {
    // Sensitive item: evaluate submitted verification answers against custody details
    const evaluation = await evaluateClaimAnswers(
      answers,
      lockedReport.privateDetails || []
    );
    autoCheck = evaluation.autoCheck || [];
    const matchCount = evaluation.matchCount || 0;
    const canAutoApprove = categoryConfig?.autoApproveClaims ?? false;
    const minMatchingDetails = org.claimPolicy?.minMatchingDetails || 1;

    if (canAutoApprove && matchCount >= minMatchingDetails) {
      claimStatus = 'approved';
      handoverCode = Math.floor(100000 + Math.random() * 900000).toString();
      decidedAt = new Date();
      decisionNote = 'Auto-approved via deterministic matching criteria';
    } else {
      claimStatus = 'submitted';
      decisionNote = 'Pending verification by desk moderator';
    }
  }

  // 5. Persist Claim
  const claim = await Claim.create({
    orgId: org._id,
    foundId,
    lostId: lostId || undefined,
    claimantId: user._id,
    answers: answers.map((a) => ({ key: a.key, label: a.label || '', value: a.value || '' })),
    autoCheck,
    status: claimStatus,
    decisionNote,
    handoverCode,
    decidedAt,
  });

  return {
    claim: {
      id: claim._id,
      status: claim.status,
      handoverCode: claim.handoverCode,
      createdAt: claim.createdAt,
      decidedAt: claim.decidedAt,
      autoApproved: claimStatus === 'approved',
    },
    foundReport: publicView(lockedReport, categoryConfig, org.locations),
    handoverInstructions: org.handoverInstructions || 'Desk handover at campus reception.',
  };
}

export async function getMyClaims(orgId, userId, org) {
  const claims = await Claim.find({ orgId, claimantId: userId })
    .populate('foundId')
    .sort({ createdAt: -1 });

  return claims
    .filter((c) => c.foundId)
    .map((c) => {
      const categoryConfig = org.categories?.find((cat) => cat.key === c.foundId.category);
      return {
        id: c._id,
        status: c.status,
        handoverCode: c.handoverCode,
        handoverAttempts: c.handoverAttempts,
        decisionNote: c.decisionNote,
        createdAt: c.createdAt,
        decidedAt: c.decidedAt,
        answersCount: c.answers?.length || 0,
        foundItem: publicView(c.foundId, categoryConfig, org.locations),
      };
    });
}

export async function getClaimById(orgId, claimId, user, org) {
  const claim = await Claim.findOne({ _id: claimId, orgId }).populate('foundId');
  if (!claim) {
    throw new ApiError(404, 'CLAIM_NOT_FOUND', 'Claim record not found');
  }

  const categoryConfig = org.categories?.find((cat) => cat.key === claim.foundId.category);
  return {
    id: claim._id,
    status: claim.status,
    handoverCode: claim.handoverCode,
    decisionNote: claim.decisionNote,
    createdAt: claim.createdAt,
    decidedAt: claim.decidedAt,
    foundItem: publicView(claim.foundId, categoryConfig, org.locations),
  };
}

/**
 * Formats duration between date and now into concise age badge (e.g., '15m', '3h', '2d')
 */
export function formatWaitingAge(createdAt) {
  if (!createdAt) return 'Waiting 0m';
  const diffMs = Math.max(0, Date.now() - new Date(createdAt).getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `Waiting ${Math.max(1, mins)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Waiting ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Waiting ${days}d`;
}

export async function getOrgClaims(orgId, filters = {}, org) {
  const query = { orgId };
  if (filters.status) {
    query.status = filters.status;
  }

  const claims = await Claim.find(query)
    .populate({
      path: 'foundId',
      select: '+privateDetails',
    })
    .populate('claimantId', 'name email avatar')
    .sort({ createdAt: -1 });

  // Priority sorting: Sensitive category items first, followed by oldest age
  const validClaims = claims.filter((c) => c.foundId);
  validClaims.sort((a, b) => {
    const catA = org.categories?.find((c) => c.key === a.foundId?.category);
    const catB = org.categories?.find((c) => c.key === b.foundId?.category);
    const isSensA = catA?.sensitive || a.foundId?.isSensitive ? 1 : 0;
    const isSensB = catB?.sensitive || b.foundId?.isSensitive ? 1 : 0;

    if (isSensA !== isSensB) {
      return isSensB - isSensA; // Sensitive first
    }
    // Oldest age first (ascending createdAt)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return validClaims.map((c) => {
    const categoryConfig = org.categories?.find((cat) => cat.key === c.foundId.category);
    const finderPrivateDetails = (c.foundId.privateDetails || []).map((p) => ({
      key: p.key,
      label: p.label || p.key,
      kind: p.kind || 'text',
      value: p.kind === 'secret' ? '•••••••• [Secret HMAC verified]' : p.value || '',
    }));

    return {
      id: c._id,
      status: c.status,
      handoverCode: c.handoverCode,
      handoverAttempts: c.handoverAttempts || 0,
      decisionNote: c.decisionNote,
      createdAt: c.createdAt,
      decidedAt: c.decidedAt,
      waitingAge: formatWaitingAge(c.createdAt),
      waitingMinutes: Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 60000),
      answers: c.answers || [],
      autoCheck: c.autoCheck || [],
      finderPrivateDetails,
      claimant: c.claimantId
        ? {
            id: c.claimantId._id,
            name: c.claimantId.name,
            email: c.claimantId.email,
            avatar: c.claimantId.avatar,
          }
        : null,
      foundItem: publicView(c.foundId, categoryConfig, org.locations),
    };
  });
}

export async function reviewClaim(orgId, claimId, moderatorUser, { action, decisionNote = '' }, org) {
  const claim = await Claim.findOne({ _id: claimId, orgId }).populate('foundId');
  if (!claim) {
    throw new ApiError(404, 'CLAIM_NOT_FOUND', 'Claim not found');
  }

  if (action === 'approve') {
    claim.status = 'approved';
    if (!claim.handoverCode) {
      claim.handoverCode = Math.floor(100000 + Math.random() * 900000).toString();
    }
    claim.moderatorId = moderatorUser._id;
    claim.decidedAt = new Date();
    claim.decisionNote = decisionNote || 'Approved by desk moderator';
    await claim.save();

    // Ensure found report remains locked in claim_pending awaiting physical pickup
    await Report.findByIdAndUpdate(claim.foundId._id, { status: 'claim_pending' });

    await AuditLog.create({
      orgId,
      actorId: moderatorUser._id,
      action: 'CLAIM_APPROVED',
      targetType: 'Claim',
      targetId: claim._id,
      meta: {
        foundId: claim.foundId._id,
        claimantId: claim.claimantId,
        handoverCode: claim.handoverCode,
      },
    });
  } else if (action === 'reject') {
    claim.status = 'rejected';
    claim.moderatorId = moderatorUser._id;
    claim.decidedAt = new Date();
    claim.decisionNote = decisionNote || 'Rejected by desk moderator';
    await claim.save();

    // Release the report back to published so it reappears in feed for other claimants!
    await Report.findByIdAndUpdate(claim.foundId._id, { status: 'published' });

    await AuditLog.create({
      orgId,
      actorId: moderatorUser._id,
      action: 'CLAIM_REJECTED',
      targetType: 'Claim',
      targetId: claim._id,
      meta: {
        foundId: claim.foundId._id,
        claimantId: claim.claimantId,
        reason: claim.decisionNote,
      },
    });
  } else if (action === 'request_info') {
    claim.status = 'needs_info';
    claim.moderatorId = moderatorUser._id;
    claim.decidedAt = new Date();
    claim.decisionNote = decisionNote || 'Additional clarification requested by desk moderator';
    await claim.save();

    await AuditLog.create({
      orgId,
      actorId: moderatorUser._id,
      action: 'CLAIM_NEEDS_INFO',
      targetType: 'Claim',
      targetId: claim._id,
      meta: {
        foundId: claim.foundId._id,
        claimantId: claim.claimantId,
        note: claim.decisionNote,
      },
    });
  } else {
    throw new ApiError(400, 'INVALID_ACTION', "Action must be 'approve', 'reject', or 'request_info'");
  }

  const categoryConfig = org.categories?.find((cat) => cat.key === claim.foundId.category);
  return {
    claim: {
      id: claim._id,
      status: claim.status,
      handoverCode: claim.handoverCode,
      decisionNote: claim.decisionNote,
      decidedAt: claim.decidedAt,
    },
    foundItem: publicView(claim.foundId, categoryConfig, org.locations),
  };
}

export async function verifyHandover(orgId, payload, moderatorUser, org) {
  const { claimId, handoverCode } = payload;
  if (!handoverCode) {
    throw new ApiError(400, 'MISSING_CODE', 'Handover verification code is required');
  }

  const cleanCode = handoverCode.trim();
  const query = { orgId, status: 'approved' };
  if (claimId) {
    query._id = claimId;
  } else {
    query.handoverCode = cleanCode;
  }

  const claim = await Claim.findOne(query).populate('foundId').populate('claimantId', 'name email');
  if (!claim) {
    throw new ApiError(404, 'CLAIM_NOT_FOUND', 'No approved claim matching this verification code');
  }

  if (claim.handoverCode !== cleanCode) {
    claim.handoverAttempts = (claim.handoverAttempts || 0) + 1;
    if (claim.handoverAttempts >= 5) {
      claim.status = 'rejected';
      claim.decisionNote = 'Locked: exceeded 5 invalid handover code attempts';
      await claim.save();
      await Report.findByIdAndUpdate(claim.foundId._id, { status: 'published' });

      await AuditLog.create({
        orgId,
        actorId: moderatorUser._id,
        action: 'HANDOVER_LOCKED_ABUSE',
        targetType: 'Claim',
        targetId: claim._id,
        meta: { attempts: claim.handoverAttempts, foundId: claim.foundId._id },
      });

      throw new ApiError(403, 'CODE_LOCKED', 'Handover code locked due to 5 failed attempts. Item released.');
    }
    await claim.save();
    throw new ApiError(400, 'INVALID_CODE', `Invalid code. ${5 - claim.handoverAttempts} attempts remaining.`);
  }

  // Code verified! Transition claim to collected and report to handed_over
  claim.status = 'collected';
  claim.moderatorId = moderatorUser._id;
  claim.decidedAt = new Date();
  claim.decisionNote = 'Physical custody handover completed at desk';
  await claim.save();

  await Report.findByIdAndUpdate(claim.foundId._id, { status: 'handed_over' });

  // Transition linked Lost Report to 'resolved'
  if (claim.lostId) {
    await Report.findByIdAndUpdate(claim.lostId, { status: 'resolved' });
  }

  // Immutable AuditLog entry
  await AuditLog.create({
    orgId,
    actorId: moderatorUser._id,
    action: 'HANDOVER_VERIFIED',
    targetType: 'Claim',
    targetId: claim._id,
    meta: {
      foundId: claim.foundId._id,
      lostId: claim.lostId || null,
      claimantId: claim.claimantId?._id || claim.claimantId,
      handoverCode: cleanCode,
    },
  });

  const categoryConfig = org.categories?.find((cat) => cat.key === claim.foundId.category);
  return {
    success: true,
    message: 'Custody successfully handed over to verified owner!',
    claim: {
      id: claim._id,
      status: claim.status,
      claimant: claim.claimantId ? { name: claim.claimantId.name, email: claim.claimantId.email } : null,
    },
    foundItem: publicView(claim.foundId, categoryConfig, org.locations),
  };
}

