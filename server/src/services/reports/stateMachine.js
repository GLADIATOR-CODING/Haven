import { ApiError } from '../../utils/ApiError.js';

const foundTransitions = {
  pending_review: ['published', 'rejected'],
  published: ['claim_pending', 'expired'],
  claim_pending: ['published', 'handed_over'],
  handed_over: [],
  rejected: [],
  expired: [],
};

const lostTransitions = {
  open: ['matched', 'resolved', 'expired'],
  matched: ['open', 'resolved', 'expired'],
  resolved: [],
  expired: [],
};

const claimTransitions = {
  submitted: ['approved', 'rejected', 'needs_info'],
  needs_info: ['submitted', 'rejected'],
  approved: ['collected', 'rejected'],
  collected: [],
  rejected: [],
};

export function canTransitionReport(type, fromStatus, toStatus) {
  if (fromStatus === toStatus) return true;
  const table = type === 'found' ? foundTransitions : lostTransitions;
  const allowed = table[fromStatus] || [];
  return allowed.includes(toStatus);
}

export function validateReportTransition(type, fromStatus, toStatus) {
  if (!canTransitionReport(type, fromStatus, toStatus)) {
    throw new ApiError(
      409,
      'ILLEGAL_TRANSITION',
      `Cannot transition ${type} report from '${fromStatus}' to '${toStatus}'`
    );
  }
}

export function canTransitionClaim(fromStatus, toStatus) {
  if (fromStatus === toStatus) return true;
  const allowed = claimTransitions[fromStatus] || [];
  return allowed.includes(toStatus);
}

export function validateClaimTransition(fromStatus, toStatus) {
  if (!canTransitionClaim(fromStatus, toStatus)) {
    throw new ApiError(
      409,
      'ILLEGAL_TRANSITION',
      `Cannot transition claim from '${fromStatus}' to '${toStatus}'`
    );
  }
}
