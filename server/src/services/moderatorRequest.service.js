import { ModeratorRequest } from '../models/ModeratorRequest.js';
import { Membership } from '../models/Membership.js';
import { ApiError } from '../utils/ApiError.js';

export async function createModeratorRequest(orgId, userId, { reason, contactInfo }) {
  if (!reason || !reason.trim()) {
    throw new ApiError(400, 'REASON_REQUIRED', 'Please provide a reason or custody desk role description for your moderator application.');
  }

  const membership = await Membership.findOne({ orgId, userId });
  if (!membership) {
    throw new ApiError(403, 'NOT_A_MEMBER', 'You must join this workspace first before applying for a staff role.');
  }

  if (membership.role === 'admin' || membership.role === 'moderator') {
    throw new ApiError(400, 'ALREADY_STAFF', `You already hold the '${membership.role}' role in this workspace.`);
  }

  const existingPending = await ModeratorRequest.findOne({
    orgId,
    userId,
    status: 'pending',
  });

  if (existingPending) {
    existingPending.reason = reason.trim();
    if (contactInfo !== undefined) existingPending.contactInfo = contactInfo.trim();
    await existingPending.save();
    return existingPending;
  }

  const request = await ModeratorRequest.create({
    orgId,
    userId,
    reason: reason.trim(),
    contactInfo: contactInfo ? contactInfo.trim() : '',
    status: 'pending',
  });

  return request;
}

export async function getModeratorRequests(orgId, userId, role) {
  if (role === 'admin') {
    return ModeratorRequest.find({ orgId })
      .populate('userId', 'name email avatar phoneNumber createdAt')
      .sort({ createdAt: -1 });
  }

  // Members can only see their own requests for this org
  return ModeratorRequest.find({ orgId, userId }).sort({ createdAt: -1 });
}

export async function reviewModeratorRequest(orgId, requestId, action, adminId) {
  const reqDoc = await ModeratorRequest.findOne({ _id: requestId, orgId });
  if (!reqDoc) {
    throw new ApiError(404, 'REQUEST_NOT_FOUND', 'Moderator application not found');
  }

  if (reqDoc.status !== 'pending') {
    throw new ApiError(400, 'ALREADY_REVIEWED', `This application has already been ${reqDoc.status}`);
  }

  if (action === 'approve') {
    reqDoc.status = 'approved';
    reqDoc.reviewedBy = adminId;
    reqDoc.reviewedAt = new Date();
    await reqDoc.save();

    // Elevate user's membership to moderator
    await Membership.findOneAndUpdate(
      { orgId, userId: reqDoc.userId },
      { role: 'moderator' },
      { new: true }
    );
  } else if (action === 'reject') {
    reqDoc.status = 'rejected';
    reqDoc.reviewedBy = adminId;
    reqDoc.reviewedAt = new Date();
    await reqDoc.save();
  } else {
    throw new ApiError(400, 'INVALID_ACTION', 'Action must be approve or reject');
  }

  return reqDoc.populate('userId', 'name email avatar phoneNumber');
}
