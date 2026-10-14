import * as orgService from '../services/org.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createOrg = asyncHandler(async (req, res) => {
  const result = await orgService.createOrg(req.body, req.user._id);
  res.status(201).json(result);
});

export const joinOrg = asyncHandler(async (req, res) => {
  const result = await orgService.joinOrg(req.body, req.user._id);
  res.status(200).json(result);
});

export const getOrgConfig = asyncHandler(async (req, res) => {
  const orgObj = req.org.toObject ? req.org.toObject() : { ...req.org };
  // The 8-digit access code is strictly for admins. NEVER leak to non-admins!
  if (req.membership?.role !== 'admin') {
    delete orgObj.join;
  }
  res.status(200).json({
    org: orgObj,
    currentRole: req.membership.role,
  });
});

export const updateOrgConfig = asyncHandler(async (req, res) => {
  const updated = await orgService.updateOrgSettings(req.org._id, req.body);
  res.status(200).json({ org: updated });
});

export const rotateInviteCode = asyncHandler(async (req, res) => {
  const result = await orgService.rotateInviteCode(req.org._id);
  res.status(200).json(result);
});

export const getMembers = asyncHandler(async (req, res) => {
  const members = await orgService.getMembers(req.org._id);
  res.status(200).json({ members });
});

export const updateMemberRole = asyncHandler(async (req, res) => {
  const updated = await orgService.updateMemberRole(
    req.org._id,
    req.params.userId,
    req.body.role,
    req.user._id
  );
  res.status(200).json({ membership: updated });
});
